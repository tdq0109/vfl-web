'use client';

import { useId } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button, Card, FormField } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { KhoiChuyenKhoan } from '@/packages/vietqr';
import { money } from '@/lib/format';
import type { TaiKhoanNhanTien } from '@/lib/api/types';
import { soMon, thanhTien, tongGioHang } from '../quay';
import {
  PHUONG_THUC_KHOA,
  PHUONG_THUC_ORDER,
  type DongHang,
  type PhuongThuc,
} from '../types';

/* Giỏ hàng + thu tiền. Khách vãng lai không bắt buộc để lại thông tin — quầy
   đông thì hỏi tên là mất thời gian, chỉ ghi khi khách tự đưa. */
interface Props {
  gio: DongHang[];
  phuongThuc: PhuongThuc;
  /** Tài khoản của CLB đang mở ca — tra theo `ca.locationId`, xem
      `taiKhoanNhanTienCua()`. Thiếu thì khối chuyển khoản tự nói lý do. */
  taiKhoanNhanTien?: TaiKhoanNhanTien;
  /** Nội dung chuyển khoản gợi ý — mã ca, để kế toán đối chiếu theo ca. */
  noiDungChuyenKhoan?: string;
  khachTen: string;
  khachSdt: string;
  lyDoKhongBan: string | null;
  submitting?: boolean;
  fieldErrors?: Record<string, string>;
  onDoiSoLuong: (sanPhamId: string, soLuong: number) => void;
  onDoiPhuongThuc: (pt: PhuongThuc) => void;
  onDoiKhachTen: (v: string) => void;
  onDoiKhachSdt: (v: string) => void;
  onXoaGio: () => void;
  onThuTien: () => void;
}

export function GioHang({
  gio,
  phuongThuc,
  taiKhoanNhanTien,
  noiDungChuyenKhoan,
  khachTen,
  khachSdt,
  lyDoKhongBan,
  submitting,
  fieldErrors = {},
  onDoiSoLuong,
  onDoiPhuongThuc,
  onDoiKhachTen,
  onDoiKhachSdt,
  onXoaGio,
  onThuTien,
}: Props) {
  const t = useT();
  const uid = useId();
  const tong = tongGioHang(gio);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted">
          {t('quay.gioHangSo', { so: soMon(gio) })}
        </h2>
        {gio.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={onXoaGio}>
            <Trash2 className="h-4 w-4" />
            {t('quay.xoaGio')}
          </Button>
        ) : null}
      </div>

      {gio.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t('quay.bamVaoMatHang')}</p>
      ) : (
        <ul className="divide-y divide-line">
          {gio.map((d) => (
            <li key={d.sanPhamId} className="flex items-center gap-2 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{d.ten}</p>
                <p className="text-xs tabular-nums text-muted">{money(d.donGia)}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t('quay.botMon', { ten: d.ten })}
                  onClick={() => onDoiSoLuong(d.sanPhamId, d.soLuong - 1)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums text-ink">
                  {d.soLuong}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t('quay.themMon', { ten: d.ten })}
                  onClick={() => onDoiSoLuong(d.sanPhamId, d.soLuong + 1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
                {money(thanhTien(d))}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <span className="text-sm text-muted">{t('quay.tongTien')}</span>
        <span className="text-xl font-bold tabular-nums text-brand-ink">{money(tong)}</span>
      </div>

      <FormField label={t('quay.phuongThucThanhToan')} htmlFor={`${uid}-pt`} required>
        <div className="flex gap-1">
          {PHUONG_THUC_ORDER.map((pt) => (
            <Button
              key={pt}
              type="button"
              size="sm"
              variant={phuongThuc === pt ? 'primary' : 'ghost'}
              className="flex-1"
              onClick={() => onDoiPhuongThuc(pt)}
            >
              {t(PHUONG_THUC_KHOA[pt])}
            </Button>
          ))}
        </div>
      </FormField>

      {/* Chỉ hiện khi thu bằng chuyển khoản. Mã mang đúng tổng giỏ hàng, nên
          thêm bớt món là mã đổi theo.

          Nội dung chuyển khoản ở quầy là mã ca chứ không phải mã giao dịch:
          tiền về trước khi giao dịch được ghi, nên lúc dựng mã chưa có mã giao
          dịch nào tồn tại. Kế toán đối chiếu theo ca — đúng cách phiếu đối soát cuối
          ca đang làm, nơi tiền chuyển khoản vốn đã tách riêng khỏi tiền mặt. */}
      {phuongThuc === 'chuyen-khoan' ? (
        <KhoiChuyenKhoan
          taiKhoan={taiKhoanNhanTien}
          soTien={tong > 0 ? tong : undefined}
          noiDung={noiDungChuyenKhoan}
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('quay.tenKhach')} htmlFor={`${uid}-ten`} error={fieldErrors.khachTen}>
          <input
            id={`${uid}-ten`}
            className="field"
            placeholder={t('quay.khongBatBuoc')}
            value={khachTen}
            onChange={(e) => onDoiKhachTen(e.target.value)}
          />
        </FormField>
        <FormField label={t('chung.dienThoai')} htmlFor={`${uid}-sdt`} error={fieldErrors.khachSdt}>
          <input
            id={`${uid}-sdt`}
            className="field"
            inputMode="tel"
            placeholder={t('quay.khongBatBuoc')}
            value={khachSdt}
            onChange={(e) => onDoiKhachSdt(e.target.value)}
          />
        </FormField>
      </div>

      {/* `lyDoKhongBan` là KHOÁ i18n do `viSaoKhongBanDuoc()` trả về. */}
      {lyDoKhongBan ? <p className="text-xs text-warn">{t(lyDoKhongBan)}</p> : null}

      <Button
        className="w-full"
        disabled={lyDoKhongBan !== null || submitting}
        onClick={onThuTien}
      >
        {submitting ? t('quay.dangThu') : t('quay.thuSoTien', { soTien: money(tong) })}
      </Button>
    </Card>
  );
}
