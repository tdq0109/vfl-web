'use client';

import { useSyncExternalStore } from 'react';
import { CheckCircle2, Info, X, XCircle, type LucideIcon } from 'lucide-react';
import { useT } from '@/components/shell/NgonNguProvider';
import { cn } from '@/lib/utils';

/* Hàng đợi toast sống ở module scope nên gọi được từ ngoài React — hook mutation
   ở Bước 4 sẽ gọi `toast.ok('Đã lưu')` mà không cần context. `<Toaster />` đặt
   một lần trong layout để nghe hàng đợi này. */

export type ToastTone = 'ok' | 'bad' | 'info';

export interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

type Listener = () => void;

let queue: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ToastItem[] {
  return queue;
}

/* Server render luôn không có toast; trả hằng để useSyncExternalStore không báo
   snapshot đổi liên tục. */
const EMPTY: ToastItem[] = [];
function getServerSnapshot(): ToastItem[] {
  return EMPTY;
}

function dismiss(id: number): void {
  queue = queue.filter((t) => t.id !== id);
  emit();
}

/** Dọn sạch hàng đợi.

    Hàng đợi sống ở module scope nên nó sống qua cả lần gắn lại <Toaster />. */
function dismissAll(): void {
  queue = [];
  emit();
}

function push(message: string, tone: ToastTone, durationMs: number): number {
  const id = nextId++;
  queue = [...queue, { id, tone, message }];
  emit();
  if (durationMs > 0) {
    setTimeout(() => dismiss(id), durationMs);
  }
  return id;
}

interface ToastFn {
  (message: string, tone?: ToastTone, durationMs?: number): number;
  ok: (message: string, durationMs?: number) => number;
  error: (message: string, durationMs?: number) => number;
  info: (message: string, durationMs?: number) => number;
  dismiss: (id: number) => void;
  dismissAll: () => void;
}

export const toast: ToastFn = Object.assign(
  (message: string, tone: ToastTone = 'info', durationMs = 4000) =>
    push(message, tone, durationMs),
  {
    ok: (message: string, durationMs = 4000) => push(message, 'ok', durationMs),
    error: (message: string, durationMs = 6000) => push(message, 'bad', durationMs),
    info: (message: string, durationMs = 4000) => push(message, 'info', durationMs),
    dismiss,
    dismissAll,
  },
);

const ICON: Record<ToastTone, LucideIcon> = {
  ok: CheckCircle2,
  bad: XCircle,
  info: Info,
};

const ICON_TONE: Record<ToastTone, string> = {
  ok: 'text-ok',
  bad: 'text-bad',
  info: 'text-brand',
};

export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const t = useT();
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end">
      {/* Biến vòng lặp là `muc`, KHÔNG phải `t` — `t` là hàm dịch trong cùng
          hàm này, và che nó đi thì đọc mã không phân biệt được `t.message` với
          `t('...')`. Cùng lý do đã đổi tên biến tab ở nhóm Sản phẩm. */}
      {items.map((muc) => {
        const Icon = ICON[muc.tone];
        return (
          <div
            key={muc.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-control border border-line bg-surface p-3 text-sm text-ink shadow-menu"
          >
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', ICON_TONE[muc.tone])} />
            <span className="flex-1">{muc.message}</span>
            <button
              type="button"
              onClick={() => dismiss(muc.id)}
              aria-label={t('action.dong')}
              className="text-muted transition-colors hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
