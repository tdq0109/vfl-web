import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

/* Bảng biểu mật độ cao cho người vận hành. `align="right"` tự bật `tabular-nums`
   để cột tiền thẳng hàng — quy ước trong lộ trình bàn giao. */

type Align = 'left' | 'right' | 'center';

const ALIGN: Record<Align, string> = {
  left: '',
  right: 'text-right tabular-nums',
  center: 'text-center',
};

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn('w-full border-collapse text-left text-sm text-ink', className)}
        {...props}
      />
    </div>
  );
}

export function Th({
  className,
  align = 'left',
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: Align }) {
  return (
    <th
      className={cn(
        'border-b border-line px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted',
        ALIGN[align],
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  align = 'left',
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { align?: Align }) {
  return (
    <td
      className={cn('border-b border-line px-3 py-2 align-middle', ALIGN[align], className)}
      {...props}
    />
  );
}
