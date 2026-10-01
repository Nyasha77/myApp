export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-surface-raised ${className}`} />;
}

export default function LoadingSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <SkeletonLine key={i} className="h-16" />
      ))}
    </div>
  );
}
