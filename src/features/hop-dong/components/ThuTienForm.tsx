'use client';

import { useId, useState } from 'react';
import { Button, FormField, MoneyInput } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import {
  PHUONG_THUC_KHOA,
  PHUONG_THUC_ORDER,
  type PhuongThuc,
} from '@/features/ban-hang-quay/types';
import { KhoiChuyenKhoan } from '@/packages/vietqr';
import { money } from '@/lib/format';
import type { TaiKhoanNhanTien } from '@/lib/api/types';
import { conPhaiThu, viSaoKhongThuDuoc } from '../hop-dong';
import { lyDoThanhChu } from '../lyDo';
import type { HopDong, ThanhToanInput } from '../types';

/* Ghi phiếu thu cho hợp đồng.

   Mặc định điền đúng phần CÒN PHẢI THU — trường hợp thường gặp nhất là thu một
   lần đủ. Thu từng phần vẫn gõ được, nhưng thu THỪA thì chặn: thu thừa và trả
   góp là ngoại lệ của Bước 12b, cần bút toán riêng. */

interface Props {
  hopDong: HopDong;
  /** Tài khoản của CLB BÁN hợp đồng này — KHÔNG phải CLB đang chọn trên thanh
      trên. Người có cờ toàn hệ thống mở hợp đồng của CLB khác là hai thứ đó
      khác nhau, và tiền sẽ về nhầm CLB. Chỗ tra nằm ở `HopDongScreen`. */
  taiKhoanNhanTien?: TaiKhoanNhanTien;
  fieldErrors?: Record<string, string>;
  submitting?: boolean;
  onSubmit: (input: ThanhToanInput) => void;
}

export function ThuTienForm({
  hopDong,
  taiKhoanNhanTien,
  fieldErrors = {},
  submitting,
  onSubmit,
}: Props) {
  /* Xem ghi chú cùng loại ở `HopDongDetail`. */
  const t = useT();
  const uid = useId();
  const con = conPhaiThu(hopDong);
  const [soTien, setSoTien] = useState<number>(con);
  const [phuongThuc, setPhuongThuc] = useState<PhuongThuc>('tien-mat');
  const [ghiChu, setGhiChu] = useState('');

  const lyDo = viSaoKhongThuDuoc(hopDong, soTien);

  return (
    <div className="space-y-3 rounded-control border border-line p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">{t('hopDong.ghiPhieuThu')}</h3>
        <span className="text-sm text-muted">
          {t('hopDong.conPhaiThu')}{' '}
          <span className="font-bold tabular-nums text-bad">{money(con)}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <FormField
          label={t('chung.soTien')}
          htmlFor={`${uid}-tien`}
          error={fieldErrors.soTien}
          required
        >
          <MoneyInput
            id={`${uid}-tien`}
            value={soTien}
            onValueChange={setSoTien}
            placeholder="0"
          />
        </FormField>

        <FormField
          label={t('hopDong.phuongThuc')}
          htmlFor={`${uid}-pt`}
          error={fieldErrors.phuongThuc}
          required
        >
          <select
            id={`${uid}-pt`}
            className="field"
            value={phuongThuc}
            onChange={(e) => setPhuongThuc(e.target.value as PhuongThuc)}
          >
            {PHUONG_THUC_ORDER.map((p) => (
              <option key={p} value={p}>
                {t(PHUONG_THUC_KHOA[p])}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label={t('chung.ghiChu')} htmlFor={`${uid}-gc`} error={fieldErrors.ghiChu}>
        <input
          id={`${uid}-gc`}
          className="field"
          value={ghiChu}
          onChange={(e) => setGhiChu(e.target.value)}
          placeholder={t('hopDong.soPhieuMaGd')}
        />
      </FormField>

      {/* Chỉ hiện khi đang thu bằng chuyển khoản. Mã QR mang ĐÚNG số tiền đang
          gõ ở trên, nên sửa số là mã đổi theo — khách quét ra đúng số phải trả,
          không phải tự gõ. Số tiền không hợp lệ thì `KhoiChuyenKhoan` tự nói lý
          do thay vì vẽ một mã sai. */}
      {phuongThuc === 'chuyen-khoan' ? (
        <KhoiChuyenKhoan
          taiKhoan={taiKhoanNhanTien}
          soTien={soTien > 0 ? soTien : undefined}
          noiDung={hopDong.maHopDong}
        />
      ) : null}

      {/* `lyDo` là LÝ DO (khoá + tham số) do `viSaoKhongThuDuoc()` trả về. */}
      {lyDo ? <p className="text-xs text-warn">{lyDoThanhChu(t, lyDo)}</p> : null}

      <Button
        className="w-full"
        disabled={lyDo !== null || submitting}
        onClick={() => onSubmit({ soTien, phuongThuc, ghiChu: ghiChu.trim() || undefined })}
      >
        {submitting ? t('hopDong.dangGhi') : t('hopDong.ghiNhanSoTien', { soTien: money(soTien) })}
      </Button>
    </div>
  );
}
