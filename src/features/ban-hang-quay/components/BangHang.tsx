import { Card } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { money } from '@/lib/format';
import type { HangQuay } from '../types';

/* Lưới hàng bấm để thêm vào giỏ — nút to, bấm nhanh, không cần nhìn kỹ. */
interface Props {
  hang: HangQuay[];
  onChon: (mon: HangQuay) => void;
  disabled?: boolean;
}

export function BangHang({ hang, onChon, disabled }: Props) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {hang.map((h) => (
        <button
          key={h.id}
          type="button"
          disabled={disabled}
          onClick={() => onChon(h)}
          className="rounded-card border border-line bg-surface p-3 text-left shadow-card transition-colors hover:bg-brand-tint disabled:opacity-50"
        >
          <p className="text-sm font-medium text-ink">{h.ten}</p>
          <p className="mt-1 text-base font-bold tabular-nums text-brand-ink">{money(h.gia)}</p>
        </button>
      ))}
      {hang.length === 0 ? (
        <Card className="col-span-full text-center text-sm text-muted">
          {t('quay.chuaCoMatHang')}
        </Card>
      ) : null}
    </div>
  );
}
