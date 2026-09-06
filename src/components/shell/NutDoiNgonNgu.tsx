'use client';

import { Button } from '@/components/ui';
import { ngonNguKia } from '@/lib/i18n/ngonNgu';
import { useNgonNgu } from './NgonNguProvider';

/* Nút lật ngôn ngữ, thay cho `langBtn` của hệ cũ (`commercial-console.html`
   ~294–298).

   ⚠ Nút hiện ngôn ngữ SẼ CHUYỂN SANG, không phải ngôn ngữ đang dùng — đang ở
   tiếng Việt thì nút ghi "EN". Hệ cũ cũng làm vậy và đó là cách đúng: nút là
   một hành động, nhãn nói nó sẽ làm gì. Ghi ngôn ngữ hiện tại thì người dùng
   bấm vào tưởng để xác nhận.

   Nhãn phụ cho trình đọc màn hình nói rõ cả hai vế, vì hai chữ "EN" đứng một
   mình thì không đủ nghĩa. */

/* Tên ngôn ngữ đích, tra bằng KHOÁ chứ không phải chữ sẵn: người đang dùng bản
   tiếng Anh phải nghe "Switch to Vietnamese", không phải "Chuyển sang Tiếng
   Việt". Mã lạ (không có trong bảng) thì rơi về chính mã đó, y như trước. */
const KHOA_TEN: Record<string, string> = { vi: 'nen.ngonNguVi', en: 'nen.ngonNguEn' };

export function NutDoiNgonNgu() {
  const { ngonNgu, doiNgonNgu, t } = useNgonNgu();
  const kia = ngonNguKia(ngonNgu);
  const ten = KHOA_TEN[kia] ? t(KHOA_TEN[kia]) : kia;

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={t('nen.chuyenNgonNgu', { ten })}
      onClick={() => doiNgonNgu(kia)}
    >
      {kia.toUpperCase()}
    </Button>
  );
}
