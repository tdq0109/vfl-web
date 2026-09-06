'use client';

import { useId, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button, Card, FormField, MoneyInput } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { fmtDateTime, money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { chenhLech, loaiChenhLech, moTaChenhLech, tomTatCa, viSaoKhongDongDuocCa } from '../quay';
import { khungKeTiep, viSaoKhongChuyenDuocCa } from '../chuyenCa';
import { khungCuaThoiDiem, type KhungCa } from '../khungCa';
import type { CaThuNgan } from '../types';

/* Phiếu đối soát cuối ca.

   Tách rõ ba khối để thu ngân đọc được mà không cần giải thích: doanh thu theo
   từng phương thức (chuyển khoản và thẻ không vào két), tiền mặt kỳ vọng bằng
   đầu ca cộng tiền mặt bán được, rồi đếm thực tế ra chênh lệch.

   Lệch thì vẫn cho đóng ca — bắt khớp tuyệt đối sẽ khiến thu ngân bù tiền túi
   cho lệch vài nghìn thay vì báo cáo. Nhưng lệch thì bắt buộc ghi lý do. */

interface Props {
  ca: CaThuNgan;
  /** Khung ca chuẩn của CLB — để biết còn ca nào phía sau mà chuyển sang. */
  khung: readonly KhungCa[];
  fieldErrors?: Record<string, string>;
  submitting?: boolean;
  submittingChuyen?: boolean;
  onDongCa: (tienDem: number, ghiChu: string) => void;
  /** Bỏ trống thì không hiện nút Chuyển ca (ví dụ CLB chỉ chạy một ca). */
  onChuyenCa?: (tienDem: number, ghiChu: string) => void;
}

function Dong({
  label,
  value,
  manh,
}: {
  label: string;
  value: string;
  manh?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className={cn('tabular-nums', manh ? 'font-bold text-ink' : 'text-ink')}>{value}</span>
    </div>
  );
}

export function DoiSoatCa({
  ca,
  khung,
  fieldErrors = {},
  submitting,
  submittingChuyen,
  onDongCa,
  onChuyenCa,
}: Props) {
  const t = useT();
  const uid = useId();
  const [tienDem, setTienDem] = useState<number | null>(null);
  const [ghiChu, setGhiChu] = useState('');

  /* Bản tóm tắt không đặt tên t nữa — t nay là hàm dịch của useT(). */
  const tt = tomTatCa(ca);
  const lech = tienDem === null ? 0 : chenhLech(tienDem, tt.tienMatKyVong);
  const loai = loaiChenhLech(lech);
  const daDem = tienDem !== null;

  /* Luật "lệch thì bắt buộc ghi lý do" nay nằm trong hàm thuần, không tính
     lại ở đây: trước kia màn tự giữ luật nên gọi thẳng API là lách được, mà màn
     Giám sát ca lại dựa vào chính dữ liệu ấy. Xem quay.ts. */
  const lyDo = viSaoKhongDongDuocCa(ca, tienDem, ghiChu);
  const thieuLyDo = lyDo === 'quay.lechThiGhiLyDo';
  const chanDong = lyDo !== null;

  /* Chuyển ca: chốt ca này rồi mở ngay ca kế tiếp, tiền bàn giao chính là số
     vừa đếm. Chỉ hiện khi trong ngày còn ca phía sau; ca cuối ngày đi đường
     Chốt ngày, xem ChotNgayPanel. */
  const keTiep = khungKeTiep(khungCuaThoiDiem(ca.moLuc, khung), khung);
  const lyDoKhongChuyen = viSaoKhongChuyenDuocCa(ca, tienDem, ghiChu, khung);
  const hienNutChuyen = onChuyenCa !== undefined && keTiep !== null;

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-ink">{t('quay.doiSoatCuoiCa')}</h2>
        <p className="mt-0.5 text-sm text-muted">
          {t('quay.caLa', { maCa: ca.maCa })} · {t('quay.moLuc', { luc: fmtDateTime(ca.moLuc) })}
        </p>
      </div>

      <div className="divide-y divide-line">
        <Dong label={t('quay.tienDauCa')} value={money(tt.tienDauCa)} />
        <Dong label={t('quay.tienMatBanDuoc')} value={money(tt.tienMat)} />
        <Dong label={t('quay.chuyenKhoanKhongVaoKet')} value={money(tt.chuyenKhoan)} />
        <Dong label={t('quay.theKhongVaoKet')} value={money(tt.the)} />
        <Dong label={t('quay.tongDoanhThu')} value={money(tt.tongDoanhThu)} />
        <Dong
          label={t('quay.soGiaoDich')}
          value={
            tt.soGiaoDichHuy > 0
              ? t('quay.soGiaoDichCoHuy', { so: tt.soGiaoDich, soHuy: tt.soGiaoDichHuy })
              : String(tt.soGiaoDich)
          }
        />
      </div>

      <div className="rounded-control bg-brand-tint p-3">
        <Dong label={t('quay.tienMatPhaiCoTrongKet')} value={money(tt.tienMatKyVong)} manh />
      </div>

      <FormField
        label={t('quay.tienMatDemDuoc')}
        htmlFor={`${uid}-dem`}
        error={fieldErrors.tienDemCuoiCa}
        hint={t('quay.demToanBoTien')}
        required
      >
        <MoneyInput
          id={`${uid}-dem`}
          value={tienDem}
          onValueChange={setTienDem}
          placeholder="0"
        />
      </FormField>

      {daDem ? (
        <div
          className={cn(
            'flex items-start gap-2 rounded-control px-3 py-2 text-sm',
            loai === 'khop'
              ? 'bg-pill-ok-bg text-pill-ok-fg'
              : loai === 'thua'
                ? 'bg-pill-warn-bg text-pill-warn-fg'
                : 'bg-pill-bad-bg text-pill-bad-fg',
          )}
        >
          {loai === 'khop' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {/* `moTaChenhLech` trả KHOÁ; số tiền do màn truyền vào. */}
          <span className="font-semibold">
            {t(moTaChenhLech(lech), { soTien: money(Math.abs(lech)) })}
          </span>
        </div>
      ) : null}

      <FormField
        label={t('chung.ghiChu')}
        htmlFor={`${uid}-gc`}
        error={thieuLyDo ? t('quay.lechThiGhiLyDo') : undefined}
        hint={daDem && loai !== 'khop' ? undefined : t('quay.khongBatBuocKhiKhop')}
        required={daDem && loai !== 'khop'}
      >
        <textarea
          id={`${uid}-gc`}
          className="field min-h-16"
          value={ghiChu}
          onChange={(e) => setGhiChu(e.target.value)}
        />
      </FormField>

      {/* `lyDo` là KHOÁ i18n do `viSaoKhongDongDuocCa()` trả về. Riêng ca thiếu
          lý do thì đã hiện ngay dưới ô ghi chú, không lặp lại ở đây. */}
      {lyDo && !thieuLyDo ? <p className="text-xs text-warn">{t(lyDo)}</p> : null}

      {hienNutChuyen ? (
        <>
          <Button
            className="w-full"
            disabled={lyDoKhongChuyen !== null || submittingChuyen || submitting}
            onClick={() => {
              if (tienDem !== null) onChuyenCa?.(tienDem, ghiChu.trim());
            }}
          >
            {submittingChuyen
              ? t('quay.chuyenCa.dangChuyen')
              : t('quay.chuyenCa.nut', { ca: t(keTiep.nhanKhoa) })}
          </Button>
          {/* Nói TRƯỚC khi bấm chứ không phải sau: số vừa đếm sẽ thành tiền đầu
              ca sau, không ai gõ lại được. Đó là điểm mấu chốt của cơ chế này. */}
          <p className="-mt-2 text-xs text-muted">
            {t('quay.chuyenCa.giaiThich', {
              ca: t(keTiep.nhanKhoa),
              soTien: daDem ? money(tienDem ?? 0) : '—',
            })}
          </p>
        </>
      ) : null}

      <Button
        variant={hienNutChuyen ? 'ghost' : 'danger'}
        className="w-full"
        disabled={chanDong || submitting || submittingChuyen}
        onClick={() => {
          if (tienDem !== null) onDongCa(tienDem, ghiChu.trim());
        }}
      >
        {submitting ? t('quay.dangDongCa') : t('quay.dongCa')}
      </Button>
      {hienNutChuyen ? (
        <p className="-mt-2 text-xs text-muted">{t('quay.chuyenCa.dongCaLaKhongAiNhan')}</p>
      ) : null}
    </Card>
  );
}
