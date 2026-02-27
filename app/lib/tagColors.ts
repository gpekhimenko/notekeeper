const TAG_COLORS = [
  { bg: "bg-blue-50", text: "text-blue-700", activeBg: "bg-blue-600", activeText: "text-white" },
  { bg: "bg-green-50", text: "text-green-700", activeBg: "bg-green-600", activeText: "text-white" },
  { bg: "bg-purple-50", text: "text-purple-700", activeBg: "bg-purple-600", activeText: "text-white" },
  { bg: "bg-amber-50", text: "text-amber-700", activeBg: "bg-amber-600", activeText: "text-white" },
  { bg: "bg-rose-50", text: "text-rose-700", activeBg: "bg-rose-600", activeText: "text-white" },
  { bg: "bg-cyan-50", text: "text-cyan-700", activeBg: "bg-cyan-600", activeText: "text-white" },
  { bg: "bg-indigo-50", text: "text-indigo-700", activeBg: "bg-indigo-600", activeText: "text-white" },
  { bg: "bg-orange-50", text: "text-orange-700", activeBg: "bg-orange-600", activeText: "text-white" },
];

function hashTag(tag: string): number {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getTagColor(tag: string) {
  const index = hashTag(tag) % TAG_COLORS.length;
  return TAG_COLORS[index];
}
