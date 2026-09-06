import { useT } from '@/components/shell/NgonNguProvider';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { tinhTongHopDong } from '../hop-dong';
import type { DongHopDong, KhuyenMaiApDung } from '../types';

/* Bảng tổng tiền — thay cho class `.totals` của bản cũ.

   Thuần trình bày, nhưng CON SỐ THÌ TỰ TÍNH bằng `tinhTongHopDong()`: tổng
   không được lưu ở đâu cả, mọi nơi hiển thị phải đi qua đúng một hàm. */

interface Props {
  dong: readonly DongHopDong[];
  khuyenMai?: KhuyenMaiApDung;
  /** Có phần thu tiền thì truyền vào để hiện "đã thu / còn phải thu". */
  daThu?: number;
  className?: string;
}

function Dong({ label, value, manh }: { label: string; value: string; manh?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className={cn('tabular-nums', manh ? 'text-base font-bold text-ink' : 'text-ink')}>
        {value}
      </span>
    </div>
  );
}

export function BangTongTien({ dong, khuyenMai, daThu, className }: Props) {
  const t = useT();
  /* Bản tính KHÔNG đặt tên `t` nữa — `t` nay là hàm dịch của `useT()`. */
  const so = tinhTongHopDong(dong, khuyenMai);
  const con = daThu === undefined ? undefined : Math.max(0, so.tong - daThu);

  return (
    <div className={cn('rounded-control bg-brand-tint px-3 py-2', className)}>
      <Dong label={t('hopDong.tamTinh', { so: dong.length })} value={money(so.tamTinh)} />
      {khuyenMai ? (
        <Dong
          label={t('hopDong.khuyenMaiMa', { ma: khuyenMai.ma })}
          value={`- ${money(so.giam)}`}
        />
      ) : null}
      <div className="border-t border-line">
        <Dong label={t('hopDong.tongHopDong')} value={money(so.tong)} manh />
      </div>
      {daThu !== undefined ? (
        <div className="border-t border-line">
          <Dong label={t('hopDong.daThu')} value={money(daThu)} />
          <div className="flex items-baseline justify-between gap-2 py-1.5 text-sm">
            <span className="text-muted">{t('hopDong.conPhaiThu')}</span>
            <span
              className={cn(
                'text-base font-bold tabular-nums',
                con === 0 ? 'text-ok' : 'text-bad',
              )}
            >
              {money(con)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
