import { money } from '@/lib/format';
import type { ThamSo } from '@/lib/i18n';
import type { LyDoChan } from './types';

/* Ghép một LyDoChan thành câu cho người đọc. Nhận t làm tham số thay vì tự
   import, nhờ vậy vẫn là hàm thuần: gọi t() ở module scope thì chuỗi đóng băng
   theo ngôn ngữ lúc nạp tệp, còn để màn tự ghép thì logic phân nhánh bị chép ra
   nhiều chỗ. */

export type Dich = (khoa: string, thamSo?: ThamSo) => string;

/** Các tham số mang khoá chứ không mang chữ, phải dịch lồng một lớp nữa. Liệt
    kê ra đây thay vì đoán "tham số nào trông giống khoá thì dịch" — đoán thì
    một ngày nào đó tên hội viên là "hopDong.abc" và nó bị dịch mất. */
const THAM_SO_LA_KHOA: Record<string, readonly string[]> = {
  'hopDong.chan.khongChuyenThang': ['tu', 'den'],
  'hopDong.chan.canVaiTro': ['vaiTro'],
};

/** Câu giải thích đầy đủ cho một lý do chặn. */
export function lyDoThanhChu(t: Dich, ly: LyDoChan): string {
  const thamSo: ThamSo = { ...ly.thamSo };

  const canDich = THAM_SO_LA_KHOA[ly.khoa];
  if (canDich) {
    for (const ten of canDich) {
      const gia = thamSo[ten];
      if (typeof gia === 'string') thamSo[ten] = t(gia);
    }
  }

  /* Lý do dưới giá sàn kèm danh sách dòng; mỗi dòng là một câu con có khoá
     riêng, nối bằng " · ". */
  if (ly.dongViPham && ly.dongViPham.length > 0) {
    thamSo.chiTiet = ly.dongViPham
      .map((d) =>
        t('hopDong.dongDuoiSan', {
          ten: d.ten,
          gia: money(d.donGia),
          giaSan: money(d.giaSan),
        }),
      )
      .join(' · ');
  }

  return t(ly.khoa, thamSo);
}
