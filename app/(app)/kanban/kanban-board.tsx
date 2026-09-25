"use client";

import Link from "next/link";
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { TASK_STATUSES, canTransitionTask, type TaskStatus } from "@/lib/permissions";
import { Badge, Card, statusTone } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { transitionTask } from "@/lib/actions/core";
import { useRouter } from "next/navigation";
import { CSS } from "@dnd-kit/utilities";

type CardTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  officialDeadline: Date | string | null;
};

export function KanbanBoard({ tasks }: { tasks: CardTask[] }) {
  const router = useRouter();
  async function onDragEnd(event: DragEndEvent) {
    const over = event.over?.id?.toString();
    const id = event.active.id.toString();
    if (!over) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (!canTransitionTask(task.status as TaskStatus, over as TaskStatus)) return;
    if (over === "completed" || over === "acknowledged") return;
    await transitionTask(id, over as TaskStatus);
    router.refresh();
  }
  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="grid gap-3 overflow-x-auto md:grid-cols-3 xl:grid-cols-6">
        {TASK_STATUSES.map((status) => (
          <Column key={status} status={status} tasks={tasks.filter((t) => t.status === status)} />
        ))}
      </div>
    </DndContext>
  );
}

function Column({ status, tasks }: { status: string; tasks: CardTask[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <Card className={isOver ? "ring-2 ring-info" : ""}>
      <h2 className="mb-2 text-sm font-medium capitalize">{status.replaceAll("_", " ")}</h2>
      <div ref={setNodeRef} className="min-h-24 space-y-2">
        {tasks.map((t) => (
          <KanbanCard key={t.id} task={t} />
        ))}
      </div>
    </Card>
  );
}

function KanbanCard({ task }: { task: CardTask }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className="rounded-md border border-border bg-surface p-2 text-sm"
      {...listeners}
      {...attributes}
    >
      <Link href={`/tasks/${task.id}`}>{task.title}</Link>
      <div className="mt-1 flex justify-between text-xs text-secondary">
        <Badge tone={statusTone(task.priority)}>{task.priority}</Badge>
        <span>{formatDate(task.officialDeadline)}</span>
      </div>
    </div>
  );
}
