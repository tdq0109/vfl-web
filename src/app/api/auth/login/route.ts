import { NextResponse } from 'next/server';
import { dotnet } from '@/lib/server/dotnet';
import { relay } from '@/lib/server/http';
import { setSession } from '@/lib/auth/session';
import type { DotnetAuthResponse } from '@/lib/auth/types';

/* .NET xác thực → Next đặt cookie httpOnly → chỉ trả hồ sơ user về trình duyệt.
   Token không bao giờ rời khỏi tầng server. */
export async function POST(req: Request): Promise<NextResponse> {
  const res = await dotnet('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: await req.text(),
  });

  if (!res.ok) return relay(res);

  const data = (await res.json()) as DotnetAuthResponse;
  await setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessTtl: data.expiresIn,
    refreshTtl: data.refreshExpiresIn,
  });

  return NextResponse.json(data.user);
}
