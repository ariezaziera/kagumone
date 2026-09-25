import { createClient } from "@libsql/client";

const needed: Record<string, { name: string; sql: string }[]> = {
  tasks: [
    { name: "purpose", sql: "ALTER TABLE tasks ADD COLUMN purpose text" },
    { name: "category", sql: "ALTER TABLE tasks ADD COLUMN category text" },
  ],
  task_collaborators: [
    { name: "role_in_task", sql: "ALTER TABLE task_collaborators ADD COLUMN role_in_task text DEFAULT 'contributor' NOT NULL" },
    { name: "contribution", sql: "ALTER TABLE task_collaborators ADD COLUMN contribution text" },
    { name: "notes", sql: "ALTER TABLE task_collaborators ADD COLUMN notes text" },
  ],
  task_deliverables: [
    { name: "description", sql: "ALTER TABLE task_deliverables ADD COLUMN description text" },
    { name: "deliverable_type", sql: "ALTER TABLE task_deliverables ADD COLUMN deliverable_type text" },
    { name: "notes", sql: "ALTER TABLE task_deliverables ADD COLUMN notes text" },
  ],
  task_completions: [
    { name: "do_differently", sql: "ALTER TABLE task_completions ADD COLUMN do_differently text" },
    { name: "remember_next", sql: "ALTER TABLE task_completions ADD COLUMN remember_next text" },
    { name: "work_completed_at", sql: "ALTER TABLE task_completions ADD COLUMN work_completed_at integer" },
    { name: "submitted_at", sql: "ALTER TABLE task_completions ADD COLUMN submitted_at integer" },
    { name: "overdue_days", sql: "ALTER TABLE task_completions ADD COLUMN overdue_days integer DEFAULT 0 NOT NULL" },
  ],
  planned_work: [
    { name: "content_id", sql: "ALTER TABLE planned_work ADD COLUMN content_id text" },
    { name: "title", sql: "ALTER TABLE planned_work ADD COLUMN title text" },
    { name: "work_type", sql: "ALTER TABLE planned_work ADD COLUMN work_type text DEFAULT 'planned_task_work' NOT NULL" },
  ],
  person_skills: [{ name: "source", sql: "ALTER TABLE person_skills ADD COLUMN source text DEFAULT 'inferred' NOT NULL" }],
  skill_evidence: [
    { name: "related_type", sql: "ALTER TABLE skill_evidence ADD COLUMN related_type text" },
    { name: "related_id", sql: "ALTER TABLE skill_evidence ADD COLUMN related_id text" },
    { name: "source", sql: "ALTER TABLE skill_evidence ADD COLUMN source text DEFAULT 'inferred' NOT NULL" },
  ],
};

async function main() {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./data/kagum.db";
  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });
  console.log("Patching schema at", url);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS skill_categories (
      id text PRIMARY KEY NOT NULL,
      name text NOT NULL
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS skills (
      id text PRIMARY KEY NOT NULL,
      category_id text,
      name text NOT NULL,
      description text
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS person_skills (
      id text PRIMARY KEY NOT NULL,
      person_id text NOT NULL,
      skill_id text NOT NULL,
      level integer NOT NULL DEFAULT 1,
      verified integer NOT NULL DEFAULT 0,
      source text NOT NULL DEFAULT 'inferred',
      created_at integer
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS skill_evidence (
      id text PRIMARY KEY NOT NULL,
      person_skill_id text NOT NULL,
      note text,
      file_id text,
      related_type text,
      related_id text,
      source text NOT NULL DEFAULT 'inferred',
      created_at integer
    )
  `);

  for (const [table, columns] of Object.entries(needed)) {
    const info = await client.execute(`PRAGMA table_info(${table})`);
    const have = new Set(info.rows.map((row) => String(row.name)));
    for (const column of columns) {
      if (have.has(column.name)) continue;
      try {
        await client.execute(column.sql);
        console.log("Added", table + "." + column.name);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes("duplicate column")) throw error;
      }
    }
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS completion_deliverables (
      id text PRIMARY KEY NOT NULL,
      completion_id text NOT NULL,
      label text NOT NULL,
      url text,
      description text NOT NULL,
      deliverable_type text,
      notes text,
      created_at integer NOT NULL,
      FOREIGN KEY (completion_id) REFERENCES task_completions(id)
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS completion_people (
      id text PRIMARY KEY NOT NULL,
      completion_id text NOT NULL,
      person_id text NOT NULL,
      role_in_task text NOT NULL,
      contribution text NOT NULL,
      notes text,
      created_at integer NOT NULL,
      FOREIGN KEY (completion_id) REFERENCES task_completions(id),
      FOREIGN KEY (person_id) REFERENCES people(id)
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS announcements (
      id text PRIMARY KEY NOT NULL,
      title text NOT NULL,
      body text NOT NULL,
      kind text NOT NULL DEFAULT 'announcement',
      requires_participation integer NOT NULL DEFAULT 0,
      related_type text,
      related_id text,
      created_by_id text,
      starts_at integer,
      ends_at integer,
      status text NOT NULL DEFAULT 'published',
      created_at integer NOT NULL
    )
  `);

  const tasks = await client.execute("PRAGMA table_info(tasks)");
  console.log(
    "tasks columns:",
    tasks.rows.map((row) => row.name).join(", "),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
