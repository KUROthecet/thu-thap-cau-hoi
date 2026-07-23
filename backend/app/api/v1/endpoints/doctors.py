from fastapi import APIRouter

from app.api.deps import AdminUser, DoctorServiceDep
from app.schemas.auth import CreateDoctorRequest, DoctorListResponse, UpdateDoctorRequest, UserResponse

router = APIRouter(prefix="/admin/doctors", tags=["Admin - Doctors"])


@router.get("", response_model=DoctorListResponse, summary="List doctors")
async def list_doctors(
    doctor_service: DoctorServiceDep, _: AdminUser
) -> DoctorListResponse:
    doctors = await doctor_service.list_doctors()
    return DoctorListResponse(
        items=[UserResponse.model_validate(doctor) for doctor in doctors], total=len(doctors)
    )


@router.post("", response_model=UserResponse, summary="Create doctor")
async def create_doctor(
    payload: CreateDoctorRequest, doctor_service: DoctorServiceDep, _: AdminUser
) -> UserResponse:
    doctor = await doctor_service.create_doctor(
        email=payload.email,
        full_name=payload.full_name,
        specialty=payload.specialty,
        password=payload.password,
    )
    return UserResponse.model_validate(doctor)


@router.patch("/{doctor_id}", response_model=UserResponse, summary="Update doctor")
async def update_doctor(
    doctor_id: int,
    payload: UpdateDoctorRequest,
    doctor_service: DoctorServiceDep,
    _: AdminUser,
) -> UserResponse:
    doctor = await doctor_service.update_doctor(
        doctor_id,
        full_name=payload.full_name,
        specialty=payload.specialty,
        is_active=payload.is_active,
        password=payload.password,
    )
    return UserResponse.model_validate(doctor)


@router.delete("/{doctor_id}", status_code=204, summary="Delete doctor")
async def delete_doctor(
    doctor_id: int,
    doctor_service: DoctorServiceDep,
    current_user: AdminUser,
) -> None:
    await doctor_service.delete_doctor(doctor_id, current_user.user_id)
