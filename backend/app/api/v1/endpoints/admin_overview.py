from fastapi import APIRouter

from app.api.deps import AdminOverviewServiceDep, AdminUser
from app.schemas.admin import AdminOverviewOut

router = APIRouter(prefix="/admin", tags=["Admin - Overview"])


@router.get("/progress", response_model=AdminOverviewOut, summary="Admin progress overview")
async def get_progress(
    overview_service: AdminOverviewServiceDep, _: AdminUser
) -> AdminOverviewOut:
    return await overview_service.build_overview()
