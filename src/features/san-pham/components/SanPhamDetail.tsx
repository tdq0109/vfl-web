import type { ReactNode } from 'react';
import { Button, Pill } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { hasMinRole } from '@/lib/auth/permissions';
import type { UserProfile } from '@/lib/auth/types';
import { fmtDate, money } from '@/lib/format';
import { GiaSanPanel } from './GiaSanPanel';
import {
  LOAI_SAN_PHAM_KHOA,
  SAN_PHAM_STATUS_KHOA,
  type SanPham,
  type SanPhamStatus,
} from '../types';

interface Props {
  sanPham: SanPham;
  actor: UserProfile;
  changingStatus?: boolean;
  settingFloor?: boolean;
  floorFieldErrors?: Record<string, string>;
  onDatGiaSan: (giaSan: number) => void;
  onDoiTrangThai: (status: SanPhamStatus) => void;
  onEdit: () => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{children}</span>
    </div>
  );
}

export function SanPhamDetail({
  sanPham,
  actor,
  changingStatus,
  settingFloor,
  floorFieldErrors,
  onDatGiaSan,
  onDoiTrangThai,
  onEdit,
}: Props) {
  const t = useT();
  const duocSua = hasMinRole(actor, 'manager');
  const dangBan = sanPham.trangThai === 'dang-ban';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Pill tone={dangBan ? 'ok' : 'default'}>
            {t(SAN_PHAM_STATUS_KHOA[sanPham.trangThai])}
          </Pill>
          <span className="text-sm text-muted">{sanPham.maSanPham}</span>
        </div>
        {duocSua ? (
          <Button size="sm" variant="ghost" onClick={onEdit}>
            {t('action.sua')}
          </Button>
        ) : null}
      </div>

      <div className="divide-y divide-line">
        <Row label={t('chung.ten')}>{sanPham.ten}</Row>
        <Row label={t('chung.loai')}>{t(LOAI_SAN_PHAM_KHOA[sanPham.loai])}</Row>
        <Row label={t('sanPham.giaNiemYet')}>
          <span className="font-semibold tabular-nums">{money(sanPham.giaNiemYet)}</span>
        </Row>
        <Row label={t('sanPham.thoiHan')}>
          {sanPham.thoiHanNgay ? t('sanPham.soNgayGiaTri', { so: sanPham.thoiHanNgay }) : '—'}
        </Row>
        <Row label={t('sanPham.soBuoi')}>
          {sanPham.soBuoi ? t('sanPham.soBuoiGiaTri', { so: sanPham.soBuoi }) : '—'}
        </Row>
        <Row label={t('chung.cauLacBo')}>{sanPham.locationName ?? t('chung.moiClb')}</Row>
        <Row label={t('sanPham.ngayTao')}>{fmtDate(sanPham.ngayTao)}</Row>
        <Row label={t('chung.moTa')}>{sanPham.moTa ?? '—'}</Row>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted">{t('sanPham.giaSan')}</h3>
        <GiaSanPanel
          sanPham={sanPham}
          actor={actor}
          fieldErrors={floorFieldErrors}
          submitting={settingFloor}
          onSubmit={onDatGiaSan}
        />
      </div>

      {duocSua ? (
        <Button
          variant={dangBan ? 'danger' : 'primary'}
          size="sm"
          disabled={changingStatus}
          onClick={() => onDoiTrangThai(dangBan ? 'ngung-ban' : 'dang-ban')}
        >
          {/* NÚT, không phải trạng thái — khoá riêng, xem ghi chú ở `types.ts`. */}
          {dangBan ? t('sanPham.ngungBanNut') : t('sanPham.moBanLai')}
        </Button>
      ) : null}
    </div>
  );
}
