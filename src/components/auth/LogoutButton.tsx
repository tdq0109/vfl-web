'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { useDonPhienKhiDangXuat } from '@/lib/query/donPhien';

/* Gọi /api/auth/logout rồi về trang đăng nhập.

   Dọn kho trình duyệt và cache truy vấn trước lời gọi mạng: quầy dùng chung
   máy, mạng chậm là có một khoảng người sau đã ở trang đăng nhập mà CLB, ngôn
   ngữ và hồ sơ của người trước vẫn còn. Danh sách kho ở
   lib/storage/quenPhien.ts. */
export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const t = useT();
  const donPhien = useDonPhienKhiDangXuat();

  async function onClick() {
    setPending(true);
    /* Xoá ngôn ngữ làm màn lật về tiếng Việt ngay trước lúc chuyển trang.
       Đúng ý: trang đăng nhập là của người sau, và người sau chưa chọn gì. */
    donPhien();
    try {
      await api.post('/auth/logout');
    } catch {
      // kể cả lỗi mạng vẫn đưa người dùng ra ngoài
    }
    router.replace('/dang-nhap');
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={pending}>
      {pending ? t('state.dangThoat') : t('action.dangXuat')}
    </Button>
  );
}
