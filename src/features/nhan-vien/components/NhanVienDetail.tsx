import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { canManageStaff, roleKhoa } from '@/lib/auth/permissions';
import type { UserProfile } from '@/lib/auth/types';
import { fmtDate } from '@/lib/format';
import {
  NHAN_VIEN_STATUS_KHOA,
  NHAN_VIEN_STATUS_ORDER,
  type DoiVaiTroInput,
  type NhanVien,
  type NhanVienStatus,
} from '../types';
import { TrangThaiPill } from './TrangThaiPill';
import { VaiTroPanel } from './VaiTroPanel';

interface Props {
  nhanVien: NhanVien;
  actor: UserProfile;
  changingStatus?: boolean;
  changingRole?: boolean;
  roleFieldErrors?: Record<string, string>;
  onDoiTrangThai: (status: NhanVienStatus) => void;
  onDoiVaiTro: (input: DoiVaiTroInput) => void;
  onEdit: () => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{children}</span>
    </div>
  );
}

export function NhanVienDetail({
  nhanVien,
  actor,
  changingStatus,
  changingRole,
  roleFieldErrors,
  onDoiTrangThai,
  onDoiVaiTro,
  onEdit,
}: Props) {
  const t = useT();
  const duocSuaHoSo = canManageStaff(actor, {
    role: nhanVien.vaiTro,
    locationId: nhanVien.locationId,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrangThaiPill status={nhanVien.trangThai} />
          <span className="text-sm text-muted">{nhanVien.maNhanVien}</span>
        </div>
        {duocSuaHoSo ? (
          <Button size="sm" variant="ghost" onClick={onEdit}>
            {t('action.sua')}
          </Button>
        ) : null}
      </div>

      <div className="divide-y divide-line">
        <Row label={t('chung.hoTen')}>{nhanVien.hoTen}</Row>
        <Row label={t('chung.vaiTro')}>{t(roleKhoa(nhanVien.vaiTro))}</Row>
        <Row label={t('chung.dienThoai')}>{nhanVien.soDienThoai}</Row>
        <Row label={t('chung.email')}>{nhanVien.email}</Row>
        <Row label={t('chung.cauLacBo')}>
          {nhanVien.allLocations
            ? t('chung.toanHeThong')
            : (nhanVien.locationName ?? nhanVien.locationId)}
        </Row>
        <Row label={t('nhanVien.vaoLam')}>{fmtDate(nhanVien.ngayVaoLam)}</Row>
        <Row label={t('chung.ghiChu')}>{nhanVien.ghiChu ?? '—'}</Row>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted">{t('nhanVien.phanQuyen')}</h3>
        <VaiTroPanel
          nhanVien={nhanVien}
          actor={actor}
          fieldErrors={roleFieldErrors}
          submitting={changingRole}
          onSubmit={onDoiVaiTro}
        />
      </div>

      {duocSuaHoSo ? (
        <div className="space-y-1">
          <label htmlFor="nv-doi-trang-thai" className="text-sm font-medium text-ink">
            {t('chung.doiTrangThai')}
          </label>
          <select
            id="nv-doi-trang-thai"
            className="field"
            value={nhanVien.trangThai}
            disabled={changingStatus}
            onChange={(e) => {
              const next = e.target.value as NhanVienStatus;
              if (next !== nhanVien.trangThai) onDoiTrangThai(next);
            }}
          >
            {NHAN_VIEN_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {t(NHAN_VIEN_STATUS_KHOA[s])}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}
