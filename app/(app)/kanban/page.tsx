import { PageHeader } from "@/components/ui";
import { listTasks } from "@/lib/queries";
import { KanbanBoard } from "./kanban-board";

export default async function KanbanPage() {
  const tasks = await listTasks();
  return (
    <div>
      <PageHeader
        module="tasks"
        title="Kanban"
        description="On a phone, use the arrows to move a card. On a larger screen, drag an allowed step. Completing a task still requires a completion record."
      />
      <KanbanBoard tasks={tasks} />
    </div>
  );
}
