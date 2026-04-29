import { useMemo } from 'react';

import { getFileUrl } from '../api/files.api';
import { cn } from '../utils/cn';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-24 w-24 text-2xl',
};

const ONLINE_DOT: Record<AvatarSize, string> = {
  sm: 'h-2 w-2 right-0 bottom-0',
  md: 'h-2.5 w-2.5 right-0 bottom-0',
  lg: 'h-3 w-3 right-0.5 bottom-0.5',
  xl: 'h-4 w-4 right-1 bottom-1',
};

interface AvatarProps {
  name: string;
  fileId?: string | null;
  url?: string | null;
  size?: AvatarSize;
  online?: boolean;
  className?: string;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function Avatar({ name, fileId, url, size = 'md', online, className }: AvatarProps) {
  const src = useMemo(() => url ?? getFileUrl(fileId), [url, fileId]);
  const initials = useMemo(() => initialsOf(name), [name]);

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold uppercase text-primary',
          SIZE_CLASS[size]
        )}
      >
        {src ? (
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          initials
        )}
      </span>
      {online !== undefined && (
        <span
          className={cn(
            'absolute rounded-full ring-2 ring-white',
            ONLINE_DOT[size],
            online ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      )}
    </span>
  );
}
