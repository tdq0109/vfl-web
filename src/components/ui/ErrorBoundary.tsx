'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useT } from '@/components/shell/NgonNguProvider';
import { Button } from './Button';

/* Bọc từng màn: lỗi render một màn không làm trắng cả app. React chưa có bản
   hook cho error boundary nên vẫn phải là class component. */

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /* Gọi khi người dùng bấm "Thử lại" — nơi để reset state/refetch đã gây lỗi
     (Bước 4 nối với reset của TanStack Query). */
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

/* Khung báo lỗi tách riêng thành hàm vì class component KHÔNG gọi được hook.

   Dịch được ở đây là nhờ `useNgonNgu()` rơi về tiếng Việt thay vì ném khi đứng
   ngoài provider — chủ ý đã ghi ở `NgonNguProvider`. Nếu nó ném thì màn báo lỗi
   sẽ tự nó gây lỗi, đúng lúc không còn boundary nào đỡ nữa. */
function KhungLoi({ error, onReset }: { error: Error; onReset: () => void }) {
  const t = useT();

  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface p-8 text-center">
      <p className="font-semibold text-ink">{t('loi.man')}</p>
      <p className="max-w-md text-sm text-muted">{error.message}</p>
      <Button variant="ghost" size="sm" onClick={onReset}>
        {t('action.thuLai')}
      </Button>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary bắt lỗi màn:', error, info.componentStack);
  }

  private reset = (): void => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return <KhungLoi error={error} onReset={this.reset} />;
  }
}
