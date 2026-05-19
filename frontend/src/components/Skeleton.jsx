export function ShoeCardSkeleton() {
  return (
    <div className="surface-card overflow-hidden rounded-[1.75rem] animate-pulse">
      <div className="h-52 w-full bg-[#e9efe4]" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-[#e9efe4]" />
        <div className="h-3 w-1/3 rounded bg-[#edf3e8]" />
        <div className="h-9 rounded-2xl bg-[#e1ecdc]" />
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="surface-card flex gap-3 rounded-[1.5rem] p-4 animate-pulse">
      <div className="h-16 w-16 rounded-2xl bg-[#e9efe4]" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 rounded bg-[#e9efe4]" />
        <div className="h-3 w-1/3 rounded bg-[#edf3e8]" />
      </div>
    </div>
  );
}

export function TextSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-4 rounded bg-[#e9efe4] ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}
