"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { TASK_STATUSES, canTransitionTask, type TaskStatus } from "@/lib/permissions";
import { Badge, Card, iconButtonClass, statusTone } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";
import { transitionTask } from "@/lib/actions/core";

type CardTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  officialDeadline: Date | string | null;
};

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function adjacentMove(from: string, direction: -1 | 1): TaskStatus | null {
  const index = TASK_STATUSES.indexOf(from as TaskStatus);
  if (index < 0) return null;
  const target = TASK_STATUSES[index + direction];
  if (!target || target === "completed" || target === "acknowledged") return null;
  if (!canTransitionTask(from as TaskStatus, target)) return null;
  return target;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return mobile;
}

export function KanbanBoard({ tasks }: { tasks: CardTask[] }) {
  const router = useRouter();
  const mobile = useIsMobile();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function moveTask(id: string, next: TaskStatus) {
    const task = tasks.find((item) => item.id === id);
    if (!task || !canTransitionTask(task.status as TaskStatus, next)) return;
    if (next === "completed" || next === "acknowledged") return;
    await transitionTask(id, next);
    router.refresh();
  }

  function onDragEnd(event: DragEndEvent) {
    const next = event.over?.id?.toString();
    if (!next) return;
    void moveTask(event.active.id.toString(), next as TaskStatus);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex w-full min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:snap-none md:grid-cols-2 md:overflow-visible xl:grid-cols-3">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            mobile={mobile}
            tasks={tasks.filter((task) => task.status === status)}
            onMove={moveTask}
          />
        ))}
      </div>
    </DndContext>
  );
}

function Column({
  status,
  tasks,
  mobile,
  onMove,
}: {
  status: string;
  tasks: CardTask[];
  mobile: boolean;
  onMove: (id: string, next: TaskStatus) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <Card className={cn("min-w-full shrink-0 snap-start md:min-w-0", isOver && "ring-2 ring-info")}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold capitalize">{statusLabel(status)}</h2>
        <span className="text-xs font-semibold text-muted">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className="min-h-24 space-y-2">
        {tasks.length === 0 ? <p className="text-sm text-secondary">No tasks</p> : null}
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} mobile={mobile} onMove={onMove} />
        ))}
      </div>
    </Card>
  );
}

function KanbanCard({
  task,
  mobile,
  onMove,
}: {
  task: CardTask;
  mobile: boolean;
  onMove: (id: string, next: TaskStatus) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, disabled: mobile });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previous = adjacentMove(task.status, -1);
  const next = adjacentMove(task.status, 1);

  async function move(target: TaskStatus) {
    setPending(true);
    setError(null);
    try {
      await onMove(task.id, target);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not move this card.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "rounded-[12px] border border-border bg-canvas px-3 py-2.5 text-sm",
        !mobile && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-70",
      )}
      {...(mobile ? {} : { ...listeners, ...attributes })}
    >
      <Link
        href={`/tasks/${task.id}`}
        className="font-medium text-text"
        onPointerDown={(event) => event.stopPropagation()}
      >
        {task.title}
      </Link>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Badge tone={statusTone(task.priority)}>{task.priority}</Badge>
        <span className="shrink-0 text-xs text-secondary">{formatDate(task.officialDeadline)}</span>
      </div>
      {previous || next ? (
        <div className="mt-2 flex gap-2 md:hidden">
          {previous ? (
            <button
              type="button"
              className={iconButtonClass("mr-auto h-8 gap-1 border border-border bg-surface px-2 text-xs font-semibold capitalize disabled:opacity-50")}
              aria-label={`Move to ${statusLabel(previous)}`}
              disabled={pending}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => void move(previous)}
            >
              <ChevronLeft size={14} />
              {statusLabel(previous)}
            </button>
          ) : null}
          {next ? (
            <button
              type="button"
              className={iconButtonClass("ml-auto h-8 gap-1 border border-border bg-surface px-2 text-xs font-semibold capitalize disabled:opacity-50")}
              aria-label={`Move to ${statusLabel(next)}`}
              disabled={pending}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => void move(next)}
            >
              {statusLabel(next)}
              <ChevronRight size={14} />
            </button>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
    </div>
  );
}
