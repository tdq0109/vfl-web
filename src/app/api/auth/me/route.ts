import { NextResponse } from 'next/server';
import { dotnet } from '@/lib/server/dotnet';
import { relay } from '@/lib/server/http';
import { getAccessToken } from '@/lib/auth/session';

/* Hồ sơ người dùng của phiên hiện tại. `SessionProvider` (Bước 6) gọi lúc khởi
   động. 401 → chưa/hết đăng nhập; client sẽ thử refresh rồi gọi lại. */
export async function GET(): Promise<NextResponse> {
  const token = await getAccessToken();
  if (!token) return NextResponse.json(null, { status: 401 });

  const res = await dotnet('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return relay(res);
  return NextResponse.json(await res.json());
}
