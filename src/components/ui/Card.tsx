import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* Bề mặt nội dung — thay cho `.card` bản cũ. Mặc định có `p-4` vì đó là dạng
   dùng nhiều nhất; cần bảng tràn viền thì truyền `className="p-0"`, tailwind-merge
   tự bỏ padding mặc định. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-card border border-line bg-surface p-4 shadow-card', className)}
      {...props}
    />
  );
}
