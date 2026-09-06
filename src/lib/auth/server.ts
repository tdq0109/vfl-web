import 'server-only';
import { dotnet } from '@/lib/server/dotnet';
import { getAccessToken } from './session';
import type { UserProfile } from './types';

/* Đọc hồ sơ người dùng ở server component (layout của khu (app)) để dựng khung
   không bị chớp trạng thái "đang tải". Trả null nếu chưa/hết đăng nhập —
   layout sẽ redirect. */
export async function getSessionUser(): Promise<UserProfile | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await dotnet('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok ? ((await res.json()) as UserProfile) : null;
  } catch {
    return null;
  }
}
