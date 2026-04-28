export const ATC_LOGO_TEXT = "ATC Forum";

export const formatRelative = (date: string | Date) => {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
};

export const initials = (name?: string | null) => {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
};
