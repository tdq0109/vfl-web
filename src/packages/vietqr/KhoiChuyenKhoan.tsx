'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TaiKhoanNhanTien } from '@/lib/api/types';
import { MaQR } from './MaQR';
import { chuanHoaNoiDung, chuoiVietQR, tenNganHang, viSaoKhongTaoDuocQR } from './vietqr';

/* Khối "chuyển khoản vào đây": mã QR cộng thông tin gõ tay dự phòng.

   Luôn hiện cả số tài khoản bằng chữ chứ không chỉ mã QR — máy quét hỏng,
   camera mờ, ứng dụng của khách không quét được, quầy phải còn đường đọc số cho
   khách gõ.

   Nút sao chép chỉ cho nội dung chuyển khoản, ô khách hay gõ sai nhất. Số tiền
   và số tài khoản cố ý không có nút: hai thứ đó phải được nhìn thấy, không nên
   dán mù. */

interface Props {
  /** Thiếu = CLB chưa cấu hình tài khoản; khối này tự ẩn. */
  taiKhoan?: TaiKhoanNhanTien;
  /** Bỏ trống = mã tĩnh, khách tự nhập số tiền. */
  soTien?: number;
  /** Nội dung chuyển khoản, thường là mã hợp đồng. Tự bỏ dấu và viết hoa. */
  noiDung?: string;
  className?: string;
}

function Dong({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <span className="shrink-0 text-muted">{nhan}</span>
      <span className="text-right font-semibold text-ink">{giaTri}</span>
    </div>
  );
}

export function KhoiChuyenKhoan({ taiKhoan, soTien, noiDung, className }: Props) {
  const [daChep, setDaChep] = useState(false);
  const t = useT();

  if (!taiKhoan) {
    return (
      <p className={cn('text-xs text-warn', className)}>{t('vietqr.chuaCauHinh')}</p>
    );
  }

  const noiDungSach = noiDung ? chuanHoaNoiDung(noiDung) : '';
  const thongTin = {
    bin: taiKhoan.bin,
    soTaiKhoan: taiKhoan.soTaiKhoan,
    soTien,
    noiDung: noiDungSach || undefined,
  };

  /* Hỏi TRƯỚC khi dựng — `chuoiVietQR()` cố ý ném khi dữ liệu không dựng được. */
  const lyDo = viSaoKhongTaoDuocQR(thongTin);
  const chuoi = lyDo ? null : chuoiVietQR(thongTin);

  async function chep() {
    try {
      await navigator.clipboard.writeText(noiDungSach);
      setDaChep(true);
      window.setTimeout(() => setDaChep(false), 2000);
    } catch {
      /* Trình duyệt chặn clipboard (không phải HTTPS, hoặc chưa cấp quyền).
         Không báo lỗi ầm ĩ — nội dung vẫn đang hiện ngay bên cạnh để đọc. */
    }
  }

  return (
    <div className={cn('space-y-3 rounded-control border border-line p-3', className)}>
      <h4 className="text-sm font-bold text-ink">{t('vietqr.chuyenKhoan')}</h4>

      {chuoi ? (
        <div className="flex justify-center">
          <MaQR
            chuoi={chuoi}
            label={t('vietqr.nhanMaQR', {
              soTien: money(soTien),
              soTaiKhoan: taiKhoan.soTaiKhoan,
            })}
            className="h-44 w-44 rounded-control border border-line"
          />
        </div>
      ) : (
        <p className="text-xs text-warn">{t(lyDo ?? 'vietqr.loi.chuaDungDuoc')}</p>
      )}

      <div className="divide-y divide-line">
        <Dong nhan={t('vietqr.nganHang')} giaTri={tenNganHang(taiKhoan.bin)} />
        <Dong nhan={t('vietqr.soTaiKhoan')} giaTri={taiKhoan.soTaiKhoan} />
        <Dong nhan={t('vietqr.chuTaiKhoan')} giaTri={taiKhoan.tenChuTaiKhoan} />
        {soTien !== undefined ? <Dong nhan={t('chung.soTien')} giaTri={money(soTien)} /> : null}
      </div>

      {noiDungSach ? (
        <div className="flex items-center justify-between gap-2 rounded-control bg-brand-tint px-3 py-2">
          <div className="min-w-0">
            <div className="text-xs text-muted">{t('vietqr.noiDung')}</div>
            <div className="truncate font-semibold tabular-nums text-ink">{noiDungSach}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={chep}>
            {daChep ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {daChep ? t('vietqr.daChep') : t('vietqr.saoChep')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
