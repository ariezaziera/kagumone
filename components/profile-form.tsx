"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateProfile } from "@/lib/actions/core";
import { Button, Field, Input } from "@/components/ui";

export function ProfileForm({
  person,
}: {
  person: { id: string; fullName: string; preferredName: string | null; hasPhoto: boolean };
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
      <Button type="submit">Save profile</Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {saved ? <p className="text-sm text-success">Saved.</p> : null}
    </form>
  );
}
