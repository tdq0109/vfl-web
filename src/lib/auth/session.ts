import 'server-only';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './cookies';

/* Phiên đăng nhập nằm trong cookie httpOnly — JavaScript trình duyệt không
   chạm được token. Chỉ route handler trong app/api/ gọi các hàm này.

   setSession và clearSession chỉ chạy được trong Route Handler hoặc Server
   Action (nơi cookies() cho ghi); các hàm get* đọc được ở mọi server context.

   Từ Next 15, cookies() trả về Promise nên cả bốn hàm ở đây đều async. Quên
   await thì TypeScript bắt được ngay, nhưng viết JS thuần thì lỗi sẽ im lặng —
   đây là một lý do dự án bật strict. */

const DEFAULT_ACCESS_TTL = 60 * 15; // 15 phút
const DEFAULT_REFRESH_TTL = 60 * 60 * 24 * 30; // 30 ngày

interface SessionInput {
  accessToken: string;
  refreshToken: string;
  accessTtl?: number;
  refreshTtl?: number;
}

function baseCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

export async function setSession({
  accessToken,
  refreshToken,
  accessTtl = DEFAULT_ACCESS_TTL,
  refreshTtl = DEFAULT_REFRESH_TTL,
}: SessionInput): Promise<void> {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, accessToken, { ...baseCookie(), maxAge: accessTtl });
  jar.set(REFRESH_COOKIE, refreshToken, { ...baseCookie(), maxAge: refreshTtl });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}
