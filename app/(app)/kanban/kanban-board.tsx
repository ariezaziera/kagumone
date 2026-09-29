"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { TASK_STATUSES, canTransitionTask, type TaskStatus } from "@/lib/permissions";
import { Badge, iconButtonClass, statusTone } from "@/components/ui";
import { DeadlineStamp, priorityBar, statusFace } from "@/components/work-surface";
import { cn, formatDate, readableLabel } from "@/lib/utils";
import { transitionTask } from "@/lib/actions/core";

type CardTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  officialDeadline: Date | string | null;
  assigneeName: string | null;
  category: string | null;
  overdue: boolean;
};

function statusLabel(status: string) {
  return readableLabel(status);
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
      <div className="flex w-full min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto pb-3">
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
  const face = statusFace(status);
  return (
    <section
      className={cn(
        "flex min-h-[420px] w-[min(100%,320px)] shrink-0 snap-start flex-col overflow-hidden rounded-[18px] border border-border bg-canvas/70",
        isOver && "ring-2 ring-info",
      )}
    >
      <header className={cn("flex items-start justify-between gap-2 px-3 py-3", face.wash)}>
        <div className="min-w-0">
          <span className={cn("mb-1.5 block h-1.5 w-8 rounded-full", face.bar)} />
          <h2 className="text-sm font-bold leading-snug text-text">{statusLabel(status)}</h2>
        </div>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-text">{tasks.length}</span>
      </header>
      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2 p-2">
        {tasks.length === 0 ? (
          <p className="m-1 rounded-[14px] border border-dashed border-border px-3 py-6 text-center text-xs leading-relaxed text-muted">
            Nothing in this lane
          </p>
        ) : null}
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} mobile={mobile} onMove={onMove} />
        ))}
      </div>
    </section>
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
        "relative overflow-hidden rounded-[14px] border border-border bg-surface px-3 py-2.5 text-sm shadow-[var(--shadow-card)]",
        !mobile && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-70",
      )}
      {...(mobile ? {} : { ...listeners, ...attributes })}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", priorityBar(task.priority))} aria-hidden />
      <div className="flex items-start gap-2 pl-1.5">
        <DeadlineStamp value={task.officialDeadline} overdue={task.overdue} size="sm" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/tasks/${task.id}`}
            className="line-clamp-3 font-semibold leading-snug text-text hover:text-primary"
            onPointerDown={(event) => event.stopPropagation()}
          >
            {task.title}
          </Link>
          <p className="mt-1 truncate text-xs text-secondary">{task.assigneeName ?? "Unassigned"}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-1.5">
        <Badge tone={statusTone(task.priority)}>{task.priority}</Badge>
        {task.overdue ? <Badge tone="error">Overdue</Badge> : null}
        {task.category ? <span className="text-[11px] font-medium text-muted">{readableLabel(task.category)}</span> : null}
        <span className={cn("ml-auto text-[11px] font-semibold", task.overdue ? "text-error" : "text-secondary")}>
          {formatDate(task.officialDeadline)}
        </span>
      </div>
      {previous || next ? (
        <div className="mt-2 flex gap-2 md:hidden">
          {previous ? (
            <button
              type="button"
              className={iconButtonClass("mr-auto h-8 gap-1 border border-border bg-canvas px-2 text-xs font-semibold disabled:opacity-50")}
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
              className={iconButtonClass("ml-auto h-8 gap-1 border border-border bg-canvas px-2 text-xs font-semibold disabled:opacity-50")}
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
