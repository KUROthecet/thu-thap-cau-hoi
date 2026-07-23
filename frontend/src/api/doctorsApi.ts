import { api } from '../lib/api'
import type { CreateDoctorRequest, DoctorListResponse, UpdateDoctorRequest, UserResponse } from '../lib/types'

export const doctorsApi = {
  list: () => api.get<DoctorListResponse>('/admin/doctors'),
  create: (payload: CreateDoctorRequest) => api.post<UserResponse>('/admin/doctors', payload),
  update: (doctorId: number, payload: UpdateDoctorRequest) =>
    api.patch<UserResponse>(`/admin/doctors/${doctorId}`, payload),
  remove: (doctorId: number) => api.delete(`/admin/doctors/${doctorId}`),
}
