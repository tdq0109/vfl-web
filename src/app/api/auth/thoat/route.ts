import { type NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth/session';

/* Xoá phiên rồi về trang đăng nhập. Dạng điều hướng, khác /auth/logout dạng
   POST của nút Đăng xuất; dùng khi tầng server phát hiện phiên hỏng mà không tự
   xoá cookie được. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  await clearSession();
  return NextResponse.redirect(new URL('/dang-nhap', req.nextUrl.origin));
}
