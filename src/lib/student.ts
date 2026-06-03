import type { Student } from "@/types/domain";

export function getStudentId(student: Pick<Student, "id" | "_id">): string {
  return student.id ?? student._id ?? "";
}

export function getStudentSeatLabel(student: Student): string | null {
  const seat = student.seat;
  if (!seat) return null;
  if (seat.seatNumber) return seat.seatNumber;
  if (seat.label) return seat.label;
  return null;
}
