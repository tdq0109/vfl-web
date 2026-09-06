import { Globe } from 'lucide-react';
import { Pill, Table, Td, Th } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { roleKhoa } from '@/lib/auth/permissions';
import { maskPhone } from '@/lib/format';
import type { NhanVien } from '../types';
import { TrangThaiPill } from './TrangThaiPill';

interface Props {
  rows: NhanVien[];
  onRowClick: (id: string) => void;
}

export function NhanVienTable({ rows, onRowClick }: Props) {
  const t = useT();
  return (
    <Table>
      <thead>
        <tr>
          <Th>{t('nhanVien.maNV')}</Th>
          <Th>{t('chung.hoTen')}</Th>
          <Th>{t('chung.vaiTro')}</Th>
          <Th>{t('chung.dienThoai')}</Th>
          <Th>{t('chung.clb')}</Th>
          <Th>{t('chung.trangThai')}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((nv) => (
          <tr
            key={nv.id}
            onClick={() => onRowClick(nv.id)}
            className="cursor-pointer hover:bg-brand-tint"
          >
            <Td className="font-medium text-ink">{nv.maNhanVien}</Td>
            <Td>{nv.hoTen}</Td>
            <Td>
              <Pill>{t(roleKhoa(nv.vaiTro))}</Pill>
            </Td>
            <Td>{maskPhone(nv.soDienThoai)}</Td>
            <Td>
              {nv.allLocations ? (
                <span className="inline-flex items-center gap-1 text-brand-ink">
                  <Globe className="h-3.5 w-3.5" />
                  {t('chung.toanHeThong')}
                </span>
              ) : (
                (nv.locationName ?? '—')
              )}
            </Td>
            <Td>
              <TrangThaiPill status={nv.trangThai} />
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
