import { type NextRequest, NextResponse } from 'next/server';
import { dotnet } from '@/lib/server/dotnet';
import { clearSession, getRefreshToken, setSession } from '@/lib/auth/session';
import type { DotnetAuthResponse } from '@/lib/auth/types';
import { internalPath } from '@/lib/auth/paths';

/* Làm mới phiên rồi quay lại trang người dùng đang muốn vào.

   Cần route GET riêng (ngoài /auth/refresh dạng POST) vì đây là điều hướng
   trình duyệt: server component không đặt được cookie, nên khi access token hết
   hạn thì middleware đá sang đây, route handler làm mới cookie rồi 307 về chỗ
   cũ.

   Luôn kết thúc: hoặc đặt được access token mới, hoặc xoá sạch phiên và về
   /dang-nhap. Không có nhánh nào quay lại chính nó. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const back = internalPath(req.nextUrl.searchParams.get('tu'));
  const refreshToken = await getRefreshToken();

  const toLogin = async () => {
    await clearSession();
    return NextResponse.redirect(new URL('/dang-nhap', req.nextUrl.origin));
  };

  if (!refreshToken) return await toLogin();

  let data: DotnetAuthResponse;
  try {
    const res = await dotnet('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return await toLogin();
    data = (await res.json()) as DotnetAuthResponse;
  } catch {
    return await toLogin();
  }

  await setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessTtl: data.expiresIn,
    refreshTtl: data.refreshExpiresIn,
  });

  return NextResponse.redirect(new URL(back, req.nextUrl.origin));
}
