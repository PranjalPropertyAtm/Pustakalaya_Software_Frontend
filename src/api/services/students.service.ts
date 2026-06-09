import { apiClient, unwrap } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { Student, StudentRegistration } from "@/types/domain";

export type RegisterStudentResult = {
  student: Student;
  registration: StudentRegistration;
  receipt: { id: string; receiptNumber: string };
  payment?: { id: string; paymentNumber: string; amount: number; currency: string };
};

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
  register: (body: Record<string, unknown>) =>
    unwrap<RegisterStudentResult>(apiClient.post(endpoints.students, body)),
  uploadRegistrationMedia: (id: string, formData: FormData) =>
    unwrap<Student>(apiClient.patch(endpoints.studentRegistrationMedia(id), formData)),
  update: (id: string, body: Record<string, unknown>) =>
    unwrap<Student>(apiClient.patch(endpoints.student(id), body)),
  updateMedia: (id: string, formData: FormData) =>
    unwrap<Student>(apiClient.patch(endpoints.studentMedia(id), formData)),
  changeSeat: (id: string, body: { seatId: string }) =>
    unwrap<Student>(apiClient.patch(endpoints.studentSeat(id), body)),
  remove: (id: string) =>
    unwrap<{ deletedStudentId: string; studentCode: string; fullName: string }>(
      apiClient.delete(endpoints.student(id))
    ),
};
