import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { cn } from '@/lib/utils';
import { chieuThayDoi, moTaThayDoi, phanTramThayDoi } from '../tong-quan';

/* Một ô chỉ số + mức thay đổi so với kỳ trước.

   Thuần trình bày, nhưng phần SO SÁNH gọi hàm thuần đã có test: kỳ trước bằng 0
   thì hiện “mới”, không hiện “+∞%”.

   `tangLaTot = false` cho các chỉ số mà tăng là xấu (công nợ) — tô màu theo Ý
   NGHĨA, không theo dấu. */

interface Props {
  /** Chữ ĐÃ DỊCH, không phải khoá — màn gọi `t()` rồi truyền vào. */
  nhan: string;
  giaTri: ReactNode;
  /** Bỏ trống nếu chỉ số không so sánh theo kỳ (ví dụ công nợ tại thời điểm xem). */
  nay?: number;
  truoc?: number;
  tangLaTot?: boolean;
  phu?: ReactNode;
}

export function ChiSoCard({ nhan, giaTri, nay, truoc, tangLaTot = true, phu }: Props) {
  const t = useT();
  const pt = nay === undefined || truoc === undefined ? null : phanTramThayDoi(nay, truoc);
  const chieu = chieuThayDoi(pt);
  const coSoSanh = nay !== undefined && truoc !== undefined;

  const tot = chieu === 'tang' ? tangLaTot : chieu === 'giam' ? !tangLaTot : null;

  return (
    <Card className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-muted">{nhan}</div>
      <div className="text-xl font-bold tabular-nums text-ink">{giaTri}</div>

      {coSoSanh ? (
        <div className="flex items-center gap-1 text-xs">
          {chieu === 'khong-so-duoc' ? (
            <span className="font-semibold text-muted">{t('tongQuan.moiKhongCoSo')}</span>
          ) : (
            <>
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-semibold',
                  tot === null ? 'text-muted' : tot ? 'text-ok' : 'text-bad',
                )}
              >
                {chieu === 'tang' ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : chieu === 'giam' ? (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                ) : (
                  <Minus className="h-3.5 w-3.5" />
                )}
                {moTaThayDoi(pt)}
              </span>
              <span className="text-muted">{t('tongQuan.soVoiKyTruoc')}</span>
            </>
          )}
        </div>
      ) : null}

      {phu ? <div className="text-xs text-muted">{phu}</div> : null}
    </Card>
  );
}
