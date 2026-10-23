# Transaction risk-flagging workflow

Draft &rarr; Review &rarr; Approve, with a mandatory human gate before anything
is blocked. This is what `backend/app/risk_scoring.py`, `risk_narrative.py`
and the `resolveFlag` mutation implement.

1. **Submit** &mdash; a transaction arrives via `submitTransaction`.
2. **Velocity check (Redis)** &mdash; if the payee is new, record it in a
   10-minute sliding window per account and count new-payee transfers in
   that window.
3. **Rule-based score** &mdash; `risk_scoring.assess()` combines payee
   novelty, amount, and velocity into a 0&ndash;1 score. `is_flagged` is
   `score >= 0.5`.
4. **Draft** &mdash; if flagged, `risk_narrative.generate_narrative()`
   produces a plain-English explanation naming the reasons. This is a
   rule-based draft today; Feature 4 replaces/compares it with a real LLM
   call.
5. **Review** &mdash; the transaction is pushed (Redis pub/sub &rarr; GraphQL
   subscription) to the analyst's Flagged Queue. Nothing happens
   automatically beyond this point.
6. **Approve** &mdash; a human analyst calls `resolveFlag` with `APPROVE`,
   `ESCALATE`, or `BLOCK`. Every decision is written to `audit_log` with the
   analyst's identity and a timestamp. There is no code path that blocks a
   transaction without an analyst decision.

## Why the gate sits here

The gate sits *after* scoring and narrative generation, not before. The
system is allowed to look at a transaction, score it, and explain itself &mdash;
all read-only, no side effects on the transaction's status. The only
state-changing action (`resolveFlag`) requires a human-supplied `analyst`
identity and is the single place `RiskFlag.status` can move out of
`PENDING`. That keeps the automation's job strictly advisory: it surfaces
and explains risk, it never adjudicates it.
