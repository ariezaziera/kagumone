import Link from "next/link";
import { listPeople, listTasks } from "@/lib/queries";
import { WorkHero, linkButton } from "@/components/work-surface";
import { KanbanBoard } from "./kanban-board";
import { isTaskOverdue } from "@/lib/permissions";

export default async function KanbanPage() {
  const [tasks, people] = await Promise.all([listTasks(), listPeople()]);
  const names = new Map(people.map((person) => [person.id, person.fullName]));
  const cards = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    officialDeadline: task.officialDeadline,
    assigneeName: task.assigneeId ? (names.get(task.assigneeId) ?? null) : null,
    category: task.category,
    overdue: isTaskOverdue(task),
  }));
  const open = tasks.filter((task) => task.status !== "completed").length;

  return (
    <div className="space-y-5">
      <WorkHero
        illustration="tasks"
        kicker="Kanban"
        title="Status lanes"
        description={
          tasks.length === 0
            ? "Lanes follow the official task status. Drag is for an allowed step. Completing a task still needs a completion record."
            : `${open} open across ${tasks.length} tasks. On a phone, use the arrows. On a larger screen, drag an allowed step.`
        }
        actions={
          <>
            <Link className={linkButton("primary")} href="/tasks">
              All tasks
            </Link>
            <Link className={linkButton()} href="/my-tasks">
              My tasks
            </Link>
            <Link className={linkButton()} href="/calendar">
              Calendar
            </Link>
          </>
        }
      />
      <KanbanBoard tasks={cards} />
    </div>
  );
}
