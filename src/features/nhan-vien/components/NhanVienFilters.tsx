import { Search } from 'lucide-react';
import { useT } from '@/components/shell/NgonNguProvider';
import { ROLE_KHOA, ROLE_ORDER, type Role } from '@/lib/auth/permissions';
import { NHAN_VIEN_STATUS_KHOA, NHAN_VIEN_STATUS_ORDER, type NhanVienStatus } from '../types';

export interface NhanVienFilterValue {
  search: string;
  vaiTro?: Role;
  trangThai?: NhanVienStatus;
}

interface Props {
  value: NhanVienFilterValue;
  onChange: (value: NhanVienFilterValue) => void;
}

export function NhanVienFilters({ value, onChange }: Props) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder={t('nhanVien.timKiem')}
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          className="field w-72 pl-8"
        />
      </div>

      <select
        aria-label={t('chung.vaiTro')}
        value={value.vaiTro ?? ''}
        onChange={(e) =>
          onChange({ ...value, vaiTro: e.target.value ? (e.target.value as Role) : undefined })
        }
        className="field w-44"
      >
        <option value="">{t('chung.moiVaiTro')}</option>
        {ROLE_ORDER.map((r) => (
          <option key={r} value={r}>
            {t(ROLE_KHOA[r])}
          </option>
        ))}
      </select>

      <select
        aria-label={t('chung.trangThai')}
        value={value.trangThai ?? ''}
        onChange={(e) =>
          onChange({
            ...value,
            trangThai: e.target.value ? (e.target.value as NhanVienStatus) : undefined,
          })
        }
        className="field w-40"
      >
        <option value="">{t('chung.moiTrangThai')}</option>
        {NHAN_VIEN_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {t(NHAN_VIEN_STATUS_KHOA[s])}
          </option>
        ))}
      </select>
    </div>
  );
}
