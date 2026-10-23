"""SQLAlchemy models for RiskPulse: accounts, transactions, risk flags, audit log."""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def gen_uuid() -> str:
    return str(uuid.uuid4())


class FlagStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    ESCALATED = "ESCALATED"
    BLOCKED = "BLOCKED"


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, default=gen_uuid)
    holder_name = Column(String, nullable=False)
    account_number = Column(String, unique=True, nullable=False)
    balance_cents = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="account")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=gen_uuid)
    account_id = Column(String, ForeignKey("accounts.id"), nullable=False)
    payee_name = Column(String, nullable=False)
    payee_id = Column(String, nullable=False)
    amount_cents = Column(Integer, nullable=False)
    is_new_payee = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    risk_score = Column(Float, nullable=False, default=0.0)

    account = relationship("Account", back_populates="transactions")
    flag = relationship("RiskFlag", back_populates="transaction", uselist=False)


class RiskFlag(Base):
    __tablename__ = "risk_flags"

    id = Column(String, primary_key=True, default=gen_uuid)
    transaction_id = Column(String, ForeignKey("transactions.id"), unique=True, nullable=False)
    reason_codes = Column(String, nullable=False)  # comma-separated codes
    narrative = Column(Text, nullable=False)
    status = Column(SAEnum(FlagStatus), nullable=False, default=FlagStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String, nullable=True)

    transaction = relationship("Transaction", back_populates="flag")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String, primary_key=True, default=gen_uuid)
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=False)
    action = Column(String, nullable=False)  # SUBMITTED, FLAGGED, APPROVE, ESCALATE, BLOCK
    actor = Column(String, nullable=False)  # 'system' or analyst name
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
