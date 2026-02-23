export function Skeleton({ className = "h-4" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#e6ebdb] ${className}`.trim()} />;
}
