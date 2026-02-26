export default function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-16 w-16 opacity-30"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p className="text-sm">Select a note or create a new one</p>
    </div>
  );
}
