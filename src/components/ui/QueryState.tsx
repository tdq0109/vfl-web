'use client';

import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useT } from '@/components/shell/NgonNguProvider';
import { ApiError } from '@/lib/api/errors';
import { Button } from './Button';

/* Gom ba trạng thái tải / lỗi / rỗng vào một chỗ. Nhận cờ boolean thuần để
   không phụ thuộc TanStack Query.

   Ba nhãn mặc định gọi t() trong thân hàm, không đặt ở giá trị mặc định của
   tham số — mặc định tính một lần lúc nạp module nên chữ bị đóng băng. */
interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  isEmpty?: boolean;
  onRetry?: () => void;
  loadingText?: string;
  emptyText?: string;
  errorText?: string;
  children: ReactNode;
}

/* Đây là màn hiện lỗi, tức là chỗ được phép dịch của ApiError: lớp lỗi dựng
   ngoài React nên nó chỉ giữ khoá (khoaThongDiep), xem lib/api/errors.ts.
   Backend có trả detail/title thì câu đó là chữ thật, hiện nguyên văn. */
function messageOf(
  error: unknown,
  fallback: string,
  t: (key: string, thamSo?: Record<string, string | number>) => string,
): string {
  if (error instanceof ApiError && error.khoaThongDiep) {
    return t(error.khoaThongDiep, { ma: error.status });
  }
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}

export function QueryState({
  isLoading,
  isError,
  error,
  isEmpty = false,
  onRetry,
  loadingText,
  emptyText,
  errorText,
  children,
}: QueryStateProps) {
  const t = useT();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        {loadingText ?? t('state.dangTai')}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-bad">{messageOf(error, errorText ?? t('state.loi'), t)}</p>
        {onRetry ? (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            {t('action.thuLai')}
          </Button>
        ) : null}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="py-12 text-center text-sm text-muted">
        {emptyText ?? t('state.trong')}
      </div>
    );
  }

  return <>{children}</>;
}
