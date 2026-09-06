import { Table, Td, Th } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { fmtDate, money } from '@/lib/format';
import { conPhaiThu, tinhTongHopDong, trangThaiHienThi } from '../hop-dong';
import type { HopDong } from '../types';
import { TrangThaiPill } from './TrangThaiPill';

/* Thuần trình bày. Cột "Còn phải thu" là con số quan trọng nhất của màn này:
   nhìn một cái biết hợp đồng nào đang treo tiền. */

interface Props {
  rows: HopDong[];
  onRowClick: (id: string) => void;
}

export function HopDongTable({ rows, onRowClick }: Props) {
  const t = useT();
  return (
    <Table>
      <thead>
        <tr>
          <Th>{t('hopDong.maHD')}</Th>
          <Th>{t('chung.hoiVien')}</Th>
          <Th>{t('chung.clb')}</Th>
          <Th>{t('hopDong.nguoiLap')}</Th>
          <Th>{t('chung.trangThai')}</Th>
          <Th align="right">{t('chung.tong')}</Th>
          <Th align="right">{t('hopDong.conPhaiThu')}</Th>
          <Th align="right">{t('hopDong.ngayLap')}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((hd) => {
          const con = conPhaiThu(hd);
          return (
            <tr
              key={hd.id}
              onClick={() => onRowClick(hd.id)}
              className="cursor-pointer hover:bg-brand-tint"
            >
              <Td className="font-medium text-ink">{hd.maHopDong}</Td>
              <Td>{hd.hoiVienTen}</Td>
              <Td>{hd.locationName ?? '—'}</Td>
              <Td>{hd.nguoiLapTen}</Td>
              <Td>
                <TrangThaiPill status={trangThaiHienThi(hd)} />
              </Td>
              <Td align="right">{money(tinhTongHopDong(hd.dong, hd.khuyenMai).tong)}</Td>
              <Td align="right" className={con > 0 ? 'font-semibold text-bad' : 'text-muted'}>
                {con > 0 ? money(con) : '—'}
              </Td>
              <Td align="right">{fmtDate(hd.ngayLap)}</Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
