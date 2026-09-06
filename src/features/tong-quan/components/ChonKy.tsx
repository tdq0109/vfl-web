'use client';

import { useId } from 'react';
import { useT } from '@/components/shell/NgonNguProvider';
import { cn } from '@/lib/utils';
import { kyHopLe } from '../tong-quan';
import { MA_KY_KHOA, MA_KY_ORDER, type Ky, type MaKy } from '../types';

/* Chọn kỳ xem: bốn nút nhanh + hai ô ngày.

   Thuần trình bày. Sửa ô ngày là tự chuyển sang `tuy-chon` — nút nhanh không
   còn sáng nữa, để người xem không tưởng mình đang xem "7 ngày" trong khi
   khoảng ngày đã khác. */

interface Props {
  ma: MaKy;
  ky: Ky;
  onChonNhanh: (ma: MaKy) => void;
  onDoiKy: (ky: Ky) => void;
}

export function ChonKy({ ma, ky, onChonNhanh, onDoiKy }: Props) {
  const t = useT();
  const uid = useId();
  const nguoc = !kyHopLe(ky);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-wrap gap-1 rounded-control bg-brand-tint p-1">
        {MA_KY_ORDER.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChonNhanh(m)}
            className={cn(
              'rounded-control px-2.5 py-1.5 text-xs font-semibold transition-colors',
              ma === m ? 'bg-brand text-white' : 'text-brand-ink hover:bg-brand-soft',
            )}
          >
            {t(MA_KY_KHOA[m])}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-1.5">
        <div>
          <label htmlFor={`${uid}-tu`} className="sr-only">
            {t('chung.tuNgay')}
          </label>
          <input
            id={`${uid}-tu`}
            type="date"
            className="field w-40"
            value={ky.tuNgay}
            onChange={(e) => onDoiKy({ ...ky, tuNgay: e.target.value })}
          />
        </div>
        <span className="pb-2 text-muted">→</span>
        <div>
          <label htmlFor={`${uid}-den`} className="sr-only">
            {t('chung.denNgay')}
          </label>
          <input
            id={`${uid}-den`}
            type="date"
            className="field w-40"
            value={ky.denNgay}
            onChange={(e) => onDoiKy({ ...ky, denNgay: e.target.value })}
          />
        </div>
      </div>

      {nguoc ? <p className="pb-2 text-xs text-bad">{t('tongQuan.kyNguoc')}</p> : null}
    </div>
  );
}
