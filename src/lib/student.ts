import type { Student } from "@/types/domain";
import { PARENT_CONTACT_RELATIONS } from "@/lib/constants";

export function getStudentId(student: Pick<Student, "id" | "_id">): string {
  return student.id ?? student._id ?? "";
}

export function getParentContactRelationLabel(relation?: string | null): string | null {
  if (!relation) return null;
  return PARENT_CONTACT_RELATIONS.find((item) => item.value === relation)?.label ?? null;
}

export function formatParentContact(student: Pick<Student, "parentContact" | "parentContactRelation">): string | null {
  if (!student.parentContact?.trim()) return null;
  const relationLabel = getParentContactRelationLabel(student.parentContactRelation);
  return relationLabel ? `${relationLabel}: ${student.parentContact}` : student.parentContact;
}

export function getStudentSeatLabel(student: Student): string | null {
  const seat = student.seat;
  if (!seat) return null;
  if (seat.seatNumber) return seat.seatNumber;
  if (seat.label) return seat.label;
  return null;
}
