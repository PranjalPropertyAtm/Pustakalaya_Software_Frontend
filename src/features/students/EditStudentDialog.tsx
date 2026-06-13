import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { studentsService } from "@/api/services";
import {
  studentToUpdateFormValues,
  updateStudentSchema,
  type UpdateStudentFormValues,
} from "@/schemas/student.schema";
import { queryKeys } from "@/lib/queryKeys";
import { getStudentId } from "@/lib/student";
import { ApiClientError } from "@/api/client";
import type { Student } from "@/types/domain";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileInput } from "@/components/forms/MobileInput";
import { mobileFieldRules, trimmedFieldRules } from "@/lib/inputHelpers";
import { FormField } from "@/components/forms/FormField";
import { FileUploadField } from "@/components/forms/FileUploadField";
import {
  ParentContactFields,
  type ParentContactFormValues,
} from "@/components/forms/ParentContactFields";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { optimizeImageUrl } from "@/lib/image";

interface EditStudentDialogProps {
  student: Student;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditStudentDialog({
  student,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: EditStudentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();
  const studentId = getStudentId(student);
  const [photo, setPhoto] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);

  const form = useForm<UpdateStudentFormValues>({
    resolver: zodResolver(updateStudentSchema),
    defaultValues: studentToUpdateFormValues(student),
  });

  useEffect(() => {
    if (open) {
      form.reset(studentToUpdateFormValues(student));
      setPhoto(null);
      setIdProof(null);
    }
  }, [open, student, form]);

  const mutation = useMutation({
    mutationFn: async (values: UpdateStudentFormValues) => {
      const body: Record<string, unknown> = {
        fullName: values.fullName,
        mobileNumber: values.mobileNumber,
        address: values.address,
        notes: values.notes?.trim() || undefined,
        email: values.email?.trim() || "",
        parentContact: values.parentContact?.trim() || "",
        parentContactRelation: values.parentContactRelation || null,
        parentContactName: values.parentContactName?.trim() || "",
      };
      let updated = await studentsService.update(studentId, body);
      if (photo || idProof) {
        const fd = new FormData();
        if (photo) fd.append("photo", photo);
        if (idProof) fd.append("idProof", idProof);
        updated = await studentsService.updateMedia(studentId, fd);
      }
      return updated;
    },
    onSuccess: (updated) => {
      toast.success(`"${updated.fullName}" updated`);
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(studentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      setOpen(false);
      onSuccess?.();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Failed to update student"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button variant="outline" size="sm" className="gap-1">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit student</DialogTitle>
          <DialogDescription>
            {student.studentCode ? `Code: ${student.studentCode}` : student.fullName}
            {" — "}
            Update contact details and replace photo or ID proof. Plan, seat, and dates use renewals or change seat.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          className="grid gap-4 sm:grid-cols-2"
        >
          <FormField label="Full name" error={form.formState.errors.fullName} required className="sm:col-span-2">
            <Input {...form.register("fullName", trimmedFieldRules)} />
          </FormField>
          <FormField
            label="Mobile"
            error={form.formState.errors.mobileNumber}
            required
            hint="10-digit mobile number"
          >
            <MobileInput {...form.register("mobileNumber", mobileFieldRules)} />
          </FormField>
          <ParentContactFields
            register={form.register as unknown as UseFormRegister<ParentContactFormValues>}
            control={form.control as unknown as Control<ParentContactFormValues>}
            errors={form.formState.errors as FieldErrors<ParentContactFormValues>}
          />
          <FormField label="Email" error={form.formState.errors.email} className="sm:col-span-2">
            <Input type="email" {...form.register("email")} />
          </FormField>
          <FormField label="Address" error={form.formState.errors.address} required className="sm:col-span-2">
            <Textarea rows={3} {...form.register("address", trimmedFieldRules)} />
          </FormField>
          <FormField label="Notes" error={form.formState.errors.notes} className="sm:col-span-2">
            <Textarea rows={3} placeholder="Internal notes" {...form.register("notes", trimmedFieldRules)} />
          </FormField>

          <div className="sm:col-span-2 space-y-3 rounded-lg border border-border/80 p-4">
            <p className="text-sm font-medium">Documents</p>
            <p className="text-xs text-muted-foreground">
              Upload only if you want to replace the current file. Leave empty to keep existing documents.
            </p>
            {student.photoUrl && !photo && (
              <div className="flex items-center gap-3">
                <img
                  src={optimizeImageUrl(student.photoUrl, { width: 96, height: 96 })}
                  alt="Current profile"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded object-cover border border-border"
                />
                <span className="text-xs text-muted-foreground">Current profile photo</span>
              </div>
            )}
            <FileUploadField
              label="Profile photo"
              value={photo}
              onChange={setPhoto}
              accept="image/*"
              maxSizeMb={2}
            />
            {student.idProofUrl && !idProof && (
              <div className="flex items-center gap-3">
                {student.idProofUrl.match(/\.pdf(\?|$)/i) ? (
                  <a
                    href={student.idProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline"
                  >
                    View current ID proof (PDF)
                  </a>
                ) : (
                  <img
                    src={optimizeImageUrl(student.idProofUrl, { width: 96, height: 96 })}
                    alt="Current ID proof"
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded object-cover border border-border"
                  />
                )}
                {!student.idProofUrl.match(/\.pdf(\?|$)/i) && (
                  <span className="text-xs text-muted-foreground">Current ID proof</span>
                )}
              </div>
            )}
            <FileUploadField
              label="ID proof"
              value={idProof}
              onChange={setIdProof}
              accept="image/*,.pdf"
              maxSizeMb={5}
            />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
