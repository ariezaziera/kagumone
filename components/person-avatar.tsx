export function PersonAvatar({
  personId,
  name,
  hasPhoto,
  version,
  size = "md",
}: {
  personId: string;
  name: string;
  hasPhoto: boolean;
  version?: number;
  size?: "sm" | "md" | "lg";
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const box = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-24 w-24 text-3xl" : "h-16 w-16 text-xl";
  if (!hasPhoto) {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-full bg-charcoal font-bold text-white ${box}`}>{initial}</span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/profile-photo/${personId}${version ? `?v=${version}` : ""}`}
      alt=""
      className={`shrink-0 rounded-full object-cover ${box}`}
    />
  );
}
