import { Pill, Table, Td, Th } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { fmtDateTime, money } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DongDoiSoatTrongChuoi } from '../giamSat';
import { TRANG_THAI_CA_KHOA } from '../types';
import { ChuYPill } from './ChuYPill';

/* Bảng ca cho người giám sát. Thuần trình bày: nhận các dòng ĐÃ TÍNH SẴN từ
   `giamSat.ts::doiSoatMotCa()`, không tự tính lấy con số nào.

   ⚠ CỘT "LỆCH" CÓ BA TRẠNG THÁI, không phải hai: lệch dương, lệch âm, và CHƯA
   BIẾT (ca chưa đóng). Hiện "0 ₫" cho ca chưa đóng là nói dối — nó gợi ý đã đếm
   và khớp, trong khi chưa ai đếm cả. Dấu "—" mới đúng. */

interface Props {
  dong: DongDoiSoatTrongChuoi[];
  onChonCa: (caId: string) => void;
}

export function BangCa({ dong, onChonCa }: Props) {
  const t = useT();

  return (
    <Table>
      <thead>
        <tr>
          <Th>{t('quay.giamSat.maCa')}</Th>
          <Th>{t('quay.giamSat.thuNgan')}</Th>
          <Th>{t('chung.clb')}</Th>
          <Th>{t('quay.giamSat.khoangCa')}</Th>
          <Th>{t('chung.trangThai')}</Th>
          <Th align="right">{t('quay.tongDoanhThu')}</Th>
          <Th align="right">{t('quay.giamSat.kyVong')}</Th>
          <Th align="right">{t('quay.tienMatDemDuoc')}</Th>
          <Th align="right">{t('quay.giamSat.lech')}</Th>
          <Th>{t('quay.giamSat.dauHieu')}</Th>
        </tr>
      </thead>
      <tbody>
        {dong.map((d) => (
          <tr
            key={d.ca.id}
            onClick={() => onChonCa(d.ca.id)}
            className="cursor-pointer hover:bg-brand-tint"
          >
            <Td className="font-medium text-ink">{d.ca.maCa}</Td>
            <Td>{d.ca.thuNganTen}</Td>
            <Td>{d.ca.locationName ?? '—'}</Td>
            <Td className="whitespace-nowrap text-xs">
              {fmtDateTime(d.ca.moLuc)}
              <span className="text-muted">
                {' → '}
                {d.ca.dongLuc ? fmtDateTime(d.ca.dongLuc) : t('quay.giamSat.chuaDong')}
              </span>
            </Td>
            <Td>
              <Pill tone={d.ca.trangThai === 'dang-mo' ? 'warn' : 'ok'}>
                {t(TRANG_THAI_CA_KHOA[d.ca.trangThai])}
              </Pill>
            </Td>
            <Td align="right">{money(d.tomTat.tongDoanhThu)}</Td>
            <Td align="right">{money(d.tomTat.tienMatKyVong)}</Td>
            {/* Ca chưa đóng: chưa đếm thì không có số để hiện. */}
            <Td align="right">{d.tienDem === null ? '—' : money(d.tienDem)}</Td>
            <Td align="right">
              {d.lech === null ? (
                <span className="text-muted">—</span>
              ) : (
                <span
                  className={cn(
                    'font-semibold',
                    d.cap === 'khop' ? 'text-ok' : d.cap === 'nang' ? 'text-bad' : 'text-warn',
                  )}
                >
                  {d.lech > 0 ? '+' : ''}
                  {money(d.lech)}
                </span>
              )}
            </Td>
            <Td>
              <div className="flex flex-wrap gap-1">
                {d.chuYGop.map((khoa) => (
                  <ChuYPill key={khoa} khoa={khoa} />
                ))}
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
