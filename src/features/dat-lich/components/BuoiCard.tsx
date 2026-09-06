import { Users } from 'lucide-react';
import { Pill } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { cn } from '@/lib/utils';
import { khungGio, soChoConLai, trangThaiBuoi } from '../lich';
import { LOAI_BUOI_NGAN_KHOA, type Buoi, type TrangThaiBuoi } from '../types';

const TONE: Record<TrangThaiBuoi, 'ok' | 'warn' | 'bad' | 'default'> = {
  mo: 'ok',
  day: 'warn',
  'da-huy': 'bad',
  'da-xong': 'default',
};

export function BuoiCard({ buoi, onClick }: { buoi: Buoi; onClick: () => void }) {
  const t = useT();
  const trangThai = trangThaiBuoi(buoi);
  const conLai = soChoConLai(buoi);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-control border border-line bg-surface p-2 text-left transition-colors hover:bg-brand-tint',
        buoi.daHuy && 'opacity-60',
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-semibold tabular-nums text-brand-ink">
          {khungGio(buoi.batDau, buoi.ketThuc)}
        </span>
        <Pill tone={TONE[trangThai]} className="shrink-0">
          {t(LOAI_BUOI_NGAN_KHOA[buoi.loai])}
        </Pill>
      </div>

      <p className="mt-0.5 truncate text-sm text-ink">{buoi.ten}</p>

      <div className="mt-1 flex items-center justify-between gap-1 text-xs text-muted">
        <span className="truncate">{buoi.hlvTen ?? t('datLich.chuaPhanHlv')}</span>
        <span className="flex shrink-0 items-center gap-0.5 tabular-nums">
          <Users className="h-3 w-3" />
          {buoi.sucChua - conLai}/{buoi.sucChua}
        </span>
      </div>

      {buoi.hangCho.length > 0 ? (
        <p className="mt-0.5 text-xs text-warn">
          {t('datLich.hangChoSo', { so: buoi.hangCho.length })}
        </p>
      ) : null}
    </button>
  );
}
