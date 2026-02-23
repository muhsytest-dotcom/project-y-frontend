export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#cfd5c4] bg-white p-4 text-sm">
      <p className="font-semibold">{title}</p>
      {description ? <p className="soft mt-1">{description}</p> : null}
    </div>
  );
}
