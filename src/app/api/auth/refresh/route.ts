import { NextResponse } from 'next/server';
import { dotnet } from '@/lib/server/dotnet';
import { relay } from '@/lib/server/http';
import { clearSession, getRefreshToken, setSession } from '@/lib/auth/session';
import type { DotnetAuthResponse } from '@/lib/auth/types';
import { tTrenServer } from '@/lib/i18n/ngonNguServer';

/* Đổi refresh token lấy cặp token mới. `lib/api/client.ts` gọi endpoint này khi
   gặp 401, và gộp mọi lần gọi trùng nhau thành một. */
export async function POST(): Promise<NextResponse> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    /* Route handler chạy trong ngữ cảnh request nên đọc được cookie ngôn ngữ.
       `client.ts` đưa thẳng `title` này lên màn qua `ApiError`, nên nó là chữ
       cho NGƯỜI DÙNG đọc — phải dịch. */
    const t = await tTrenServer();
    return NextResponse.json({ title: t('loi.phienKetThuc') }, { status: 401 });
  }

  const res = await dotnet('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await clearSession();
    return relay(res);
  }

  const data = (await res.json()) as DotnetAuthResponse;
  await setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessTtl: data.expiresIn,
    refreshTtl: data.refreshExpiresIn,
  });
  return NextResponse.json({ ok: true });
}
