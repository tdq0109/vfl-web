import { type NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth/session';

/* Xoá phiên rồi về trang đăng nhập — dạng ĐIỀU HƯỚNG (khác `/auth/logout` dạng
   POST dùng cho nút Đăng xuất).

   Dùng khi tầng server phát hiện phiên hỏng mà không tự xoá cookie được (server
   component không đặt được cookie). Sau khi chạy, trình duyệt không còn cookie
   nào nên `/dang-nhap` chắc chắn hiển thị — không thể lặp vòng. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  await clearSession();
  return NextResponse.redirect(new URL('/dang-nhap', req.nextUrl.origin));
}
