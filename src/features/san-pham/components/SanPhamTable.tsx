import { Pill, Table, Td, Th } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { money } from '@/lib/format';
import { LOAI_SAN_PHAM_KHOA, SAN_PHAM_STATUS_KHOA, type SanPham } from '../types';

interface Props {
  rows: SanPham[];
  onRowClick: (id: string) => void;
}

export function SanPhamTable({ rows, onRowClick }: Props) {
  const t = useT();
  return (
    <Table>
      <thead>
        <tr>
          <Th>{t('chung.ma')}</Th>
          <Th>{t('sanPham.tenSanPham')}</Th>
          <Th>{t('chung.loai')}</Th>
          <Th align="right">{t('sanPham.giaNiemYet')}</Th>
          <Th align="right">{t('sanPham.giaSan')}</Th>
          <Th>{t('chung.clb')}</Th>
          <Th>{t('chung.trangThai')}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((sp) => (
          <tr
            key={sp.id}
            onClick={() => onRowClick(sp.id)}
            className="cursor-pointer hover:bg-brand-tint"
          >
            <Td className="font-medium text-ink">{sp.maSanPham}</Td>
            <Td>{sp.ten}</Td>
            <Td>{t(LOAI_SAN_PHAM_KHOA[sp.loai])}</Td>
            <Td align="right">{money(sp.giaNiemYet)}</Td>
            <Td align="right" className="text-muted">
              {money(sp.giaSan)}
            </Td>
            <Td>{sp.locationName ?? t('chung.moiClb')}</Td>
            <Td>
              <Pill tone={sp.trangThai === 'dang-ban' ? 'ok' : 'default'}>
                {t(SAN_PHAM_STATUS_KHOA[sp.trangThai])}
              </Pill>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
