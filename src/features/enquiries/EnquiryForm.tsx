import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { enquiriesService, branchesService, plansService } from "@/api/services";
import {
  enquiryFormSchema,
  enquiryToFormValues,
  createEnquiryDefaultValues,
  ENQUIRY_SOURCES,
  ENQUIRY_PURPOSES,
  ENQUIRY_STATUSES,
  ENQUIRY_GENDERS,
  type EnquiryFormValues,
} from "@/schemas/enquiry.schema";
import { queryKeys } from "@/lib/queryKeys";
import { useBranchContext } from "@/hooks/useBranchContext";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { MobileInput } from "@/components/forms/MobileInput";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { mobileFieldRules, trimmedFieldRules } from "@/lib/inputHelpers";
import { getBranchId } from "@/lib/branch";
import { getPlanId, getPlanLabel } from "@/lib/plan";
import { staticQueryOptions } from "@/lib/queryDefaults";
import { ApiClientError } from "@/api/client";
import { getEnquiryId, isEnquiryTerminal } from "@/lib/enquiry";
import type { Enquiry } from "@/types/enquiry";
import { useEffect } from "react";

interface EnquiryFormProps {
  enquiry?: Enquiry;
  onSuccess?: () => void;
  submitLabel?: string;
}

export function EnquiryForm({ enquiry, onSuccess, submitLabel = "Save enquiry" }: EnquiryFormProps) {
  const queryClient = useQueryClient();
  const { effectiveBranchId, isSuperAdmin } = useBranchContext();
  const isEdit = Boolean(enquiry);
  const terminal = enquiry ? isEnquiryTerminal(enquiry.status) : false;

  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues: enquiry
      ? enquiryToFormValues(enquiry)
      : createEnquiryDefaultValues(effectiveBranchId ?? ""),
  });

  useEffect(() => {
    if (!isEdit && effectiveBranchId) {
      form.setValue("branchId", effectiveBranchId);
    }
  }, [effectiveBranchId, form, isEdit]);

  const { data: branches } = useQuery({
    queryKey: queryKeys.branches.list({}),
    queryFn: () => branchesService.list({ limit: 100, isActive: "true" }),
    enabled: isSuperAdmin,
    ...staticQueryOptions,
  });

  const { data: plansData } = useQuery({
    queryKey: queryKeys.plans.list({ isActive: "true" }),
    queryFn: () => plansService.list({ isActive: "true" }),
    ...staticQueryOptions,
  });

  const mutation = useMutation({
    mutationFn: (values: EnquiryFormValues) => {
      const parsedAge = values.age?.trim() ? Number(values.age) : null;
      const body: Record<string, unknown> = {
        ...values,
        age: parsedAge && !Number.isNaN(parsedAge) ? parsedAge : null,
        alternateMobile: values.alternateMobile || undefined,
        email: values.email || undefined,
        gender: values.gender || null,
        interestedPlanId: values.interestedPlanId || null,
        preferredShift: values.preferredShift || null,
        expectedJoiningDate: values.expectedJoiningDate || null,
        occupation: values.occupation || undefined,
        collegeSchool: values.collegeSchool || undefined,
        address: values.address || undefined,
        budget: values.budget || undefined,
        remarks: values.remarks || undefined,
      };
      if (isEdit && enquiry) {
        return enquiriesService.update(getEnquiryId(enquiry), body);
      }
      return enquiriesService.create(body);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Enquiry updated" : "Enquiry created");
      void queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all });
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to save enquiry");
    },
  });

  return (
    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" error={form.formState.errors.fullName} required>
          <Input {...form.register("fullName", trimmedFieldRules)} disabled={terminal} />
        </FormField>
        <FormField label="Mobile number" error={form.formState.errors.mobileNumber} required>
          <MobileInput {...form.register("mobileNumber", mobileFieldRules)} disabled={terminal} />
        </FormField>
        <FormField label="Alternate mobile" error={form.formState.errors.alternateMobile}>
          <MobileInput {...form.register("alternateMobile", mobileFieldRules)} disabled={terminal} />
        </FormField>
        <FormField label="Email" error={form.formState.errors.email}>
          <Input type="email" {...form.register("email")} disabled={terminal} />
        </FormField>
        <FormField label="Age" error={form.formState.errors.age}>
          <Input type="number" min={1} max={120} {...form.register("age")} disabled={terminal} />
        </FormField>
        <FormField label="Gender" error={form.formState.errors.gender}>
          <Controller
            control={form.control}
            name="gender"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={terminal}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  {ENQUIRY_GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        {isSuperAdmin && (
          <FormField label="Branch" error={form.formState.errors.branchId} required>
            <Controller
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={terminal}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {(branches?.items ?? []).map((b) => {
                      const id = getBranchId(b);
                      return <SelectItem key={id} value={id}>{b.name}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )}
        <FormField label="Interested plan" error={form.formState.errors.interestedPlanId}>
          <Controller
            control={form.control}
            name="interestedPlanId"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={terminal}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  {(plansData?.items ?? []).map((p) => {
                    const id = getPlanId(p);
                    return <SelectItem key={id} value={id}>{getPlanLabel(p)}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Preferred shift" error={form.formState.errors.preferredShift}>
          <Controller
            control={form.control}
            name="preferredShift"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={terminal}>
                <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Shift A</SelectItem>
                  <SelectItem value="B">Shift B</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Expected joining date" error={form.formState.errors.expectedJoiningDate}>
          <Input type="date" {...form.register("expectedJoiningDate")} disabled={terminal} />
        </FormField>
        <FormField label="Occupation" error={form.formState.errors.occupation}>
          <Input {...form.register("occupation")} disabled={terminal} />
        </FormField>
        <FormField label="College / School" error={form.formState.errors.collegeSchool}>
          <Input {...form.register("collegeSchool")} disabled={terminal} />
        </FormField>
        <FormField label="How did you hear about us?" error={form.formState.errors.source} required>
          <Controller
            control={form.control}
            name="source"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={terminal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENQUIRY_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Purpose" error={form.formState.errors.purpose} required>
          <Controller
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={terminal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENQUIRY_PURPOSES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField label="Budget" error={form.formState.errors.budget}>
          <Input {...form.register("budget")} placeholder="e.g. ₹2000/month" disabled={terminal} />
        </FormField>
        {isEdit && (
          <FormField label="Status" error={form.formState.errors.status}>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value ?? "new"} onValueChange={field.onChange} disabled={terminal}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENQUIRY_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )}
        <FormField label="Address" error={form.formState.errors.address} className="sm:col-span-2">
          <Textarea {...form.register("address")} disabled={terminal} />
        </FormField>
        <FormField label="Remarks / Notes" error={form.formState.errors.remarks} className="sm:col-span-2">
          <Textarea {...form.register("remarks")} disabled={terminal} />
        </FormField>
      </div>
      {!terminal && (
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
