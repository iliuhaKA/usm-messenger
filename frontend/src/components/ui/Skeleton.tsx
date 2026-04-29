import { cn } from '../../utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />;
}

export function ChatRowSkeleton() {
  return (
    <div className="flex gap-3 rounded-xl px-3 py-2.5">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function MessageSkeleton({ mine = false }: { mine?: boolean }) {
  return (
    <div className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''}`}>
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className={`max-w-[70%] space-y-2 ${mine ? 'items-end' : ''}`}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-56 rounded-2xl" />
      </div>
    </div>
  );
}
