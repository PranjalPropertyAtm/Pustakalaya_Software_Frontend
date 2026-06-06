import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/api/services";
import { useAuthStore } from "@/stores/authStore";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { ApiClientError } from "@/api/client";
import { trimmedFieldRules } from "@/lib/inputHelpers";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setSession(data.user, data.accessToken);
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    },
    onError: (err) => {
      const message = err instanceof ApiClientError ? err.message : "Login failed";
      toast.error(message);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Library management portal for staff</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <FormField label="Email" error={errors.email} required>
            <Input type="email" placeholder="you@pustakalaya.com" {...register("email", trimmedFieldRules)} />
          </FormField>
          <FormField label="Password" error={errors.password} required>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pr-10"
                {...register("password")}
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
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
