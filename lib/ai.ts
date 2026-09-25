const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-20b";

export async function assistantAnswer(input: { question: string; recorded: string; actor: string }) {
  const key = process.env.GROQ_API_KEY;
  const fallback = [
    `Recorded context for ${input.actor}:`,
    input.recorded || "No matching records were found.",
    "",
    "Suggested: confirm any action through the normal KAGUM ONE workflow. AI cannot change records.",
  ].join("\n");
  if (!key) return fallback;

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || DEFAULT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an assistive operator for KAGUM ONE. Never invent records. Distinguish Recorded vs Inferred vs Suggested. Never claim to have changed data.",
        },
        {
          role: "user",
          content: `Question: ${input.question}\n\nAuthorized records:\n${input.recorded || "(none)"}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Groq request failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  return data.choices?.[0]?.message?.content || fallback;
}
