import { useT } from '@/components/shell/NgonNguProvider';
import type { Location } from '@/lib/api/types';
import { TRANG_THAI_CA_KHOA, type BoLocGiamSat, type TrangThaiCa } from '../types';

/* Bộ lọc màn Giám sát ca. Thuần trình bày: nhận giá trị + hàm đổi, không gọi API.

   Ô CLB chỉ liệt kê những CLB người này được giao. Đó là tiện lợi, KHÔNG phải
   bảo mật: backend vẫn phải tự cắt danh sách theo quyền, vì ai cũng sửa được
   tham số trên URL. */

interface Props {
  value: BoLocGiamSat;
  onChange: (value: BoLocGiamSat) => void;
  clbOptions: Location[];
}

const TRANG_THAI: TrangThaiCa[] = ['dang-mo', 'da-dong'];

export function BoLocGiamSatCa({ value, onChange, clbOptions }: Props) {
  const t = useT();

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-muted">
        {t('chung.tuNgay')}
        <input
          type="date"
          className="field w-40"
          value={value.tuNgay ?? ''}
          onChange={(e) => onChange({ ...value, tuNgay: e.target.value || undefined })}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        {t('chung.denNgay')}
        <input
          type="date"
          className="field w-40"
          value={value.denNgay ?? ''}
          onChange={(e) => onChange({ ...value, denNgay: e.target.value || undefined })}
        />
      </label>

      <select
        aria-label={t('chung.clb')}
        className="field w-44"
        value={value.locationId ?? ''}
        onChange={(e) => onChange({ ...value, locationId: e.target.value || undefined })}
      >
        <option value="">{t('chung.moiClb')}</option>
        {clbOptions.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      <select
        aria-label={t('chung.trangThai')}
        className="field w-40"
        value={value.trangThai ?? ''}
        onChange={(e) =>
          onChange({
            ...value,
            trangThai: e.target.value ? (e.target.value as TrangThaiCa) : undefined,
          })
        }
      >
        <option value="">{t('chung.moiTrangThai')}</option>
        {TRANG_THAI.map((tt) => (
          <option key={tt} value={tt}>
            {t(TRANG_THAI_CA_KHOA[tt])}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 pb-2 text-sm text-ink">
        <input
          type="checkbox"
          className="h-4 w-4 accent-brand"
          checked={value.chiCanChuY ?? false}
          onChange={(e) => onChange({ ...value, chiCanChuY: e.target.checked || undefined })}
        />
        {t('quay.giamSat.chiCanChuY')}
      </label>
    </div>
  );
}
