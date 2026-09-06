import Link from 'next/link';
import { CalendarClock, FileClock, ShieldCheck, Store } from 'lucide-react';
import { Card } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { cn } from '@/lib/utils';
import type { HomNay } from '../types';

/* Khối "hôm nay" — việc đang chờ người vận hành, ai đăng nhập cũng xem được.

   Đây là phần dashboard dùng nhiều nhất trong ngày: không phải để biết doanh
   thu mà để biết còn việc gì chưa xong. Mỗi ô dẫn thẳng tới màn xử lý. */

interface Props {
  data: HomNay;
}

function O({
  href,
  icon,
  nhan,
  so,
  canChuY,
}: {
  href: string;
  icon: React.ReactNode;
  /** Chữ ĐÃ DỊCH — `O` là khối xếp chữ, không tự tra từ điển. */
  nhan: string;
  so: React.ReactNode;
  canChuY?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-control border border-line px-3 py-2.5 transition-colors hover:bg-brand-tint',
        canChuY && 'border-warn/40 bg-pill-warn-bg hover:bg-pill-warn-bg',
      )}
    >
      <span className={cn('shrink-0', canChuY ? 'text-warn' : 'text-brand')}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-lg font-bold leading-tight tabular-nums text-ink">{so}</span>
        <span className="block text-xs text-muted">{nhan}</span>
      </span>
    </Link>
  );
}

export function HomNayPanel({ data }: Props) {
  const t = useT();
  return (
    <Card className="space-y-3">
      <h2 className="text-sm font-bold text-ink">{t('tongQuan.homNay')}</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <O
          href="/dat-lich"
          icon={<CalendarClock className="h-5 w-5" />}
          nhan={t('tongQuan.buoiTapHomNay')}
          so={data.soBuoiHomNay}
        />
        <O
          href="/dat-lich"
          icon={<CalendarClock className="h-5 w-5" />}
          nhan={t('tongQuan.buoiConChoTrong')}
          so={data.soBuoiConCho}
        />
        <O
          href="/ban-hang/hop-dong"
          icon={<FileClock className="h-5 w-5" />}
          nhan={t('tongQuan.hopDongChoThuTien')}
          so={data.hopDongChoThuTien}
          canChuY={data.hopDongChoThuTien > 0}
        />
        <O
          href="/ban-hang/hop-dong"
          icon={<ShieldCheck className="h-5 w-5" />}
          nhan={t('tongQuan.hopDongChoXacMinh')}
          so={data.hopDongChoXacMinh}
          canChuY={data.hopDongChoXacMinh > 0}
        />
      </div>

      {data.caQuayDangMo !== null ? (
        <Link
          href="/ban-hang/quay"
          className="flex items-center gap-2 text-sm text-muted hover:text-ink"
        >
          <Store className="h-4 w-4" />
          {data.caQuayDangMo ? t('tongQuan.quayDangMoCa') : t('tongQuan.quayChuaMoCa')}
        </Link>
      ) : null}
    </Card>
  );
}
