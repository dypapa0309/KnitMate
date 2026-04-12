export function formatHashtagLabel(tag: string) {
  const trimmed = tag.trim().replace(/^#+/, "");
  return trimmed ? `#${trimmed}` : "#";
}
