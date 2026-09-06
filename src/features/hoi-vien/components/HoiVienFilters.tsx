import { Search } from 'lucide-react';
import { useT } from '@/components/shell/NgonNguProvider';
import { HOI_VIEN_STATUS_KHOA, HOI_VIEN_STATUS_ORDER, type HoiVienStatus } from '../types';

/* Thuần trình bày: nhận giá trị lọc và hàm đổi, không tự gọi API. */

export interface HoiVienFilterValue {
  search: string;
  trangThai?: HoiVienStatus;
}

interface Props {
  value: HoiVienFilterValue;
  onChange: (value: HoiVienFilterValue) => void;
}

export function HoiVienFilters({ value, onChange }: Props) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder={t('hoiVien.timKiem')}
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          className="field w-72 pl-8"
        />
      </div>

      <select
        aria-label={t('chung.trangThai')}
        value={value.trangThai ?? ''}
        onChange={(e) =>
          onChange({
            ...value,
            trangThai: e.target.value ? (e.target.value as HoiVienStatus) : undefined,
          })
        }
        className="field w-44"
      >
        <option value="">{t('chung.moiTrangThai')}</option>
        {HOI_VIEN_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {t(HOI_VIEN_STATUS_KHOA[s])}
          </option>
        ))}
      </select>
    </div>
  );
}
