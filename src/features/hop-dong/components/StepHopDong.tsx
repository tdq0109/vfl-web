import { Check } from 'lucide-react';
import { useT } from '@/components/shell/NgonNguProvider';
import { cn } from '@/lib/utils';
import { BUOC_HOP_DONG, buocHienTai } from '../hop-dong';
import { TRANG_THAI_HOP_DONG_KHOA, type TrangThaiHopDong } from '../types';

/* Thanh 5 bước — thay cho class `.step` của bản cũ.

   Thuần trình bày: chỉ nhận trạng thái, tự tra bước từ `BUOC_HOP_DONG`. Bước đã
   qua tick xanh, bước đang đứng tô đậm, bước sau xám.

   Hợp đồng ra khỏi luồng thuận (đã huỷ / tạm dừng) thì thanh bước vô nghĩa —
   hiện một dải nhắc trạng thái thay vì vẽ 5 ô chết. */

export function StepHopDong({ trangThai }: { trangThai: TrangThaiHopDong }) {
  const t = useT();
  const buoc = buocHienTai(trangThai);

  if (buoc < 0) {
    return (
      <div className="rounded-control bg-pill-bad-bg px-3 py-2 text-sm font-semibold text-pill-bad-fg">
        {t('hopDong.ngoaiLuongThuan', { trangThai: t(TRANG_THAI_HOP_DONG_KHOA[trangThai]) })}
      </div>
    );
  }

  return (
    <ol className="flex flex-wrap items-center gap-1.5">
      {BUOC_HOP_DONG.map((b, i) => {
        const xong = i < buoc;
        const dangO = i === buoc;
        return (
          <li
            key={b.khoa}
            className={cn(
              'flex items-center gap-1.5 rounded-control px-2.5 py-1.5 text-xs font-semibold',
              xong && 'bg-pill-ok-bg text-pill-ok-fg',
              dangO && 'bg-brand text-white',
              !xong && !dangO && 'bg-pill-bg text-muted',
            )}
          >
            {xong ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <span className="tabular-nums">{i + 1}.</span>
            )}
            {t(b.khoa)}
          </li>
        );
      })}
    </ol>
  );
}
