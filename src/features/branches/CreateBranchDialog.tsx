import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { branchesService } from "@/api/services";
import { createBranchSchema, type CreateBranchFormValues } from "@/schemas/branch.schema";
import { queryKeys } from "@/lib/queryKeys";
import { useBranchStore } from "@/stores/branchStore";
import { getBranchId } from "@/lib/branch";
import { ApiClientError } from "@/api/client";
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
import { Plus } from "lucide-react";
import { useState } from "react";

interface CreateBranchDialogProps {
  trigger?: React.ReactNode;
  onCreated?: (branchId: string) => void;
}

export function CreateBranchDialog({ trigger, onCreated }: CreateBranchDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const setSelectedBranchId = useBranchStore((s) => s.setSelectedBranchId);

  const form = useForm<CreateBranchFormValues>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      name: "",
      address: "",
      contactNumber: "",
      totalSeats: 50,
      floors: 1,
      openingTime: "08:00",
      closingTime: "22:00",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateBranchFormValues) => branchesService.create(values),
    onSuccess: (branch) => {
      const id = getBranchId(branch);
      const seatsMsg = branch.seatsSync
        ? ` · ${branch.seatsSync.activeSeats} seats created`
        : "";
      toast.success(`Branch "${branch.name}" created${seatsMsg}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
      setSelectedBranchId(id);
      onCreated?.(id);
      form.reset();
      setOpen(false);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Failed to create branch"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New branch</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create branch</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          className="grid gap-4 sm:grid-cols-2"
        >
          <FormField label="Branch name" error={form.formState.errors.name} required className="sm:col-span-2">
            <Input placeholder="e.g. Pustakalaya Main" {...form.register("name", trimmedFieldRules)} />
          </FormField>
          <FormField label="Address" error={form.formState.errors.address} required className="sm:col-span-2">
            <Input placeholder="Full address" {...form.register("address", trimmedFieldRules)} />
          </FormField>
          <FormField label="Contact number" error={form.formState.errors.contactNumber} required hint="10 digits">
            <MobileInput {...form.register("contactNumber", mobileFieldRules)} />
          </FormField>
          <FormField
            label="Total seats"
            error={form.formState.errors.totalSeats}
            required
            className="sm:col-span-2"
            hint="Seats 1 to N are created automatically for this branch."
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
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create branch"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
