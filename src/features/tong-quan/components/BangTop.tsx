import { Table, Td, Th } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { money } from '@/lib/format';
import type { TopSanPham } from '../types';

/* Sản phẩm bán chạy trong kỳ. Thuần trình bày. */

export function BangTop({ rows }: { rows: TopSanPham[] }) {
  const t = useT();
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{t('tongQuan.chuaBanDuocGi')}</p>;
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>{t('chung.sanPham')}</Th>
          <Th align="right">{t('chung.soLuong')}</Th>
          <Th align="right">{t('chung.doanhThu')}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.sanPhamId}>
            <Td>{r.ten}</Td>
            <Td align="right">{r.soLuong}</Td>
            <Td align="right" className="font-semibold">
              {money(r.doanhThu)}
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
