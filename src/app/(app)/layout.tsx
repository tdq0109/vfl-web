import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { AppShell } from '@/components/shell/AppShell';
import { LocationProvider } from '@/components/shell/LocationProvider';
import { getSessionUser } from '@/lib/auth/server';

/* Layout của khu đã đăng nhập: đọc phiên ở server để khung không chớp "đang
   tải". Middleware đã chặn từ trước, đây là lớp thứ hai.

   Nếu .NET vẫn từ chối thì phiên hỏng thật, phải xoá cookie rồi mới về trang
   đăng nhập, không thì middleware lại thấy cookie và đá ngược lại. Server
   component không đặt được cookie nên nhờ /api/auth/thoat. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/api/auth/thoat');

  return (
    <SessionProvider initialUser={user}>
      <LocationProvider options={user.locations} allowAll={user.allLocations}>
        <AppShell>{children}</AppShell>
      </LocationProvider>
    </SessionProvider>
  );
}
