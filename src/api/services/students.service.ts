import { apiClient, unwrap } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { Student, StudentRegistration } from "@/types/domain";

export type RegisterStudentResult = {
  student: Student;
  registration: StudentRegistration;
  receipt: { id: string; receiptNumber: string };
  payment?: { id: string; paymentNumber: string; amount: number; currency: string };
};

type StudentListResult = {
  items: Student[];
  pagination?: { total: number; page: number; limit: number; totalPages?: number };
};

function listStudents(params?: Record<string, unknown>) {
  return unwrap<StudentListResult>(apiClient.get(endpoints.students, { params }));
}

export const studentsService = {
  list: listStudents,
  /** Loads every page. The students API caps each request at 100 rows. */
  listAll: async (params?: Record<string, unknown>) => {
    const limit = 100;
    const first = await listStudents({ ...params, page: 1, limit });
    const total = first.pagination?.total ?? first.items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (totalPages <= 1) return first;

    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        listStudents({ ...params, page: index + 2, limit })
      )
    );

    return {
      items: [...first.items, ...rest.flatMap((page) => page.items)],
      pagination: { page: 1, limit: total, total, totalPages: 1 },
    };
  },
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
  releaseSeat: (id: string) =>
    unwrap<Student>(apiClient.post(endpoints.studentSeatRelease(id))),
  changePlan: (
    id: string,
    body: {
      planId: string;
      seatId?: string;
      shiftCode?: string;
      preferredStartTime?: string;
      preferredEndTime?: string;
    }
  ) => unwrap<Student>(apiClient.patch(endpoints.studentPlan(id), body)),
  remove: (id: string) =>
    unwrap<{ deletedStudentId: string; studentCode: string; fullName: string }>(
      apiClient.delete(endpoints.student(id))
    ),
};
