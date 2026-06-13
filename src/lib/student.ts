import type { Student } from "@/types/domain";
import { PARENT_CONTACT_RELATIONS } from "@/lib/constants";

export function getStudentId(student: Pick<Student, "id" | "_id">): string {
  return student.id ?? student._id ?? "";
}

export function getParentContactRelationLabel(relation?: string | null): string | null {
  if (!relation) return null;
  return PARENT_CONTACT_RELATIONS.find((item) => item.value === relation)?.label ?? null;
}

export function formatParentContact(
  student: Pick<Student, "parentContact" | "parentContactRelation" | "parentContactName">
): string | null {
  if (!student.parentContact?.trim()) return null;
  const relationLabel = getParentContactRelationLabel(student.parentContactRelation);
  const name = student.parentContactName?.trim();
  const phone = student.parentContact.trim();

  if (relationLabel && name) return `${relationLabel} — ${name}: ${phone}`;
  if (relationLabel) return `${relationLabel}: ${phone}`;
  if (name) return `${name}: ${phone}`;
  return phone;
}

export function getStudentSeatLabel(student: Student): string | null {
  const seat = student.seat;
  if (!seat) return null;
  if (seat.seatNumber) return seat.seatNumber;
  if (seat.label) return seat.label;
  return null;
}
