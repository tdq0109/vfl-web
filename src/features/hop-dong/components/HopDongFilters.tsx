import { Search } from 'lucide-react';
import { useT } from '@/components/shell/NgonNguProvider';
import {
  TRANG_THAI_HOP_DONG_KHOA,
  TRANG_THAI_HOP_DONG_ORDER,
  type TrangThaiHopDong,
} from '../types';

/* Thuần trình bày: nhận giá trị lọc và hàm đổi, không tự gọi API. */

export interface HopDongFilterValue {
  search: string;
  trangThai?: TrangThaiHopDong;
}

interface Props {
  value: HopDongFilterValue;
  onChange: (value: HopDongFilterValue) => void;
}

export function HopDongFilters({ value, onChange }: Props) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder={t('hopDong.timKiem')}
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
            trangThai: e.target.value ? (e.target.value as TrangThaiHopDong) : undefined,
          })
        }
        className="field w-56"
      >
        <option value="">{t('chung.moiTrangThai')}</option>
        {TRANG_THAI_HOP_DONG_ORDER.map((s) => (
          <option key={s} value={s}>
            {t(TRANG_THAI_HOP_DONG_KHOA[s])}
          </option>
        ))}
      </select>
    </div>
  );
}
