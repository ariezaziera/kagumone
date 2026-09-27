import { cn } from "@/lib/utils";

export type IllustrationName =
  | "dashboard"
  | "projects"
  | "tasks"
  | "calendar"
  | "content"
  | "equipment"
  | "kpi"
  | "team"
  | "skills"
  | "knowledge"
  | "ai"
  | "caught-up"
  | "empty-folder"
  | "quiet"
  | "search"
  | "empty";

const ACCENT: Record<IllustrationName, string> = {
  dashboard: "#F6C945",
  projects: "#4B9FE1",
  tasks: "#F6C945",
  calendar: "#F28C38",
  content: "#8B63D9",
  equipment: "#49B675",
  kpi: "#4B9FE1",
  team: "#E889B8",
  skills: "#8B63D9",
  knowledge: "#8B63D9",
  ai: "#8B63D9",
  "caught-up": "#49B675",
  "empty-folder": "#4B9FE1",
  quiet: "#8B63D9",
  search: "#F28C38",
  empty: "#D71920",
};

function Person({ accent }: { accent: string }) {
  return (
    <g>
      <ellipse cx="78" cy="108" rx="28" ry="5" fill="#E6E6E6" />
      <path d="M62 78c0-10 7-16 16-16s16 6 16 16v22H62V78z" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
      <path d="M62 86h32" stroke="#D71920" strokeWidth="3" />
      <circle cx="78" cy="50" r="16" fill="#F3D2BE" stroke="#111111" strokeWidth="2" />
      <path d="M64 48c2-12 26-12 28 0" fill="#111111" />
      <circle cx="72" cy="51" r="1.4" fill="#111111" />
      <circle cx="84" cy="51" r="1.4" fill="#111111" />
      <path d="M74 57c2 2 6 2 8 0" fill="none" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="90" y="70" width="8" height="8" rx="2" fill={accent} stroke="#111111" strokeWidth="1.5" />
    </g>
  );
}

function Prop({ name, accent }: { name: IllustrationName; accent: string }) {
  if (name === "ai") {
    return (
      <g>
        <rect x="108" y="42" width="40" height="46" rx="12" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
        <rect x="118" y="34" width="20" height="10" rx="4" fill="#111111" />
        <circle cx="122" cy="60" r="4" fill="#D71920" />
        <circle cx="134" cy="60" r="4" fill={accent} />
        <path d="M118 74h20" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
      </g>
    );
  }
  if (name === "quiet") {
    return (
      <text x="112" y="46" fill="#8A8A8A" fontSize="16" fontFamily="Montserrat, sans-serif">
        z z
      </text>
    );
  }
  if (name === "search") {
    return (
      <g>
        <circle cx="122" cy="70" r="14" fill="none" stroke="#111111" strokeWidth="3" />
        <path d="M132 80l12 12" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }
  if (name === "empty-folder" || name === "projects" || name === "knowledge") {
    return (
      <g>
        <path d="M108 64h40l6 28H114l-6-28z" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
        <path d="M108 64h16l4 8h26" fill="none" stroke="#111111" strokeWidth="2" />
        <rect x="124" y="78" width="14" height="8" rx="1" fill={accent} />
      </g>
    );
  }
  if (name === "calendar") {
    return (
      <g>
        <rect x="108" y="52" width="42" height="40" rx="6" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
        <path d="M108 64h42" stroke="#D71920" strokeWidth="4" />
        <rect x="118" y="72" width="8" height="8" fill={accent} />
        <rect x="132" y="72" width="8" height="8" fill="#111111" />
      </g>
    );
  }
  if (name === "content") {
    return (
      <g>
        <rect x="108" y="58" width="36" height="26" rx="4" fill="#111111" />
        <circle cx="126" cy="71" r="7" fill="#FFFFFF" />
        <circle cx="126" cy="71" r="3" fill={accent} />
        <rect x="146" y="48" width="16" height="28" rx="3" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
      </g>
    );
  }
  if (name === "equipment") {
    return (
      <g>
        <rect x="110" y="62" width="36" height="24" rx="4" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
        <circle cx="128" cy="58" r="8" fill={accent} stroke="#111111" strokeWidth="2" />
        <path d="M124 54h8" stroke="#111111" strokeWidth="2" />
      </g>
    );
  }
  if (name === "kpi") {
    return (
      <g>
        <rect x="110" y="78" width="8" height="16" fill="#111111" />
        <rect x="122" y="66" width="8" height="28" fill={accent} />
        <rect x="134" y="56" width="8" height="38" fill="#D71920" />
      </g>
    );
  }
  if (name === "team") {
    return (
      <g>
        <circle cx="118" cy="62" r="8" fill="#F3D2BE" stroke="#111111" strokeWidth="1.5" />
        <circle cx="136" cy="58" r="8" fill="#F3D2BE" stroke="#111111" strokeWidth="1.5" />
        <path d="M110 86c2-8 8-10 8-10s6 2 8 10" fill="#FFFFFF" stroke="#111111" strokeWidth="1.5" />
        <path d="M128 84c2-8 8-12 8-12s6 4 8 12" fill={accent} stroke="#111111" strokeWidth="1.5" />
      </g>
    );
  }
  if (name === "skills") {
    return (
      <g>
        <path d="M108 70h34v24H108z" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
        <path d="M108 70l17-10 17 10" fill={accent} stroke="#111111" strokeWidth="2" />
      </g>
    );
  }
  if (name === "caught-up") {
    return (
      <g>
        <rect x="110" y="58" width="40" height="30" rx="4" fill="#FFFFFF" stroke="#111111" strokeWidth="2" />
        <path d="M122 74l6 6 12-14" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      <rect x="108" y="62" width="44" height="28" rx="4" fill="#252525" />
      <rect x="114" y="68" width="32" height="16" rx="2" fill={accent} />
    </g>
  );
}

export function Illustration({
  name,
  className,
}: {
  name: IllustrationName;
  className?: string;
}) {
  const accent = ACCENT[name];
  return (
    <svg viewBox="0 0 180 120" className={cn("h-28 w-44", className)} aria-hidden>
      <rect x="8" y="18" width="36" height="10" transform="rotate(-18 8 18)" fill="#D71920" />
      <rect x="28" y="8" width="8" height="28" transform="rotate(-18 28 8)" fill="#252525" />
      <Person accent={accent} />
      <Prop name={name} accent={accent} />
    </svg>
  );
}
