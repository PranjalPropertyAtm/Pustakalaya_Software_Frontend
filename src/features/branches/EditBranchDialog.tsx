import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { branchesService } from "@/api/services";
import { updateBranchSchema, type UpdateBranchFormValues } from "@/schemas/branch.schema";
import { queryKeys } from "@/lib/queryKeys";
import { getBranchId } from "@/lib/branch";
import { ApiClientError } from "@/api/client";
import type { Branch } from "@/types/domain";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileInput } from "@/components/forms/MobileInput";
import { mobileFieldRules, trimmedFieldRules } from "@/lib/inputHelpers";
import { FormField } from "@/components/forms/FormField";
import { Label } from "@/components/ui/label";

interface EditBranchDialogProps {
  branch: Branch;
  trigger?: React.ReactNode;
}

export function EditBranchDialog({ branch, trigger }: EditBranchDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const branchId = getBranchId(branch);

  const form = useForm<UpdateBranchFormValues>({
    resolver: zodResolver(updateBranchSchema),
    defaultValues: {
      name: branch.name,
      address: branch.address ?? "",
      contactNumber: branch.contactNumber ?? "",
      totalSeats: branch.totalSeats ?? 50,
      floors: branch.floors ?? 1,
      openingTime: branch.openingTime ?? "08:00",
      closingTime: branch.closingTime ?? "22:00",
      isActive: branch.isActive ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: branch.name,
        address: branch.address ?? "",
        contactNumber: branch.contactNumber ?? "",
        totalSeats: branch.totalSeats ?? 50,
        floors: branch.floors ?? 1,
        openingTime: branch.openingTime ?? "08:00",
        closingTime: branch.closingTime ?? "22:00",
        isActive: branch.isActive ?? true,
      });
    }
  }, [open, branch, form]);

  const mutation = useMutation({
    mutationFn: (values: UpdateBranchFormValues) => branchesService.update(branchId, values),
    onSuccess: (updated) => {
      const seatsMsg = updated.seatsSync
        ? ` Seats synced: ${updated.seatsSync.activeSeats} active.`
        : "";
      toast.success(`Branch "${updated.name}" updated.${seatsMsg}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      setOpen(false);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Failed to update branch"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="w-full gap-1">
            <Pencil className="h-3.5 w-3.5" />
            Edit branch
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit branch</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          className="grid gap-4 sm:grid-cols-2"
        >
          <FormField label="Branch name" error={form.formState.errors.name} required className="sm:col-span-2">
            <Input {...form.register("name", trimmedFieldRules)} />
          </FormField>
          <FormField label="Address" error={form.formState.errors.address} required className="sm:col-span-2">
            <Input {...form.register("address", trimmedFieldRules)} />
          </FormField>
          <FormField label="Contact number" error={form.formState.errors.contactNumber} required hint="10 digits">
            <MobileInput {...form.register("contactNumber", mobileFieldRules)} />
          </FormField>
          <FormField
            label="Total seats"
            error={form.formState.errors.totalSeats}
            required
            hint="Changing seats auto-syncs seat records 1…N."
          >
            <Input type="number" min={1} {...form.register("totalSeats", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Floors" error={form.formState.errors.floors} required>
            <Input type="number" min={1} {...form.register("floors", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Opening time" error={form.formState.errors.openingTime} required>
            <Input type="time" {...form.register("openingTime")} />
          </FormField>
          <FormField label="Closing time" error={form.formState.errors.closingTime} required>
            <Input type="time" {...form.register("closingTime")} />
          </FormField>
          <div className="sm:col-span-2 flex items-center gap-2 pt-1">
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <>
                  <input
                    type="checkbox"
                    id={`branch-active-${branchId}`}
                    className="rounded border-input"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <Label htmlFor={`branch-active-${branchId}`} className="font-normal cursor-pointer">
                    Branch is active (uncheck to suspend)
                  </Label>
                </>
              )}
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
