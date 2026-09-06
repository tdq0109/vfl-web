import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* Nhãn trạng thái — thay cho `.pill` / `.pill.ok` / `.pill.warn` / `.pill.bad`.
   Bốn tông dùng cặp token nền + chữ đã cấu hình trong tailwind.config.ts. */

type Tone = 'default' | 'ok' | 'warn' | 'bad';

const TONE: Record<Tone, string> = {
  default: 'bg-pill-bg text-pill-fg',
  ok: 'bg-pill-ok-bg text-pill-ok-fg',
  warn: 'bg-pill-warn-bg text-pill-warn-fg',
  bad: 'bg-pill-bad-bg text-pill-bad-fg',
};

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Pill({ className, tone = 'default', ...props }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
}
