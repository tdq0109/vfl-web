'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useT } from '@/components/shell/NgonNguProvider';
import { Button } from './Button';

/* Hộp thoại xác nhận cho hành động khó lùi. Cùng nền Radix với Drawer.

   Nhãn mặc định gọi t() trong thân hàm chứ không đặt ở giá trị mặc định của
   tham số — mặc định tính một lần lúc nạp module nên chữ bị đóng băng. */

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = false,
  pending = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const t = useT();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-card bg-surface p-5 shadow-menu focus:outline-none">
          <Dialog.Title className="text-base font-bold text-ink">{title}</Dialog.Title>
          <Dialog.Description
            className={description ? 'mt-1 text-sm text-muted' : 'sr-only'}
          >
            {description ?? t('nen.xacNhanHanhDong')}
          </Dialog.Description>

          {children ? <div className="mt-3">{children}</div> : null}

          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm">
                {cancelLabel ?? t('action.huy')}
              </Button>
            </Dialog.Close>
            <Button
              size="sm"
              variant={danger ? 'danger' : 'primary'}
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? t('state.dangXuLy') : (confirmLabel ?? t('chung.xacNhan'))}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
