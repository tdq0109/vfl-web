import { Pill, Table, Td, Th } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { fmtDateTime, money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PHUONG_THUC_KHOA, type DongSoGiaoDich } from '../types';

/* Sổ giao dịch — mọi phiếu bán tại quầy, để đối chiếu. Thuần trình bày, cột
   "ca" ẩn được khi bảng đã nằm trong ngăn kéo của một ca.

   Giao dịch đã huỷ vẫn nằm trong sổ, chỉ gạch ngang kèm lý do: giấu đi là mất
   dấu vết của mẫu gian lận cổ điển nhất ở quầy — bấm bán, thu tiền, rồi huỷ
   phiếu — mà đối soát tiền mặt không nhìn thấy. */

interface Props {
  dong: DongSoGiaoDich[];
  /** Ẩn cột ca/thu ngân khi bảng đã nằm trong ngữ cảnh một ca cụ thể. */
  anCotCa?: boolean;
}

export function SoGiaoDichBang({ dong, anCotCa = false }: Props) {
  const t = useT();

  return (
    <Table>
      <thead>
        <tr>
          <Th>{t('quay.luc')}</Th>
          {anCotCa ? null : <Th>{t('quay.giamSat.maCa')}</Th>}
          {anCotCa ? null : <Th>{t('quay.giamSat.thuNgan')}</Th>}
          <Th>{t('chung.ma')}</Th>
          <Th>{t('quay.matHang')}</Th>
          <Th>{t('chung.khach')}</Th>
          <Th>{t('quay.thanhToan')}</Th>
          <Th align="right">{t('quay.tongTien')}</Th>
        </tr>
      </thead>
      <tbody>
        {dong.map((g) => (
          <tr key={g.id} className={cn(g.daHuy && 'bg-pill-bad-bg/30')}>
            <Td className="whitespace-nowrap text-xs">{fmtDateTime(g.luc)}</Td>
            {anCotCa ? null : <Td className="text-xs">{g.maCa}</Td>}
            {anCotCa ? null : <Td className="text-xs">{g.thuNganTen}</Td>}
            <Td className="font-medium text-ink">{g.maGiaoDich}</Td>
            <Td className="text-xs">
              {g.dong.map((d) => `${d.ten} ×${d.soLuong}`).join(', ') || '—'}
            </Td>
            <Td className="text-xs">{g.khachTen || t('quay.khachVangLai')}</Td>
            <Td className="text-xs">{t(PHUONG_THUC_KHOA[g.phuongThuc])}</Td>
            <Td align="right">
              <span className={cn(g.daHuy && 'text-muted line-through')}>{money(g.tongTien)}</span>
              {g.daHuy ? (
                <div className="mt-0.5 flex flex-col items-end gap-0.5">
                  <Pill tone="bad">{t('quay.daHuyGd')}</Pill>
                  {/* Lý do huỷ là do người dùng nhập — hiện nguyên văn, không dịch. */}
                  {g.lyDoHuy ? (
                    <span className="max-w-48 text-right text-[11px] font-normal text-muted">
                      {g.lyDoHuy}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
