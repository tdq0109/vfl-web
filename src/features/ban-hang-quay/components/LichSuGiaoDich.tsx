import { Pill, Table, Td, Th } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { fmtDateTime, money } from '@/lib/format';
import { PHUONG_THUC_KHOA, type GiaoDich } from '../types';

interface Props {
  giaoDich: GiaoDich[];
  canHuy: boolean;
  onHuy: (gd: GiaoDich) => void;
}

export function LichSuGiaoDich({ giaoDich, canHuy, onHuy }: Props) {
  const t = useT();
  if (giaoDich.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">{t('quay.chuaCoGiaoDich')}</p>;
  }

  /* Mới nhất lên đầu — thu ngân cần huỷ giao dịch vừa bấm nhầm. */
  const rows = [...giaoDich].reverse();

  return (
    <Table>
      <thead>
        <tr>
          <Th>{t('chung.ma')}</Th>
          <Th>{t('quay.luc')}</Th>
          <Th>{t('quay.matHang')}</Th>
          <Th>{t('chung.khach')}</Th>
          <Th>{t('quay.thanhToan')}</Th>
          <Th align="right">{t('chung.soTien')}</Th>
          <Th />
        </tr>
      </thead>
      <tbody>
        {rows.map((g) => (
          <tr key={g.id} className={g.daHuy ? 'opacity-60' : undefined}>
            <Td className="font-medium text-ink">{g.maGiaoDich}</Td>
            <Td className="whitespace-nowrap tabular-nums">{fmtDateTime(g.luc).slice(11)}</Td>
            <Td className="max-w-48 truncate">
              {g.dong.map((d) => `${d.ten} ×${d.soLuong}`).join(', ')}
            </Td>
            <Td>{g.khachTen || t('quay.khachVangLai')}</Td>
            <Td>{t(PHUONG_THUC_KHOA[g.phuongThuc])}</Td>
            <Td align="right" className={g.daHuy ? 'line-through' : 'font-semibold'}>
              {money(g.tongTien)}
            </Td>
            <Td align="right">
              {g.daHuy ? (
                <Pill tone="bad" title={g.lyDoHuy}>
                  {t('quay.daHuyGd')}
                </Pill>
              ) : canHuy ? (
                <button
                  type="button"
                  onClick={() => onHuy(g)}
                  className="text-xs font-medium text-bad hover:underline"
                >
                  {t('quay.huyGd')}
                </button>
              ) : null}
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
