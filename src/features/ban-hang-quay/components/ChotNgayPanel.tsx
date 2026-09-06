'use client';

import { useId, useState } from 'react';
import { AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { Button, Card, Pill } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { fmtDate, fmtDateTime, money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { tongKetNgay, viSaoKhongChotDuocNgay } from '../chuyenCa';
import type { KhungCa, NgayCuaClb } from '../khungCa';
import type { ChotNgay } from '../types';

/* Chốt ngày — bản tổng kết cả ngày để nhân viên xác nhận rồi mới khoá lại.

   Đây không phải một nút bấm cho xong; nó là tờ giấy mà người trực quầy ký vào,
   nên phải nói đủ để người ấy dám ký:

   - tiền mặt đầu ngày → cuối ngày lẽ ra phải có → đếm được bao nhiêu;
   - doanh thu tách theo phương thức (chỉ tiền mặt mới vào két);
   - có gì bất thường không: lệch két, lệch bàn giao, phiếu huỷ, ca mở muộn,
     khung không ai trực. Giấu mấy dòng này đi thì chữ ký thành vô nghĩa.

   Chốt xong là khoá, không mở thêm ca cho ngày đó, và nút phải nói rõ điều ấy
   trước khi bấm.

   Thuần trình bày: mọi con số do chuyenCa.ts::tongKetNgay() tính sẵn. */

interface Props {
  ngay: string;
  locationName: string;
  /** `null` khi ngày không có ca nào. */
  chuoi: NgayCuaClb | null;
  khung: readonly KhungCa[];
  daChot: ChotNgay | null;
  submitting?: boolean;
  onChotNgay: (ghiChu: string) => void;
}

function Hang({
  nhan,
  giaTri,
  manh,
  tone,
}: {
  nhan: string;
  giaTri: string;
  manh?: boolean;
  tone?: 'ok' | 'warn' | 'bad';
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5 text-sm">
      <span className="text-muted">{nhan}</span>
      <span
        className={cn(
          'tabular-nums',
          tone === 'bad' ? 'text-bad' : tone === 'warn' ? 'text-warn' : 'text-ink',
          manh && 'font-bold',
        )}
      >
        {giaTri}
      </span>
    </div>
  );
}

export function ChotNgayPanel({
  ngay,
  locationName,
  chuoi,
  khung,
  daChot,
  submitting,
  onChotNgay,
}: Props) {
  const t = useT();
  const uid = useId();
  const [ghiChu, setGhiChu] = useState('');

  const cacCa = chuoi?.matXich.map((m) => m.ca) ?? [];
  const lyDo = viSaoKhongChotDuocNgay(cacCa, daChot !== null);
  const tk = chuoi ? tongKetNgay(chuoi, khung) : null;

  /* Những dòng chỉ hiện khi có vấn đề. Ngày sạch thì không bày ra để người ta
     phải đọc lướt qua bốn số 0 rồi mới tới nút. */
  const batThuong: { nhan: string; giaTri: string }[] = [];
  if (tk) {
    if (tk.tongLechKet !== 0) {
      batThuong.push({
        nhan: t('quay.chotNgay.tongLechKet'),
        giaTri: `${tk.tongLechKet > 0 ? '+' : ''}${money(tk.tongLechKet)}`,
      });
    }
    if (tk.tongLechBanGiao !== 0) {
      batThuong.push({
        nhan: t('quay.chotNgay.tongLechBanGiao'),
        giaTri: `${tk.tongLechBanGiao > 0 ? '+' : ''}${money(tk.tongLechBanGiao)}`,
      });
    }
    if (tk.soGiaoDichHuy > 0) {
      batThuong.push({
        nhan: t('quay.chotNgay.phieuHuy'),
        giaTri: t('quay.giamSat.huySo', { so: tk.soGiaoDichHuy, soTien: money(tk.tienHuy) }),
      });
    }
    if (tk.soCaMoMuon > 0) {
      batThuong.push({
        nhan: t('quay.chotNgay.caMoMuon'),
        giaTri: String(tk.soCaMoMuon),
      });
    }
    if (tk.soKhungTrong > 0) {
      batThuong.push({
        nhan: t('quay.chotNgay.khungTrong'),
        giaTri: String(tk.soKhungTrong),
      });
    }
  }

  return (
    <Card className="mx-auto max-w-lg space-y-4">
      <div>
        <h2 className="text-base font-bold text-ink">{t('quay.chotNgay.tieuDe')}</h2>
        <p className="mt-0.5 text-sm text-muted">
          {fmtDate(ngay)} · {locationName}
        </p>
      </div>

      {daChot ? (
        <div className="flex items-start gap-2 rounded-control bg-pill-ok-bg px-3 py-2 text-sm text-pill-ok-fg">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">
              {t('quay.chotNgay.daChotBoi', {
                nguoi: daChot.nguoiChotTen,
                luc: fmtDateTime(daChot.chotLuc),
              })}
            </div>
            {daChot.ghiChu ? <div className="mt-0.5">{daChot.ghiChu}</div> : null}
          </div>
        </div>
      ) : null}

      {tk === null ? (
        <p className="text-sm text-muted">{t('quay.chotNgay.khongCoCa')}</p>
      ) : (
        <>
          <div className="divide-y divide-line">
            <Hang nhan={t('quay.chotNgay.soCa')} giaTri={String(tk.soCa)} />
            <Hang nhan={t('quay.chotNgay.tienMatDauNgay')} giaTri={money(tk.tienMatDauNgay)} />
            <Hang nhan={t('quay.tienMatBanDuoc')} giaTri={money(tk.tienMat)} />
            <Hang nhan={t('quay.chuyenKhoanKhongVaoKet')} giaTri={money(tk.chuyenKhoan)} />
            <Hang nhan={t('quay.theKhongVaoKet')} giaTri={money(tk.the)} />
            <Hang nhan={t('quay.tongDoanhThu')} giaTri={money(tk.tongDoanhThu)} manh />
            <Hang nhan={t('quay.soGiaoDich')} giaTri={String(tk.soGiaoDich)} />
          </div>

          <div className="space-y-1 rounded-control bg-brand-tint p-3">
            <Hang
              nhan={t('quay.chotNgay.tienMatCuoiNgayKyVong')}
              giaTri={money(tk.tienMatCuoiNgayKyVong)}
              manh
            />
            <Hang
              nhan={t('quay.chotNgay.tienMatCuoiNgayThucTe')}
              giaTri={
                tk.tienMatCuoiNgayThucTe === null
                  ? t('quay.giamSat.chuaDem')
                  : money(tk.tienMatCuoiNgayThucTe)
              }
            />
            {tk.lechCuoiNgay === null ? null : (
              <div
                className={cn(
                  'mt-1 flex items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold',
                  tk.lechCuoiNgay === 0
                    ? 'bg-pill-ok-bg text-pill-ok-fg'
                    : 'bg-pill-bad-bg text-pill-bad-fg',
                )}
              >
                {tk.lechCuoiNgay === 0 ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                {tk.lechCuoiNgay === 0
                  ? t('quay.khopKet')
                  : t(tk.lechCuoiNgay > 0 ? 'quay.thua' : 'quay.thieu', {
                      soTien: money(Math.abs(tk.lechCuoiNgay)),
                    })}
              </div>
            )}
          </div>

          {batThuong.length > 0 ? (
            <div className="space-y-1 rounded-control border border-warn/40 bg-pill-warn-bg/30 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-warn">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t('quay.chotNgay.canGiaiTrinh')}
              </div>
              {batThuong.map((d) => (
                <Hang key={d.nhan} nhan={d.nhan} giaTri={d.giaTri} tone="bad" />
              ))}
            </div>
          ) : null}
        </>
      )}

      {daChot ? null : (
        <>
          <div>
            <label htmlFor={`${uid}-gc`} className="text-sm font-medium text-ink">
              {t('chung.ghiChu')}
            </label>
            <textarea
              id={`${uid}-gc`}
              className="field mt-1 min-h-16"
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder={t('quay.chotNgay.viDuGhiChu')}
            />
          </div>

          {/* `lyDo` là KHOÁ i18n do hàm thuần trả về. */}
          {lyDo ? (
            <p className="flex items-center gap-1.5 text-xs text-warn">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {t(lyDo)}
            </p>
          ) : (
            <p className="text-xs text-muted">{t('quay.chotNgay.chotXongLaKhoa')}</p>
          )}

          <Button
            className="w-full"
            disabled={lyDo !== null || submitting}
            onClick={() => onChotNgay(ghiChu.trim())}
          >
            {submitting ? t('quay.chotNgay.dangChot') : t('quay.chotNgay.nut')}
          </Button>
        </>
      )}

      {chuoi && chuoi.matXich.length > 0 ? (
        <div className="space-y-1 border-t border-line pt-3">
          <div className="text-xs uppercase tracking-wide text-muted">
            {t('quay.chotNgay.cacCaTrongNgay')}
          </div>
          {chuoi.matXich.map((m) => (
            <div key={m.ca.id} className="flex items-center gap-2 text-xs">
              <span className="font-medium text-ink">{m.ca.maCa}</span>
              <span className="text-muted">
                {m.khung ? t(m.khung.nhanKhoa) : t('quay.giamSat.ngoaiKhung')}
                {' · '}
                {m.ca.moLuc.slice(11, 16)}–{m.ca.dongLuc?.slice(11, 16) ?? '…'}
                {' · '}
                {m.ca.thuNganTen}
              </span>
              {m.ca.trangThai === 'dang-mo' ? (
                <Pill tone="warn">{t('quay.trangThaiCa.dang-mo')}</Pill>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
