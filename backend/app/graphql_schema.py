import json
from datetime import datetime
from typing import AsyncGenerator, List, Optional

import strawberry

from .db import SessionLocal
from .models import Account as AccountModel
from .models import AuditLog as AuditLogModel
from .models import FlagStatus
from .models import RiskFlag as RiskFlagModel
from .models import Transaction as TransactionModel
from .redis_client import publish_flag, record_and_check_velocity, subscribe_flags
from .risk_narrative import generate_narrative
from .risk_scoring import assess

DECISION_TO_STATUS = {
    "APPROVE": FlagStatus.APPROVED,
    "ESCALATE": FlagStatus.ESCALATED,
    "BLOCK": FlagStatus.BLOCKED,
}


@strawberry.type
class Account:
    id: str
    holder_name: str
    account_number: str
    balance_cents: int


@strawberry.type
class RiskFlag:
    id: str
    reason_codes: List[str]
    narrative: str
    status: str
    created_at: datetime


@strawberry.type
class Transaction:
    id: str
    account_id: str
    payee_name: str
    amount_cents: int
    is_new_payee: bool
    created_at: datetime
    risk_score: float
    flag: Optional[RiskFlag]


def _to_transaction(t: TransactionModel) -> Transaction:
    flag = None
    if t.flag:
        flag = RiskFlag(
            id=t.flag.id,
            reason_codes=t.flag.reason_codes.split(",") if t.flag.reason_codes else [],
            narrative=t.flag.narrative,
            status=t.flag.status.value,
            created_at=t.flag.created_at,
        )
    return Transaction(
        id=t.id,
        account_id=t.account_id,
        payee_name=t.payee_name,
        amount_cents=t.amount_cents,
        is_new_payee=t.is_new_payee,
        created_at=t.created_at,
        risk_score=t.risk_score,
        flag=flag,
    )


@strawberry.type
class Query:
    @strawberry.field
    def accounts(self) -> List[Account]:
        with SessionLocal() as db:
            rows = db.query(AccountModel).order_by(AccountModel.holder_name).all()
            return [
                Account(
                    id=a.id,
                    holder_name=a.holder_name,
                    account_number=a.account_number,
                    balance_cents=a.balance_cents,
                )
                for a in rows
            ]

    @strawberry.field
    def transactions(self, account_id: Optional[str] = None) -> List[Transaction]:
        with SessionLocal() as db:
            q = db.query(TransactionModel)
            if account_id:
                q = q.filter(TransactionModel.account_id == account_id)
            rows = q.order_by(TransactionModel.created_at.desc()).limit(200).all()
            return [_to_transaction(t) for t in rows]

    @strawberry.field
    def flagged_transactions(self) -> List[Transaction]:
        with SessionLocal() as db:
            rows = (
                db.query(TransactionModel)
                .join(RiskFlagModel)
                .filter(RiskFlagModel.status == FlagStatus.PENDING)
                .order_by(TransactionModel.created_at.desc())
                .all()
            )
            return [_to_transaction(t) for t in rows]


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def submit_transaction(
        self,
        account_id: str,
        payee_name: str,
        payee_id: str,
        amount_cents: int,
        is_new_payee: bool,
    ) -> Transaction:
        velocity_count = await record_and_check_velocity(account_id, is_new_payee)
        assessment = assess(amount_cents, is_new_payee, velocity_count)

        with SessionLocal() as db:
            txn = TransactionModel(
                account_id=account_id,
                payee_name=payee_name,
                payee_id=payee_id,
                amount_cents=amount_cents,
                is_new_payee=is_new_payee,
                risk_score=assessment.score,
            )
            db.add(txn)
            db.flush()
            db.add(AuditLogModel(transaction_id=txn.id, action="SUBMITTED", actor="system"))

            if assessment.is_flagged:
                narrative = generate_narrative(payee_name, amount_cents, assessment.reason_codes)
                db.add(
                    RiskFlagModel(
                        transaction_id=txn.id,
                        reason_codes=",".join(assessment.reason_codes),
                        narrative=narrative,
                        status=FlagStatus.PENDING,
                    )
                )
                db.add(
                    AuditLogModel(
                        transaction_id=txn.id, action="FLAGGED", actor="system", detail=narrative
                    )
                )

            db.commit()
            db.refresh(txn)
            result = _to_transaction(txn)

        if assessment.is_flagged:
            await publish_flag(json.dumps({"transactionId": result.id}))

        return result

    @strawberry.mutation
    def resolve_flag(self, transaction_id: str, decision: str, analyst: str) -> Transaction:
        if decision not in DECISION_TO_STATUS:
            raise ValueError(f"Unknown decision: {decision}")

        with SessionLocal() as db:
            flag = (
                db.query(RiskFlagModel)
                .filter(RiskFlagModel.transaction_id == transaction_id)
                .first()
            )
            if not flag:
                raise ValueError("No pending flag for this transaction")

            flag.status = DECISION_TO_STATUS[decision]
            flag.resolved_at = datetime.utcnow()
            flag.resolved_by = analyst
            db.add(AuditLogModel(transaction_id=transaction_id, action=decision, actor=analyst))
            db.commit()

            txn = db.query(TransactionModel).filter(TransactionModel.id == transaction_id).first()
            return _to_transaction(txn)


@strawberry.type
class Subscription:
    @strawberry.subscription
    async def on_flagged_transaction(self) -> AsyncGenerator[Transaction, None]:
        async for raw in subscribe_flags():
            payload = json.loads(raw)
            with SessionLocal() as db:
                txn = (
                    db.query(TransactionModel)
                    .filter(TransactionModel.id == payload["transactionId"])
                    .first()
                )
                if txn:
                    yield _to_transaction(txn)


schema = strawberry.Schema(query=Query, mutation=Mutation, subscription=Subscription)
