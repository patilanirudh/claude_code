"""Seed demo data so the UI isn't empty on first run.

Run with: python -m app.seed  (from backend/, with DATABASE_URL set)
"""
from .db import SessionLocal, engine
from .models import Account, Base, RiskFlag, Transaction, FlagStatus
from .risk_narrative import generate_narrative
from .risk_scoring import assess

Base.metadata.create_all(bind=engine)

DEMO_ACCOUNTS = [
    {"holder_name": "Maria Chen", "account_number": "RP-10001", "balance_cents": 842_300},
    {"holder_name": "James Okafor", "account_number": "RP-10002", "balance_cents": 213_050},
    {"holder_name": "Priya Nair", "account_number": "RP-10003", "balance_cents": 5_120_000},
]

# (account_index, payee, payee_id, amount_cents, is_new_payee)
DEMO_TRANSACTIONS = [
    (0, "Greenfield Utilities", "payee-001", 12_400, False),
    (0, "Unknown Holdings LLC", "payee-900", 620_000, True),
    (1, "City Rent Co", "payee-002", 185_000, False),
    (2, "Nairobi Exports Ltd", "payee-901", 1_050_000, True),
]


def run() -> None:
    with SessionLocal() as db:
        if db.query(Account).count() > 0:
            print("Seed data already present, skipping.")
            return

        accounts = []
        for data in DEMO_ACCOUNTS:
            acct = Account(**data)
            db.add(acct)
            accounts.append(acct)
        db.flush()

        for acct_idx, payee, payee_id, amount, new_payee in DEMO_TRANSACTIONS:
            txn = Transaction(
                account_id=accounts[acct_idx].id,
                payee_name=payee,
                payee_id=payee_id,
                amount_cents=amount,
                is_new_payee=new_payee,
            )
            assessment = assess(amount, new_payee, velocity_count=0)
            txn.risk_score = assessment.score
            db.add(txn)
            db.flush()

            if assessment.is_flagged:
                narrative = generate_narrative(payee, amount, assessment.reason_codes)
                db.add(
                    RiskFlag(
                        transaction_id=txn.id,
                        reason_codes=",".join(assessment.reason_codes),
                        narrative=narrative,
                        status=FlagStatus.PENDING,
                    )
                )

        db.commit()
        print(f"Seeded {len(accounts)} accounts and {len(DEMO_TRANSACTIONS)} transactions.")


if __name__ == "__main__":
    run()
