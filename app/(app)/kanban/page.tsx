import { PageHeader } from "@/components/ui";
import { listTasks } from "@/lib/queries";
import { KanbanBoard } from "./kanban-board";

export default async function KanbanPage() {
  const tasks = await listTasks();
  return (
    <div>
      <PageHeader
        title="Kanban"
        description="Drag only allowed transitions. Completing a task still requires a completion record."
      />
      <KanbanBoard tasks={tasks} />
    </div>
  );
}
