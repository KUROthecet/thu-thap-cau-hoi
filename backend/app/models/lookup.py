from sqlalchemy import BigInteger, Identity, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ExpectedBehaviorOption(Base):
    __tablename__ = "expected_behavior_options"
    __table_args__ = (UniqueConstraint("value", name="uq_expected_behavior_value"),)

    option_id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    value: Mapped[str] = mapped_column(String(64), nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ReviewStatusOption(Base):
    __tablename__ = "review_status_options"
    __table_args__ = (UniqueConstraint("value", name="uq_review_status_value"),)

    option_id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    value: Mapped[str] = mapped_column(String(32), nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
