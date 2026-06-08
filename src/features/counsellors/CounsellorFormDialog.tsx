import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, Pencil, Eye, EyeOff } from "lucide-react";
import { counsellorsService } from "@/api/services";
import {
  createCounsellorSchema,
  updateCounsellorSchema,
  type CreateCounsellorFormValues,
  type UpdateCounsellorFormValues,
} from "@/schemas/counsellor.schema";
import { queryKeys } from "@/lib/queryKeys";
import { getBranchId } from "@/lib/branch";
import { ApiClientError } from "@/api/client";
import type { Branch } from "@/types/domain";
import type { BranchCounsellor } from "@/types/counsellor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trimmedFieldRules } from "@/lib/inputHelpers";
import { FormField } from "@/components/forms/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CounsellorFormDialogProps {
  mode: "create" | "edit";
  branches: Branch[];
  counsellor?: BranchCounsellor;
  defaultBranchId?: string;
  occupiedBranchIds?: string[];
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CounsellorFormDialog({
  mode,
  branches,
  counsellor,
  defaultBranchId,
  occupiedBranchIds = [],
  trigger,
  onSuccess,
}: CounsellorFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const isEdit = mode === "edit" && counsellor;

  const createForm = useForm<CreateCounsellorFormValues>({
    resolver: zodResolver(createCounsellorSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      branchId: defaultBranchId ?? "",
    },
  });

  const editForm = useForm<UpdateCounsellorFormValues>({
    resolver: zodResolver(updateCounsellorSchema),
    defaultValues: {
      fullName: counsellor?.fullName ?? "",
      email: counsellor?.email ?? "",
      password: "",
      branchId: counsellor?.branchId ?? defaultBranchId ?? "",
      isActive: counsellor?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (!open) return;
    setShowPassword(false);
    if (isEdit && counsellor) {
      editForm.reset({
        fullName: counsellor.fullName,
        email: counsellor.email,
        password: "",
        branchId: counsellor.branchId ?? defaultBranchId ?? "",
        isActive: counsellor.isActive,
      });
    } else {
      createForm.reset({
        fullName: "",
        email: "",
        password: "",
        branchId: defaultBranchId ?? "",
      });
    }
  }, [open, isEdit, counsellor, defaultBranchId, createForm, editForm]);

  const createMutation = useMutation({
    mutationFn: (values: CreateCounsellorFormValues) =>
      counsellorsService.create({ ...values, role: "BRANCH_COUNSELLOR" }),
    onSuccess: (user) => {
      toast.success(`Counsellor "${user.fullName}" created for ${user.branch?.name ?? "branch"}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.counsellors.all });
      setOpen(false);
      onSuccess?.();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Failed to create counsellor"),
  });

  const updateMutation = useMutation({
    mutationFn: (values: UpdateCounsellorFormValues) => {
      if (!counsellor) throw new Error("No counsellor");
      const body: Record<string, unknown> = {
        fullName: values.fullName,
        email: values.email,
        branchId: values.branchId,
        isActive: values.isActive,
      };
      if (values.password?.trim()) body.password = values.password;
      return counsellorsService.update(counsellor.id, body);
    },
    onSuccess: (user) => {
      toast.success(`Counsellor "${user.fullName}" updated`);
      queryClient.invalidateQueries({ queryKey: queryKeys.counsellors.all });
      setOpen(false);
      onSuccess?.();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Failed to update counsellor"),
  });

  const branchOptions = branches.filter((b) => {
    const id = getBranchId(b);
    if (isEdit && counsellor?.branchId === id) return true;
    if (defaultBranchId === id && mode === "create") return !occupiedBranchIds.includes(id);
    return !occupiedBranchIds.includes(id);
  });

  const defaultTrigger =
    mode === "create" ? (
      <Button size="sm" className="gap-1">
        <UserPlus className="h-4 w-4" />
        Add counsellor
      </Button>
    ) : (
      <Button variant="outline" size="sm" className="w-full gap-1">
        <Pencil className="h-3.5 w-3.5" />
        Edit counsellor
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit branch counsellor" : "Create branch counsellor"}</DialogTitle>
        </DialogHeader>

        {isEdit ? (
          <form
            onSubmit={editForm.handleSubmit((v) => updateMutation.mutate(v))}
            className="space-y-4"
          >
            <FormField label="Full name" error={editForm.formState.errors.fullName} required>
              <Input {...editForm.register("fullName", trimmedFieldRules)} />
            </FormField>
            <FormField label="Login email" error={editForm.formState.errors.email} required>
              <Input type="email" {...editForm.register("email", trimmedFieldRules)} />
            </FormField>
            <FormField
              label="New password"
              error={editForm.formState.errors.password}
              hint="Leave blank to keep current password"
            >
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="pr-10"
                  {...editForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>
            <FormField label="Branch access" error={editForm.formState.errors.branchId} required>
              <Controller
                control={editForm.control}
                name="branchId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => {
                        const id = getBranchId(b);
                        return (
                          <SelectItem key={id} value={id}>
                            {b.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-input"
                checked={editForm.watch("isActive")}
                onChange={(e) => editForm.setValue("isActive", e.target.checked)}
              />
              Account active (login allowed)
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={createForm.handleSubmit((v) => createMutation.mutate(v))}
            className="space-y-4"
          >
            <FormField label="Full name" error={createForm.formState.errors.fullName} required>
              <Input {...createForm.register("fullName", trimmedFieldRules)} />
            </FormField>
            <FormField label="Login email" error={createForm.formState.errors.email} required>
              <Input type="email" autoComplete="off" {...createForm.register("email", trimmedFieldRules)} />
            </FormField>
            <FormField label="Password" error={createForm.formState.errors.password} required>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="pr-10"
                  {...createForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>
            <FormField label="Branch access" error={createForm.formState.errors.branchId} required>
              <Controller
                control={createForm.control}
                name="branchId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchOptions.map((b) => {
                        const id = getBranchId(b);
                        return (
                          <SelectItem key={id} value={id}>
                            {b.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <p className="text-xs text-muted-foreground">
              One branch counsellor per branch. This login can only access the assigned branch.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
