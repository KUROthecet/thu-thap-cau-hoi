from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.admin import AdminOverviewOut, DoctorProgressOut, SubgroupMinimapItem
from app.services.doctor_service import DoctorService
from app.services.qa_entry_service import QaEntryService
from app.services.taxonomy_service import TaxonomyService


class AdminOverviewService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.doctor_service = DoctorService(db)
        self.taxonomy_service = TaxonomyService(db)
        self.entry_service = QaEntryService(db)

    async def build_overview(self) -> AdminOverviewOut:
        doctors = await self.doctor_service.list_doctors()
        groups = await self.taxonomy_service.list_groups_with_subgroups()
        subgroups = [subgroup for group in groups for subgroup in group.subgroups]
        target_total = sum(subgroup.target_count for subgroup in subgroups)

        doctor_progress: list[DoctorProgressOut] = []
        entries_total = 0
        doctors_done = 0
        for doctor in doctors:
            counts = await self.entry_service.count_by_subgroup(doctor.user_id)
            total_entries = sum(min(count, subgroup.target_count) for subgroup in subgroups for count in [counts.get(subgroup.subgroup_id, 0)])
            types_done = sum(
                1 for subgroup in subgroups if counts.get(subgroup.subgroup_id, 0) >= subgroup.target_count
            )
            minimap = [
                SubgroupMinimapItem(
                    subgroup_id=subgroup.subgroup_id,
                    code=subgroup.code,
                    done_count=counts.get(subgroup.subgroup_id, 0),
                    target_count=subgroup.target_count,
                )
                for subgroup in subgroups
            ]
            is_done = total_entries >= target_total
            status = "done" if is_done else ("in_progress" if total_entries > 0 else "new")
            if is_done:
                doctors_done += 1
            entries_total += total_entries

            doctor_progress.append(
                DoctorProgressOut(
                    user_id=doctor.user_id,
                    full_name=doctor.full_name,
                    email=doctor.email,
                    specialty=doctor.specialty,
                    is_active=doctor.is_active,
                    total_entries=total_entries,
                    target_total=target_total,
                    types_done=types_done,
                    types_total=len(subgroups),
                    status=status,
                    minimap=minimap,
                )
            )

        entries_target = target_total * max(len(doctors), 1)
        completion_pct = int(round(entries_total / entries_target * 100)) if entries_target else 0

        return AdminOverviewOut(
            doctors_total=len(doctors),
            entries_total=entries_total,
            entries_target=entries_target,
            completion_pct=completion_pct,
            doctors_done=doctors_done,
            doctors=doctor_progress,
        )
