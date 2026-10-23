---
id: f05-generate-claudemd-001
feature: 5
capability: claude-md
variant: treatment
model: unspecified (as configured in Claude Code on the workshop VM)
---

Generate a CLAUDE.md for this repository. Cover: (1) what RiskPulse
is and its architecture -- FastAPI + Strawberry GraphQL + PostgreSQL
+ Redis backend, React + Apollo frontend; (2) how to run it (docker
compose up -d, then docker compose exec backend python -m app.seed);
(3) conventions already established in the code -- GraphQL fields
are camelCase, risk-scoring logic lives in risk_scoring.py, and
risk_narrative.py is deliberately rule-based, not LLM-backed yet
(that's a later lesson); (4) point to docs/workflow-risk-flagging.md
for the human-in-the-loop approval workflow. Keep it concise and
skimmable, not exhaustive.

## Result
- tokens_in: pending
- tokens_out: pending
- wall_clock_s: pending
- correction_turns: pending
- passed: pending
- notes: run directly on VM -- awaiting report back
