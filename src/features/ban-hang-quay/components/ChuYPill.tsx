import { AlertTriangle } from 'lucide-react';
import { useT } from '@/components/shell/NgonNguProvider';

/* Nhãn "cần chú ý" của một ca. Thuần trình bày.

   Nhận KHOÁ i18n do `giamSat.ts::chuYCuaCa()` trả về — hàm thuần không biết
   ngôn ngữ nào đang bật nên chỉ trả khoá, chỗ này mới dịch. */

interface Props {
  /** Khoá i18n, ví dụ 'quay.giamSat.chuY.lechKhongLyDo'. */
  khoa: string;
}

export function ChuYPill({ khoa }: Props) {
  const t = useT();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-pill-warn-bg px-2 py-0.5 text-xs font-semibold text-pill-warn-fg">
      <AlertTriangle className="h-3 w-3 shrink-0" />
      {t(khoa)}
    </span>
  );
}
