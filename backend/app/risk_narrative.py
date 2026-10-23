"""Risk narrative generation.

Deterministic, rule-based explanation generator for now, so the app runs
fully offline with no API keys. Feature 4 of the workshop (model/tool
selection via OpenRouter) plugs a real LLM call in behind this same
`generate_narrative` interface and compares models on cost/quality before
one is picked for production -- this is the seam that lesson replaces.
"""

REASON_TEXT = {
    "LARGE_AMOUNT_NEW_PAYEE": "a transfer of this size to a payee the account hasn't paid before",
    "VELOCITY_NEW_PAYEE": "an unusually high number of transfers to new payees in a short window",
    "LARGE_AMOUNT": "an amount well above this account's typical transaction size",
}


def generate_narrative(payee_name: str, amount_cents: int, reason_codes: list[str]) -> str:
    amount = amount_cents / 100

    if not reason_codes:
        return f"Transaction of ${amount:,.2f} to {payee_name} did not trigger any risk rules."

    reasons = [REASON_TEXT.get(code, code) for code in reason_codes]
    reason_text = "; ".join(reasons)
    return (
        f"Flagged a ${amount:,.2f} transfer to {payee_name} for review: {reason_text}. "
        f"No action has been taken automatically -- an analyst must approve, escalate, "
        f"or block this transaction."
    )
