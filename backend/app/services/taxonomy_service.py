from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models.lookup import ExpectedBehaviorOption, ReviewStatusOption
from app.models.qa_entry import QaEntry
from app.models.taxonomy import QuestionGroup, QuestionSubgroup, SubgroupExample
from app.seed.taxonomy_data import EXPECTED_BEHAVIOR_OPTIONS, GROUPS, REVIEW_STATUS_OPTIONS, SUBGROUPS


class TaxonomyService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def seed_defaults(self) -> None:
        existing = (await self.db.execute(select(QuestionGroup.group_id))).first()
        if existing is not None:
            return

        group_by_code: dict[str, QuestionGroup] = {}
        for group_data in GROUPS:
            group = QuestionGroup(**group_data)
            self.db.add(group)
            group_by_code[group_data["code"]] = group
        await self.db.flush()

        for subgroup_data in SUBGROUPS:
            examples = subgroup_data["examples"]
            subgroup = QuestionSubgroup(
                group_id=group_by_code[subgroup_data["group_code"]].group_id,
                code=subgroup_data["code"],
                name=subgroup_data["name"],
                purpose=subgroup_data["purpose"],
                typical_role=subgroup_data["typical_role"],
                expected_retrieval=subgroup_data["expected_retrieval"],
                order_index=subgroup_data["order_index"],
            )
            self.db.add(subgroup)
            await self.db.flush()
            for index, example in enumerate(examples):
                self.db.add(
                    SubgroupExample(
                        subgroup_id=subgroup.subgroup_id,
                        role=example["role"],
                        query=example["query"],
                        order_index=index,
                    )
                )

        for index, (value, label) in enumerate(EXPECTED_BEHAVIOR_OPTIONS):
            self.db.add(ExpectedBehaviorOption(value=value, label=label, order_index=index))
        for index, (value, label) in enumerate(REVIEW_STATUS_OPTIONS):
            self.db.add(ReviewStatusOption(value=value, label=label, order_index=index))

        await self.db.flush()

    async def list_groups_with_subgroups(self) -> list[QuestionGroup]:
        stmt = (
            select(QuestionGroup)
            .options(
                selectinload(QuestionGroup.subgroups).selectinload(QuestionSubgroup.examples)
            )
            .order_by(QuestionGroup.order_index)
        )
        return list((await self.db.execute(stmt)).scalars().unique().all())

    async def get_progress_counts(self, doctor_id: int) -> dict[int, int]:
        stmt = (
            select(QaEntry.subgroup_id, func.count(QaEntry.entry_id))
            .where(QaEntry.doctor_id == doctor_id, QaEntry.is_extra.is_(False))
            .group_by(QaEntry.subgroup_id)
        )
        rows = await self.db.execute(stmt)
        return {subgroup_id: count for subgroup_id, count in rows.all()}

    async def get_subgroup(self, subgroup_id: int) -> QuestionSubgroup:
        stmt = select(QuestionSubgroup).where(QuestionSubgroup.subgroup_id == subgroup_id)
        subgroup = (await self.db.execute(stmt)).scalar_one_or_none()
        if subgroup is None:
            raise NotFoundError(f"Không tìm thấy subgroup id={subgroup_id}.")
        return subgroup

    async def update_subgroup(
        self,
        subgroup_id: int,
        *,
        name: str | None,
        purpose: str | None,
        typical_role: str | None,
        expected_retrieval: str | None,
        target_count: int | None,
    ) -> QuestionSubgroup:
        subgroup = await self.get_subgroup(subgroup_id)
        if name is not None:
            subgroup.name = name.strip()
        if purpose is not None:
            subgroup.purpose = purpose.strip()
        if typical_role is not None:
            subgroup.typical_role = typical_role.strip()
        if expected_retrieval is not None:
            subgroup.expected_retrieval = expected_retrieval.strip()
        if target_count is not None:
            subgroup.target_count = target_count
        await self.db.flush()
        return subgroup

    async def list_expected_behaviors(self) -> list[ExpectedBehaviorOption]:
        stmt = select(ExpectedBehaviorOption).order_by(ExpectedBehaviorOption.order_index)
        return list((await self.db.execute(stmt)).scalars().all())

    async def list_review_statuses(self) -> list[ReviewStatusOption]:
        stmt = select(ReviewStatusOption).order_by(ReviewStatusOption.order_index)
        return list((await self.db.execute(stmt)).scalars().all())
