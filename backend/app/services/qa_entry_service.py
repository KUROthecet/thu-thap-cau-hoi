from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from app.models.qa_citation import QaCitation, QaCitationPoint
from app.models.qa_entry import QaEntry
from app.models.taxonomy import QuestionSubgroup
from app.schemas.entries import CitationIn, QaEntryUpsertRequest


class QaEntryService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_entries(self, *, doctor_id: int, subgroup_id: int) -> list[QaEntry]:
        stmt = (
            select(QaEntry)
            .where(QaEntry.doctor_id == doctor_id, QaEntry.subgroup_id == subgroup_id)
            .order_by(QaEntry.slot_index)
        )
        return list((await self.db.execute(stmt)).scalars().unique().all())

    async def list_all_for_doctor(self, doctor_id: int) -> list[QaEntry]:
        stmt = (
            select(QaEntry)
            .where(QaEntry.doctor_id == doctor_id)
            .order_by(QaEntry.subgroup_id, QaEntry.slot_index)
        )
        return list((await self.db.execute(stmt)).scalars().unique().all())

    async def count_by_subgroup(self, doctor_id: int) -> dict[int, int]:
        stmt = (
            select(QaEntry.subgroup_id, func.count(QaEntry.entry_id))
            .where(QaEntry.doctor_id == doctor_id, QaEntry.is_extra.is_(False))
            .group_by(QaEntry.subgroup_id)
        )
        return {subgroup_id: count for subgroup_id, count in (await self.db.execute(stmt)).all()}

    async def get_owned_entry(self, entry_id: UUID, doctor_id: int) -> QaEntry:
        stmt = select(QaEntry).where(QaEntry.entry_id == entry_id)
        entry = (await self.db.execute(stmt)).scalar_one_or_none()
        if entry is None:
            raise NotFoundError(f"Không tìm thấy câu hỏi id={entry_id}.")
        if entry.doctor_id != doctor_id:
            raise ForbiddenError("Bạn không có quyền truy cập câu hỏi này.")
        return entry

    async def create_entry(
        self, *, doctor_id: int, payload: QaEntryUpsertRequest
    ) -> tuple[QaEntry, bool]:
        self._validate_citations(payload.citations)

        subgroup = await self.db.get(QuestionSubgroup, payload.subgroup_id)
        if subgroup is None:
            raise NotFoundError(f"Không tìm thấy subgroup id={payload.subgroup_id}.")

        existing = await self.list_entries(doctor_id=doctor_id, subgroup_id=payload.subgroup_id)
        duplicate_warning = self._has_duplicate_query(existing, payload.query)

        non_extra_count = sum(1 for entry in existing if not entry.is_extra)
        next_slot = len(existing) + 1
        is_extra = non_extra_count >= subgroup.target_count

        entry = QaEntry(
            doctor_id=doctor_id,
            subgroup_id=payload.subgroup_id,
            slot_index=next_slot,
            is_extra=is_extra,
            role=payload.role,
            disease_or_topic=payload.disease_or_topic.strip(),
            query=payload.query.strip(),
            expected_behavior=payload.expected_behavior,
            expert_gold_answer=payload.expert_gold_answer.strip(),
            required_key_points=[point.strip() for point in payload.required_key_points if point.strip()],
            safety_notes=(payload.safety_notes or "").strip() or None,
            annotator_name=payload.annotator_name.strip(),
            review_status=payload.review_status,
            note_for_expert=(payload.note_for_expert or "").strip() or None,
        )
        self._attach_citations(entry, payload.citations)
        self.db.add(entry)
        await self.db.flush()
        return entry, duplicate_warning

    async def update_entry(
        self, *, entry_id: UUID, doctor_id: int, payload: QaEntryUpsertRequest
    ) -> QaEntry:
        self._validate_citations(payload.citations)
        entry = await self.get_owned_entry(entry_id, doctor_id)

        entry.role = payload.role
        entry.disease_or_topic = payload.disease_or_topic.strip()
        entry.query = payload.query.strip()
        entry.expected_behavior = payload.expected_behavior
        entry.expert_gold_answer = payload.expert_gold_answer.strip()
        entry.required_key_points = [
            point.strip() for point in payload.required_key_points if point.strip()
        ]
        entry.safety_notes = (payload.safety_notes or "").strip() or None
        entry.annotator_name = payload.annotator_name.strip()
        entry.review_status = payload.review_status
        entry.note_for_expert = (payload.note_for_expert or "").strip() or None

        entry.citations.clear()
        await self.db.flush()
        self._attach_citations(entry, payload.citations)
        await self.db.flush()
        return entry

    async def delete_entry(self, *, entry_id: UUID, doctor_id: int) -> None:
        entry = await self.get_owned_entry(entry_id, doctor_id)
        removed_slot = entry.slot_index
        subgroup_id = entry.subgroup_id
        await self.db.delete(entry)
        await self.db.flush()

        remaining = await self.list_entries(doctor_id=doctor_id, subgroup_id=subgroup_id)
        for entry_after in remaining:
            if entry_after.slot_index > removed_slot:
                entry_after.slot_index -= 1
        await self.db.flush()

    @staticmethod
    def _validate_citations(citations: list[CitationIn]) -> None:
        must_have = [item for item in citations if item.kind == "must_have"]
        if not must_have:
            raise BadRequestError("Cần ít nhất 1 trích dẫn bắt buộc (must_have).")
        for citation in must_have:
            has_source = citation.chunk_id is not None or bool(
                (citation.manual_doc_name or "").strip() and (citation.manual_location or "").strip()
            )
            if not has_source:
                raise BadRequestError(
                    "Mỗi trích dẫn bắt buộc cần chọn đoạn guideline hoặc nhập tên tài liệu + mục."
                )
            if not any(point.strip() for point in citation.points):
                raise BadRequestError("Mỗi trích dẫn bắt buộc cần ít nhất 1 ý.")

    @staticmethod
    def _has_duplicate_query(existing: list[QaEntry], query: str) -> bool:
        normalized = query.strip().lower()
        return any(entry.query.strip().lower() == normalized for entry in existing)

    @staticmethod
    def _attach_citations(entry: QaEntry, citations: list[CitationIn]) -> None:
        for order_index, citation_data in enumerate(citations):
            has_content = citation_data.chunk_id is not None or bool(
                (citation_data.manual_doc_name or "").strip()
            )
            if not has_content:
                continue
            citation = QaCitation(
                kind=citation_data.kind,
                chunk_id=citation_data.chunk_id,
                manual_doc_name=(citation_data.manual_doc_name or "").strip() or None,
                manual_location=(citation_data.manual_location or "").strip() or None,
                order_index=order_index,
            )
            for point_index, point in enumerate(citation_data.points):
                if point.strip():
                    citation.points.append(
                        QaCitationPoint(content=point.strip(), order_index=point_index)
                    )
            entry.citations.append(citation)
