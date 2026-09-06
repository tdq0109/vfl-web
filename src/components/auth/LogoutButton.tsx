'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { useDonPhienKhiDangXuat } from '@/lib/query/donPhien';

/* Gọi /api/auth/logout (Next xoá cookie, báo .NET thu hồi) rồi về trang đăng
   nhập.

   Dọn kho của trình duyệt trước, đừng để sau lời gọi mạng. Quầy dùng chung một
   máy: người trước đăng xuất rồi người sau đăng nhập ngay trên cùng tab, nên
   CLB đang chọn (sessionStorage) và ngôn ngữ (cookie) phải hết trước khi người
   sau nhìn thấy màn nào. Gọi sau await là mạng chậm hay hỏng thì có một khoảng
   người sau đã ở trang đăng nhập mà kho vẫn còn của người trước.

   Dọn cả cache truy vấn chứ không chỉ kho trình duyệt: QueryClient sống qua lần
   đổi tài khoản nên hồ sơ người trước ở lại trong cache và cả lớp ẩn nút chạy
   trên hồ sơ đó. Xem lib/query/donPhien.ts.

   Danh sách kho nằm ở lib/storage/quenPhien.ts, thêm kho mới thì nối vào đó. */
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
