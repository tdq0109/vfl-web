import { type NextRequest, NextResponse } from 'next/server';
import { dotnet } from '@/lib/server/dotnet';
import { clearSession, getRefreshToken, setSession } from '@/lib/auth/session';
import type { DotnetAuthResponse } from '@/lib/auth/types';
import { internalPath } from '@/lib/auth/paths';

/* Làm mới phiên rồi 307 về trang người dùng đang muốn vào.

   Phải là GET riêng chứ không dùng /auth/refresh dạng POST, vì đây là điều
   hướng trình duyệt và server component không đặt được cookie. Luôn kết thúc:
   hoặc có access token mới, hoặc xoá sạch phiên và về /dang-nhap. */
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
