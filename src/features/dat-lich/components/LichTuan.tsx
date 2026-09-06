import { useT } from '@/components/shell/NgonNguProvider';
import { addDays, fmtDate, toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { gomTheoNgay } from '../lich';
import type { Buoi } from '../types';
import { BuoiCard } from './BuoiCard';

/* Lịch tuần: 7 cột ngày, mỗi cột liệt kê buổi theo giờ. Chọn cột-theo-ngày
   thay vì lưới-theo-giờ vì buổi tập rải rác từ 6h tới 21h, lưới theo giờ sẽ để
   trống phần lớn diện tích và ép cuộn ngang trên máy quầy. */

/* Khoá i18n của bảy thứ, thứ Hai đứng đầu. Kiểu bộ-bảy cố định chứ không phải
   string[]: thiếu hay thừa một phần tử là lệch cả tuần, để TypeScript đếm hộ. */
const THU_KHOA: readonly [string, string, string, string, string, string, string] = [
  'chung.thuHai',
  'chung.thuBa',
  'chung.thuTu',
  'chung.thuNam',
  'chung.thuSau',
  'chung.thuBay',
  'chung.chuNhat',
];

interface Props {
  /** Thứ Hai của tuần đang xem. */
  thuHai: Date;
  buois: Buoi[];
  onChonBuoi: (id: string) => void;
}

export function LichTuan({ thuHai, buois, onChonBuoi }: Props) {
  const t = useT();
  const theoNgay = gomTheoNgay(buois);
  const homNay = toIsoDate(new Date());

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {THU_KHOA.map((khoaThu, i) => {
        const ngay = toIsoDate(addDays(thuHai, i));
        const cua = theoNgay.get(ngay) ?? [];
        const laHomNay = ngay === homNay;

        return (
          <div
            key={ngay}
            className={cn(
              'flex min-h-32 flex-col rounded-card border bg-bg/40 p-2',
              laHomNay ? 'border-brand' : 'border-line',
            )}
          >
            <div className="mb-2 flex items-baseline justify-between gap-1">
              <span
                className={cn(
                  'text-xs font-semibold',
                  laHomNay ? 'text-brand-ink' : 'text-muted',
                )}
              >
                {t(khoaThu)}
              </span>
              <span className="text-xs tabular-nums text-muted">{fmtDate(ngay).slice(0, 5)}</span>
            </div>

            <div className="space-y-1.5">
              {cua.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted">{t('datLich.khongCoBuoi')}</p>
              ) : (
                cua.map((b) => <BuoiCard key={b.id} buoi={b} onClick={() => onChonBuoi(b.id)} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
