import { Table, Td, Th } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { fmtDate, maskPhone } from '@/lib/format';
import type { HoiVien } from '../types';
import { TrangThaiPill } from './TrangThaiPill';

/* Thuần trình bày: nhận hàng và hàm bấm-hàng. */
interface Props {
  rows: HoiVien[];
  onRowClick: (id: string) => void;
}

export function HoiVienTable({ rows, onRowClick }: Props) {
  const t = useT();
  return (
    <Table>
      <thead>
        <tr>
          <Th>{t('hoiVien.maHV')}</Th>
          <Th>{t('chung.hoTen')}</Th>
          <Th>{t('chung.dienThoai')}</Th>
          <Th>{t('chung.clb')}</Th>
          <Th>{t('chung.trangThai')}</Th>
          <Th align="right">{t('hoiVien.thamGia')}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((hv) => (
          <tr
            key={hv.id}
            onClick={() => onRowClick(hv.id)}
            className="cursor-pointer hover:bg-brand-tint"
          >
            <Td className="font-medium text-ink">{hv.maHoiVien}</Td>
            <Td>{hv.hoTen}</Td>
            <Td>{maskPhone(hv.soDienThoai)}</Td>
            <Td>{hv.locationName ?? '—'}</Td>
            <Td>
              <TrangThaiPill status={hv.trangThai} />
            </Td>
            <Td align="right">{fmtDate(hv.ngayThamGia)}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
