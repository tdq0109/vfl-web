import { type NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/cookies';

/* Chặn trước khi React chạy, để đỡ chớp màn hình. Bảo mật thật nằm ở backend.

   Next 16 đổi tên quy ước: middleware.ts + middleware() thành proxy.ts +
   proxy().

   Phải xét cả hai cookie chứ không chỉ refresh. Bản đầu chỉ xét refresh trong
   khi (app)/layout lại cần access token, nên sau 15 phút không thao tác thì
   middleware cho vào /tong-quan, layout đá về /dang-nhap, middleware đá về / —
   lặp vô tận. Ba trạng thái tách bạch để không tái diễn:

     có access       → vào thẳng
     chỉ có refresh  → sang /api/auth/lam-moi lấy access mới rồi quay lại
     không có gì     → /dang-nhap */

const PUBLIC_PATHS = ['/dang-nhap'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const hasAccess = req.cookies.has(ACCESS_COOKIE);
  const hasRefresh = req.cookies.has(REFRESH_COOKIE);

  if (isPublic(pathname)) {
    // Chỉ đá người đã đăng nhập ra khỏi trang đăng nhập khi phiên còn hiệu
    // lực. Xét theo access token, nếu không sẽ lặp vòng với layout.
    if (hasAccess) {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (hasAccess) return NextResponse.next();

  if (hasRefresh) {
    const url = req.nextUrl.clone();
    url.pathname = '/api/auth/lam-moi';
    url.search = '';
    url.searchParams.set('tu', `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  const url = req.nextUrl.clone();
  url.pathname = '/dang-nhap';
  url.search = '';
  if (pathname !== '/') url.searchParams.set('tu', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Bỏ qua route API (tự lo auth), tài nguyên tĩnh của Next, và favicon.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
