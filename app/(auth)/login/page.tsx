"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth/client";
import { loginSchema } from "@/lib/validation";
import { Button, Field, Input } from "@/components/ui";
import { PersonaSwitcher } from "@/components/persona-switcher";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  return (
    <form
      className="space-y-3"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        const result = await authClient.signIn.email({
          email: values.email,
          password: values.password,
          rememberMe: values.remember,
        });
        if (result.error) {
          setError(result.error.message ?? "Unable to sign in.");
          return;
        }
        router.push(params.get("next") || "/dashboard");
      })}
    >
      <Field label="Email">
        <Input type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field label="Password">
        <Input type="password" autoComplete="current-password" {...form.register("password")} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-secondary">
        <input type="checkbox" {...form.register("remember")} /> Remember me
      </label>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
        Log in
      </Button>
      <p className="text-sm">
        <Link className="text-info" href="/forgot-password">
          Forgot password
        </Link>
      </p>
      <PersonaSwitcher />
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
