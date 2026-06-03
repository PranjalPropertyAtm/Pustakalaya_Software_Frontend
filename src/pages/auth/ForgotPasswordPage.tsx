import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/api/services";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/schemas/auth.schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { trimmedFieldRules } from "@/lib/inputHelpers";

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ForgotPasswordFormValues) => authService.forgotPassword(data.email),
    onSuccess: () => toast.success("If the email exists, reset instructions were sent."),
    onError: () => toast.error("Could not process request"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Enter your registered email address</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <FormField label="Email" error={errors.email} required>
            <Input type="email" {...register("email", trimmedFieldRules)} />
          </FormField>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            Send reset link
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/login">Back to login</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
