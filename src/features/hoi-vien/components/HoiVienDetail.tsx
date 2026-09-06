import { Button } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { fmtDate } from '@/lib/format';
import {
  GIOI_TINH_KHOA,
  HOI_VIEN_STATUS_KHOA,
  HOI_VIEN_STATUS_ORDER,
  type HoiVien,
  type HoiVienStatus,
} from '../types';
import { TrangThaiPill } from './TrangThaiPill';

/* Thuần trình bày. Đổi trạng thái và Sửa chỉ phát sự kiện lên trên. */
interface Props {
  hoiVien: HoiVien;
  changingStatus?: boolean;
  onDoiTrangThai: (status: HoiVienStatus) => void;
  onEdit: () => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{children}</span>
    </div>
  );
}

export function HoiVienDetail({ hoiVien, changingStatus, onDoiTrangThai, onEdit }: Props) {
  const t = useT();
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrangThaiPill status={hoiVien.trangThai} />
          <span className="text-sm text-muted">{hoiVien.maHoiVien}</span>
        </div>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          {t('action.sua')}
        </Button>
      </div>

      <div className="divide-y divide-line">
        <Row label={t('chung.hoTen')}>{hoiVien.hoTen}</Row>
        <Row label={t('chung.dienThoai')}>{hoiVien.soDienThoai}</Row>
        <Row label={t('chung.email')}>{hoiVien.email ?? '—'}</Row>
        <Row label={t('chung.gioiTinh')}>
          {hoiVien.gioiTinh ? t(GIOI_TINH_KHOA[hoiVien.gioiTinh]) : '—'}
        </Row>
        <Row label={t('chung.ngaySinh')}>{hoiVien.ngaySinh ? fmtDate(hoiVien.ngaySinh) : '—'}</Row>
        <Row label={t('chung.cauLacBo')}>{hoiVien.locationName ?? hoiVien.locationId}</Row>
        <Row label={t('hoiVien.thamGia')}>{fmtDate(hoiVien.ngayThamGia)}</Row>
        <Row label={t('chung.ghiChu')}>{hoiVien.ghiChu ?? '—'}</Row>
      </div>

      <div className="space-y-1">
        <label htmlFor="doi-trang-thai" className="text-sm font-medium text-ink">
          {t('chung.doiTrangThai')}
        </label>
        <select
          id="doi-trang-thai"
          className="field"
          value={hoiVien.trangThai}
          disabled={changingStatus}
          onChange={(e) => {
            const next = e.target.value as HoiVienStatus;
            if (next !== hoiVien.trangThai) onDoiTrangThai(next);
          }}
        >
          {HOI_VIEN_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {t(HOI_VIEN_STATUS_KHOA[s])}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
