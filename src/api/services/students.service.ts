import { apiClient, unwrap } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { Student, StudentRegistration } from "@/types/domain";

export const studentsService = {
  list: (params?: Record<string, unknown>) =>
    unwrap<{ items: Student[]; pagination?: { total: number; page: number; limit: number } }>(
      apiClient.get(endpoints.students, { params })
    ),
  getById: (id: string) => unwrap<Student>(apiClient.get(endpoints.student(id))),
  listRegistrations: (id: string, params?: Record<string, unknown>) =>
    unwrap<{ items: StudentRegistration[]; pagination?: { total: number } }>(
      apiClient.get(endpoints.studentRegistrations(id), { params })
    ),
  register: (formData: FormData) =>
    unwrap<Student>(apiClient.post(endpoints.students, formData)),
  update: (id: string, body: Record<string, unknown>) =>
    unwrap<Student>(apiClient.patch(endpoints.student(id), body)),
  changeSeat: (id: string, body: { seatId: string }) =>
    unwrap<Student>(apiClient.patch(endpoints.studentSeat(id), body)),
};
