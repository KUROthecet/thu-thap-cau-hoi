from fastapi import APIRouter, Response

from app.api.deps import ActiveUser, ExportServiceDep
from app.core.exceptions import BadRequestError, ForbiddenError
from app.services.export_service import ExportFilters

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("", summary="Export golden dataset entries as CSV or JSON")
async def export_entries(
    export_service: ExportServiceDep,
    current_user: ActiveUser,
    format: str = "json",
    doctor_id: int | None = None,
    subgroup_id: int | None = None,
    review_status: str | None = None,
) -> Response:
    if current_user.role != "admin":
        if doctor_id is not None and doctor_id != current_user.user_id:
            raise ForbiddenError("Bạn chỉ có thể xuất dữ liệu của chính mình.")
        doctor_id = current_user.user_id

    filters = ExportFilters(doctor_id=doctor_id, subgroup_id=subgroup_id, review_status=review_status)
    entries = await export_service.fetch_entries(filters)

    if format == "csv":
        content = export_service.to_csv_text(entries)
        return Response(
            content=content,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": "attachment; filename=dataset_builder_export.csv"},
        )
    if format == "json":
        content = export_service.to_json_text(entries, filters)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=dataset_builder_export.json"},
        )
    raise BadRequestError("format phải là 'csv' hoặc 'json'.")
