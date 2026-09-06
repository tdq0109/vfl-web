'use client';

import { useRef, useState } from 'react';
import { PenLine } from 'lucide-react';
import { Button } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { ChuKyPad, type ChuKyPadHandle } from '@/packages/signature-pad';
import { viSaoKhongLuuDuocChuKy } from '@/packages/signature-pad/chu-ky';
import type { HopDong } from '../types';

/* Bước ký — khung ký tay của hội viên (bên B).

   Trước khi có gói signature-pad, bước này chỉ ghi nhận trạng thái và ngày,
   quầy vẫn phải in ra ký giấy. Nay ký được trên màn.

   Ký trên màn là tuỳ chọn, không bắt buộc: ép chữ ký điện tử là quyết định vận
   hành và pháp lý chứ không phải quyết định của frontend, CLB nào còn dùng bản
   giấy vẫn phải đi tiếp được. Vì vậy CHUYEN_TIEP và viSaoKhongChuyenDuoc()
   không đổi, nút "Ký giấy" bên dưới đi đúng đường cũ. Khi vận hành chốt bắt
   buộc ký màn thì thêm điều kiện vào hop-dong.ts, đừng thêm if ở component này.

   Chữ ký bên A (đại diện CLB) hệ cũ lấy sẵn từ cấu hình thương hiệu và gắn lúc
   phát hành; phần cấu hình đó chưa port. */

interface Props {
  hopDong: HopDong;
  submitting?: boolean;
  onKy: (chuKy: string | null) => void;
}

export function KyHopDongForm({ hopDong, submitting, onKy }: Props) {
  const t = useT();
  const padRef = useRef<ChuKyPadHandle>(null);
  const [coChuKy, setCoChuKy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  function luuChuKy() {
    const anh = padRef.current?.layAnh() ?? null;
    /* Kiểm ngay trước khi gửi: `layAnh()` có thể trả null khi canvas bị nhiễm,
       và ảnh nạp từ tệp có thể lớn hơn mức cho phép. */
    const lyDo = viSaoKhongLuuDuocChuKy(anh);
    if (lyDo) {
      setLoi(t(lyDo.khoa, lyDo.thamSo));
      return;
    }
    setLoi(null);
    onKy(anh);
  }

  return (
    <div className="space-y-3 rounded-control border border-line p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">{t('hopDong.chuKyBenB')}</h3>
        <span className="text-sm text-muted">{hopDong.hoiVienTen}</span>
      </div>

      <ChuKyPad
        ref={padRef}
        label={t('hopDong.chuKyCua', { ten: hopDong.hoiVienTen })}
        disabled={submitting}
        onChange={(co) => {
          setCoChuKy(co);
          setLoi(null);
        }}
      />

      {/* `loi` là chữ ĐÃ DỊCH: `viSaoKhongLuuDuocChuKy()` là hàm thuần nên nó chỉ
          trả khoá kèm chỗ điền, dịch ở đây mới đúng ngôn ngữ đang chọn. */}
      {loi ? <p className="text-xs text-bad">{loi}</p> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" disabled={submitting} onClick={() => onKy(null)}>
          {t('hopDong.kyGiayChiGhiNhan')}
        </Button>
        <Button disabled={!coChuKy || submitting} onClick={luuChuKy}>
          <PenLine className="h-4 w-4" />
          {submitting ? t('state.dangLuu') : t('hopDong.luuChuKyVaGhiNhan')}
        </Button>
      </div>
    </div>
  );
}
