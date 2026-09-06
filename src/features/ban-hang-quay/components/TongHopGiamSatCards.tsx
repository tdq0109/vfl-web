import { Card } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TongHopGiamSat } from '../giamSat';

/* Dải số tổng phía trên bảng ca. Thuần trình bày.

   ⚠ HIỆN CẢ HAI CON SỐ LỆCH, và cố ý đặt cạnh nhau:
     · "Lệch ròng"  = thừa và thiếu bù trừ nhau — con số kế toán quan tâm;
     · "Tổng sai sót" = cộng trị tuyệt đối — QUY MÔ sai sót thật.
   Một ca thừa 100k và một ca thiếu 100k cho lệch ròng bằng 0. Chỉ hiện con số ấy
   là người xem kết luận "hôm nay không lệch đồng nào", trong khi có hai ca sai. */

interface Props {
  tongHop: TongHopGiamSat;
}

function O({
  nhan,
  giaTri,
  phu,
  tone,
}: {
  nhan: string;
  giaTri: string;
  phu?: string;
  tone?: 'ok' | 'warn' | 'bad';
}) {
  return (
    <Card className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-muted">{nhan}</div>
      <div
        className={cn(
          'text-xl font-bold tabular-nums',
          tone === 'bad' ? 'text-bad' : tone === 'warn' ? 'text-warn' : 'text-ink',
        )}
      >
        {giaTri}
      </div>
      {phu ? <div className="text-xs text-muted">{phu}</div> : null}
    </Card>
  );
}

export function TongHopGiamSatCards({ tongHop: th }: Props) {
  const t = useT();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <O
        nhan={t('quay.giamSat.soCa')}
        giaTri={String(th.soCa)}
        phu={t('quay.giamSat.dangMoSo', { so: th.soCaDangMo })}
      />
      <O
        nhan={t('quay.tongDoanhThu')}
        giaTri={money(th.tongDoanhThu)}
        phu={t('quay.giamSat.tienMatSo', { soTien: money(th.tienMat) })}
      />
      <O
        nhan={t('quay.giamSat.lechRong')}
        giaTri={`${th.tongLech > 0 ? '+' : ''}${money(th.tongLech)}`}
        phu={t('quay.giamSat.tongSaiSot', {
          soTien: money(th.tongLechTuyetDoi),
          soCa: th.soCaLech,
        })}
        {...(th.tongLechTuyetDoi > 0 ? { tone: 'warn' as const } : {})}
      />
      <O
        nhan={t('quay.giamSat.caCanChuY')}
        giaTri={String(th.soCaCanChuY)}
        phu={t('quay.giamSat.huySo', {
          so: th.soGiaoDichHuy,
          soTien: money(th.tienHuy),
        })}
        {...(th.soCaCanChuY > 0 ? { tone: 'bad' as const } : {})}
      />
    </div>
  );
}
