import { Search } from 'lucide-react';
import { useT } from '@/components/shell/NgonNguProvider';
import {
  LOAI_SAN_PHAM_KHOA,
  LOAI_SAN_PHAM_ORDER,
  SAN_PHAM_STATUS_KHOA,
  SAN_PHAM_STATUS_ORDER,
  type LoaiSanPham,
  type SanPhamStatus,
} from '../types';

export interface SanPhamFilterValue {
  search: string;
  loai?: LoaiSanPham;
  trangThai?: SanPhamStatus;
}

interface Props {
  value: SanPhamFilterValue;
  onChange: (value: SanPhamFilterValue) => void;
}

export function SanPhamFilters({ value, onChange }: Props) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder={t('sanPham.timKiem')}
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          className="field w-64 pl-8"
        />
      </div>

      <select
        aria-label={t('sanPham.loaiSanPham')}
        value={value.loai ?? ''}
        onChange={(e) =>
          onChange({ ...value, loai: e.target.value ? (e.target.value as LoaiSanPham) : undefined })
        }
        className="field w-40"
      >
        <option value="">{t('chung.moiLoai')}</option>
        {LOAI_SAN_PHAM_ORDER.map((l) => (
          <option key={l} value={l}>
            {t(LOAI_SAN_PHAM_KHOA[l])}
          </option>
        ))}
      </select>

      <select
        aria-label={t('chung.trangThai')}
        value={value.trangThai ?? ''}
        onChange={(e) =>
          onChange({
            ...value,
            trangThai: e.target.value ? (e.target.value as SanPhamStatus) : undefined,
          })
        }
        className="field w-40"
      >
        <option value="">{t('chung.moiTrangThai')}</option>
        {SAN_PHAM_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {t(SAN_PHAM_STATUS_KHOA[s])}
          </option>
        ))}
      </select>
    </div>
  );
}
