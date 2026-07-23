from sqlalchemy import BigInteger, ForeignKey, Identity, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class QuestionGroup(Base):
    __tablename__ = "question_groups"
    __table_args__ = (UniqueConstraint("code", name="uq_question_groups_code"),)

    group_id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    code: Mapped[str] = mapped_column(String(10), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    annotate_guidance: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    subgroups: Mapped[list["QuestionSubgroup"]] = relationship(
        "QuestionSubgroup", back_populates="group", order_by="QuestionSubgroup.order_index"
    )


class QuestionSubgroup(Base):
    __tablename__ = "question_subgroups"
    __table_args__ = (UniqueConstraint("code", name="uq_question_subgroups_code"),)

    subgroup_id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    group_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("question_groups.group_id", ondelete="CASCADE"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(10), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    typical_role: Mapped[str | None] = mapped_column(Text, nullable=True)
    expected_retrieval: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    target_count: Mapped[int] = mapped_column(Integer, nullable=False, default=5)

    group: Mapped[QuestionGroup] = relationship("QuestionGroup", back_populates="subgroups")
    examples: Mapped[list["SubgroupExample"]] = relationship(
        "SubgroupExample", back_populates="subgroup", order_by="SubgroupExample.order_index"
    )


class SubgroupExample(Base):
    __tablename__ = "subgroup_examples"

    example_id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    subgroup_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("question_subgroups.subgroup_id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    query: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    subgroup: Mapped[QuestionSubgroup] = relationship("QuestionSubgroup", back_populates="examples")
