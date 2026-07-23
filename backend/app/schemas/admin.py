from pydantic import BaseModel


class SubgroupMinimapItem(BaseModel):
    subgroup_id: int
    code: str
    done_count: int
    target_count: int


class DoctorProgressOut(BaseModel):
    user_id: int
    full_name: str
    email: str
    specialty: str | None
    is_active: bool
    total_entries: int
    target_total: int
    types_done: int
    types_total: int
    status: str
    minimap: list[SubgroupMinimapItem]


class AdminOverviewOut(BaseModel):
    doctors_total: int
    entries_total: int
    entries_target: int
    completion_pct: int
    doctors_done: int
    doctors: list[DoctorProgressOut]
