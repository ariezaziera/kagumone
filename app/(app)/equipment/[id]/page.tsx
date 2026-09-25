import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { equipmentLoans, equipmentPhotos } from "@/lib/db/schema";
import { forceReturnEquipment, returnEquipment } from "@/lib/actions/core";
import { getEquipment } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getEquipment(id);
  if (!item) notFound();
  const loans = await db.select().from(equipmentLoans).where(eq(equipmentLoans.equipmentId, id));
  const open = loans.find((l) => l.status === "borrowed");
  const photos = open ? await db.select().from(equipmentPhotos).where(eq(equipmentPhotos.loanId, open.id)) : [];
  return (
    <div>
      <PageHeader title={item.name} description={`${item.assetCode} · ${item.serialNumber ?? "no serial"}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-1 text-sm">
          <p>Category: {item.category}</p>
          <p>Location: {item.location}</p>
          <p>Condition: {item.condition}</p>
          <p>Status hint: {item.statusHint}</p>
          <h3 className="pt-2 font-medium">Loan history</h3>
          {loans.map((l) => (
            <p key={l.id}>
              {l.status} {l.forceReturned ? "(force-returned, original borrower preserved)" : ""} — {formatDateTime(l.createdAt)}
            </p>
          ))}
          <p className="text-xs text-secondary">Photos on open loan: {photos.length}</p>
        </Card>
        <Card>
          {open ? (
            <>
              <h2 className="mb-2 font-medium">Return</h2>
              <ActionForm action={returnEquipment} submitLabel="Return equipment">
                <input type="hidden" name="loanId" value={open.id} />
                <input type="hidden" name="afterPhotoCount" value="2" />
                <Field label="Condition">
                  <Select name="condition" defaultValue="good">
                    <option>good</option>
                    <option>damaged</option>
                    <option>missing</option>
                  </Select>
                </Field>
                <Field label="Notes">
                  <Textarea name="notes" />
                </Field>
              </ActionForm>
              <h2 className="mt-4 mb-2 font-medium">Force return</h2>
              <ActionForm action={forceReturnEquipment} submitLabel="Force return equipment">
                <input type="hidden" name="loanId" value={open.id} />
                <Field label="Reason">
                  <Input name="reason" required />
                </Field>
              </ActionForm>
            </>
          ) : (
            <p className="text-sm text-secondary">No open loan.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
