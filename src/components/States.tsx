export function GridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse rounded-xl border border-neutral-800 bg-neutral-900"
        />
      ))}
    </div>
  );
}

export function Notice({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children?: React.ReactNode;
  tone?: "neutral" | "error";
}) {
  const toneStyles =
    tone === "error"
      ? "border-red-900/60 bg-red-950/30 text-red-200"
      : "border-neutral-800 bg-neutral-900/60 text-neutral-300";

  return (
    <div className={`rounded-xl border px-5 py-8 text-center ${toneStyles}`}>
      <p className="font-medium">{title}</p>
      {children && <p className="mt-1 text-sm opacity-80">{children}</p>}
    </div>
  );
}
