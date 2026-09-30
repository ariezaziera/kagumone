/** Kinds a person can turn off. Password reset always sends. */
export const NOTIFICATION_KINDS = [
  { kind: "chat", label: "Chats", detail: "Team chat, private chats, and groups." },
  { kind: "task_assigned", label: "Task assignments", detail: "When a task is assigned to you." },
  { kind: "task_deadline", label: "Task deadlines", detail: "A reminder before a deadline." },
  { kind: "task_overdue", label: "Overdue tasks", detail: "When an assigned task is past the official deadline." },
  { kind: "extension_request", label: "Extension requests", detail: "When someone asks to move a deadline." },
  { kind: "extension_decision", label: "Extension decisions", detail: "When a deadline request is decided." },
  { kind: "equipment", label: "Equipment", detail: "Loans and returns." },
  { kind: "equipment_overdue", label: "Overdue equipment", detail: "When a loan is past its return time." },
  { kind: "kpi_changed", label: "KPI changes", detail: "When a target on your record changes." },
  { kind: "project", label: "Projects", detail: "When you are added to a project." },
  { kind: "handover", label: "Handover", detail: "When a handover names you." },
  { kind: "profile_updated", label: "Profile updates", detail: "When someone with administration access edits your profile." },
] as const;

export const ALWAYS_ON_NOTIFICATION_KINDS = ["password_reset"] as const;
