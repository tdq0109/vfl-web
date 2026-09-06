import { NextResponse } from 'next/server';
import { dotnet } from '@/lib/server/dotnet';
import { clearSession, getRefreshToken } from '@/lib/auth/session';

/* Báo .NET thu hồi refresh token rồi xoá cookie. Lỗi mạng khi gọi .NET không
   được chặn việc đăng xuất phía client. */
export async function POST(): Promise<NextResponse> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await dotnet('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
