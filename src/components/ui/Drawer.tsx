'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useT } from '@/components/shell/NgonNguProvider';
import { cn } from '@/lib/utils';

/* Ngăn kéo trượt từ phải — dựng trên Radix Dialog nên đúng ARIA (focus trap,
   Esc, khoá cuộn nền) mà không phải tự viết. Dùng cho xem chi tiết và form
   thêm/sửa. Bước 9 có thể thay bằng shadcn dialog nếu muốn; API tương thích. */

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DrawerProps) {
  const t = useT();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30" />
        <Dialog.Content
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-menu focus:outline-none',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-bold text-ink">{title}</Dialog.Title>
              <Dialog.Description
                className={description ? 'mt-0.5 text-sm text-muted' : 'sr-only'}
              >
                {description ?? t('nen.bangThongTin')}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label={t('action.dong')}
              className="rounded-control p-1 text-muted hover:bg-brand-tint hover:text-ink"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-auto px-5 py-4">{children}</div>

          {footer ? (
            <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
