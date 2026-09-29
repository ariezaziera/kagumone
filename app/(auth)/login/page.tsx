"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithIdentifier } from "@/lib/actions/auth-extra";
import { loginSchema } from "@/lib/validation";
import { Button, Field, Input } from "@/components/ui";
import { PersonaSwitcher } from "@/components/persona-switcher";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", remember: false },
  });

  return (
    <form
      className="space-y-3"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        const result = await signInWithIdentifier({
          identifier: values.identifier,
          password: values.password,
          remember: Boolean(values.remember),
        });
        if (result.error) {
          setError(result.error);
          return;
        }
        router.push(result.mustChangePassword ? "/first-password" : params.get("next") || "/dashboard");
        router.refresh();
      })}
    >
      <Field label="Email or username">
        <Input type="text" autoComplete="username" {...form.register("identifier")} />
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
