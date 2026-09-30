"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateProfile } from "@/lib/actions/core";
import { Button, Field, Input, Select } from "@/components/ui";

export function ProfileForm({
  person,
}: {
  person: {
    id: string;
    fullName: string;
    preferredName: string | null;
    hasPhoto: boolean;
    email: string | null;
    username: string | null;
    positionTitle: string | null;
    canEditSignIn: boolean;
    canEditDepartment: boolean;
    departmentId: string | null;
    departments: { id: string; name: string }[];
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="space-y-3"
      action={async (form) => {
        setError(null);
        setSaved(false);
        try {
          await updateProfile(form);
          setSaved(true);
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to save the profile.");
        }
      }}
    >
      <input type="hidden" name="personId" value={person.id} />
      <Field label="Profile photo">
        <Input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
      </Field>
      <p className="text-xs text-secondary">JPEG, PNG, WebP, or GIF. 2 MB maximum.</p>
      {person.hasPhoto ? (
        <label className="flex items-center gap-2 text-sm text-secondary">
          <input type="checkbox" name="removePhoto" /> Remove current photo
        </label>
      ) : null}
      <Field label="Full name">
        <Input name="fullName" required minLength={2} maxLength={120} defaultValue={person.fullName} />
      </Field>
      <Field label="Preferred name">
        <Input name="preferredName" maxLength={80} defaultValue={person.preferredName ?? ""} />
      </Field>
      <Field label="Position title">
        <Input name="positionTitle" maxLength={80} defaultValue={person.positionTitle ?? ""} placeholder="Type the title" />
      </Field>
      {person.canEditDepartment ? (
        <Field label="Department">
          <Select name="departmentId" defaultValue={person.departmentId ?? ""}>
            <option value="">No department</option>
            {person.departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </Select>
        </Field>
      ) : null}
      {person.canEditSignIn || !person.email ? (
        <Field label="Email">
          <Input name="email" type="email" autoComplete="off" defaultValue={person.email ?? ""} placeholder="Email for sign-in" />
        </Field>
      ) : null}
      {person.canEditSignIn || !person.username ? (
        <Field label="Username">
          <Input name="username" minLength={3} maxLength={30} autoComplete="off" defaultValue={person.username ?? ""} placeholder="letters, numbers, underscores, periods" />
        </Field>
      ) : null}
      <Button type="submit">Save profile</Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {saved ? <p className="text-sm text-success">Saved.</p> : null}
    </form>
  );
}
