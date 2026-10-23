"""Rule-based risk scoring. This is the velocity + amount logic from
docs/workflow-risk-flagging.md (Feature 1), implemented."""
from dataclasses import dataclass, field

LARGE_AMOUNT_CENTS = 500_000  # $5,000 -- new-payee threshold
VERY_LARGE_AMOUNT_CENTS = 1_000_000  # $10,000 -- flagged regardless of payee
VELOCITY_THRESHOLD = 5  # more than 5 new-payee transfers in the window


@dataclass
class RiskAssessment:
    score: float
    reason_codes: list[str] = field(default_factory=list)

    @property
    def is_flagged(self) -> bool:
        return self.score >= 0.5


def assess(amount_cents: int, is_new_payee: bool, velocity_count: int) -> RiskAssessment:
    score = 0.0
    reasons: list[str] = []

    if is_new_payee and amount_cents >= LARGE_AMOUNT_CENTS:
        score += 0.6
        reasons.append("LARGE_AMOUNT_NEW_PAYEE")

    if velocity_count > VELOCITY_THRESHOLD:
        score += 0.5
        reasons.append("VELOCITY_NEW_PAYEE")

    if amount_cents >= VERY_LARGE_AMOUNT_CENTS:
        score += 0.3
        reasons.append("LARGE_AMOUNT")

    return RiskAssessment(score=min(score, 1.0), reason_codes=reasons)
