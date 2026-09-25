export async function sendEmail(input: { to: string; subject: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info("[email:dev]", input.subject, "→", input.to, "\n", input.text);
    return { mode: "console" as const };
  }
  const { Resend } = await import("resend");
  const resend = new Resend(key);
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "KAGUM ONE <noreply@localhost>",
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
  return { mode: "resend" as const };
}
