import { Pill } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { fmtDateTime, money } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DongDoiSoat } from '../giamSat';
import { soGiaoDich } from '../giamSat';
import { TRANG_THAI_CA_KHOA } from '../types';
import { ChuYPill } from './ChuYPill';
import { SoGiaoDichBang } from './SoGiaoDichBang';

/* Nội dung ngăn kéo "chi tiết một ca" — phiếu đối soát ĐỌC-CHỈ của người giám
   sát, kèm toàn bộ giao dịch của ca.

   Cố ý giống hệt bố cục `DoiSoatCa.tsx` mà thu ngân nhìn thấy lúc đóng ca: hai
   bên đối chiếu cùng một tờ giấy thì mới cãi nhau được bằng số. Khác một điểm
   duy nhất — ở đây không có ô nhập, không đóng được ca của người khác. */

interface Props {
  dong: DongDoiSoat;
}

function Hang({ nhan, giaTri, manh }: { nhan: string; giaTri: string; manh?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5 text-sm">
      <span className="text-muted">{nhan}</span>
      <span className={cn('tabular-nums', manh ? 'font-bold text-ink' : 'text-ink')}>
        {giaTri}
      </span>
    </div>
  );
}

export function ChiTietCa({ dong: d }: Props) {
  const t = useT();
  const ca = d.ca;
  const so = soGiaoDich([ca]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={ca.trangThai === 'dang-mo' ? 'warn' : 'ok'}>
          {t(TRANG_THAI_CA_KHOA[ca.trangThai])}
        </Pill>
        {d.chuY.map((khoa) => (
          <ChuYPill key={khoa} khoa={khoa} />
        ))}
      </div>

      <div className="text-sm text-muted">
        {ca.thuNganTen} · {ca.locationName ?? '—'}
        <br />
        {fmtDateTime(ca.moLuc)}
        {' → '}
        {ca.dongLuc ? fmtDateTime(ca.dongLuc) : t('quay.giamSat.chuaDong')}
        {' · '}
        {t('quay.giamSat.keoDai', { gio: d.soGio.toFixed(1) })}
      </div>

      <div className="divide-y divide-line">
        <Hang nhan={t('quay.tienDauCa')} giaTri={money(d.tomTat.tienDauCa)} />
        <Hang nhan={t('quay.tienMatBanDuoc')} giaTri={money(d.tomTat.tienMat)} />
        <Hang nhan={t('quay.chuyenKhoanKhongVaoKet')} giaTri={money(d.tomTat.chuyenKhoan)} />
        <Hang nhan={t('quay.theKhongVaoKet')} giaTri={money(d.tomTat.the)} />
        <Hang nhan={t('quay.tongDoanhThu')} giaTri={money(d.tomTat.tongDoanhThu)} manh />
        <Hang
          nhan={t('quay.soGiaoDich')}
          giaTri={
            d.tomTat.soGiaoDichHuy > 0
              ? t('quay.soGiaoDichCoHuy', {
                  so: d.tomTat.soGiaoDich,
                  soHuy: d.tomTat.soGiaoDichHuy,
                })
              : String(d.tomTat.soGiaoDich)
          }
        />
      </div>

      <div className="space-y-1 rounded-control bg-brand-tint p-3">
        <Hang nhan={t('quay.tienMatPhaiCoTrongKet')} giaTri={money(d.tomTat.tienMatKyVong)} manh />
        <Hang
          nhan={t('quay.tienMatDemDuoc')}
          giaTri={d.tienDem === null ? t('quay.giamSat.chuaDem') : money(d.tienDem)}
        />
        {d.lech === null ? null : (
          <div
            className={cn(
              'mt-1 rounded-control px-3 py-2 text-sm font-semibold',
              d.cap === 'khop'
                ? 'bg-pill-ok-bg text-pill-ok-fg'
                : d.cap === 'nang'
                  ? 'bg-pill-bad-bg text-pill-bad-fg'
                  : 'bg-pill-warn-bg text-pill-warn-fg',
            )}
          >
            {d.lech === 0
              ? t('quay.khopKet')
              : t(d.lech > 0 ? 'quay.thua' : 'quay.thieu', {
                  soTien: money(Math.abs(d.lech)),
                })}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-muted">{t('chung.ghiChu')}</div>
        {/* Ghi chú do thu ngân gõ — hiện nguyên văn. Trống mà ca lại lệch thì
            chính là dấu hiệu "lệch không ai giải thích" ở trên. */}
        <p className="mt-1 text-sm text-ink">
          {ca.ghiChuDongCa?.trim() || <span className="text-muted">—</span>}
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-ink">
          {t('quay.giamSat.soGiaoDichCuaCa', { so: so.length })}
        </h3>
        {so.length === 0 ? (
          <p className="text-sm text-muted">{t('quay.chuaCoGiaoDich')}</p>
        ) : (
          <div className="overflow-x-auto">
            <SoGiaoDichBang dong={so} anCotCa />
          </div>
        )}
      </div>
    </div>
  );
}
