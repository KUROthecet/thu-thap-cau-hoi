from uuid import UUID

from fastapi import APIRouter, Response, status

from app.api.deps import DoctorUser, QaEntryServiceDep
from app.schemas.entries import QaEntryCreateResult, QaEntryResponse, QaEntryUpsertRequest

router = APIRouter(prefix="/workspace/entries", tags=["Workspace - Entries"])


@router.get("", response_model=list[QaEntryResponse], summary="List entries in a subgroup")
async def list_entries(
    subgroup_id: int, entry_service: QaEntryServiceDep, current_user: DoctorUser
) -> list[QaEntryResponse]:
    entries = await entry_service.list_entries(
        doctor_id=current_user.user_id, subgroup_id=subgroup_id
    )
    return [QaEntryResponse.model_validate(entry) for entry in entries]


@router.post("", response_model=QaEntryCreateResult, summary="Create a new entry")
async def create_entry(
    payload: QaEntryUpsertRequest, entry_service: QaEntryServiceDep, current_user: DoctorUser
) -> QaEntryCreateResult:
    entry, duplicate_warning = await entry_service.create_entry(
        doctor_id=current_user.user_id, payload=payload
    )
    return QaEntryCreateResult(
        entry=QaEntryResponse.model_validate(entry), duplicate_warning=duplicate_warning
    )


@router.patch("/{entry_id}", response_model=QaEntryResponse, summary="Update an entry")
async def update_entry(
    entry_id: UUID,
    payload: QaEntryUpsertRequest,
    entry_service: QaEntryServiceDep,
    current_user: DoctorUser,
) -> QaEntryResponse:
    entry = await entry_service.update_entry(
        entry_id=entry_id, doctor_id=current_user.user_id, payload=payload
    )
    return QaEntryResponse.model_validate(entry)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an entry")
async def delete_entry(
    entry_id: UUID, entry_service: QaEntryServiceDep, current_user: DoctorUser
) -> Response:
    await entry_service.delete_entry(entry_id=entry_id, doctor_id=current_user.user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
