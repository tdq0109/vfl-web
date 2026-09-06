'use client';

import type { ReactNode } from 'react';
import { canActInLocation, hasMinRole, type Role } from '@/lib/auth/permissions';
import { useSession } from './SessionProvider';

/* Cổng quyền khai báo, chỉ để ẩn/hiện — backend vẫn tự kiểm tra mọi thao tác.

   <Can minRole="manager">…</Can> · <Can inLocation={clbId}>…</Can> */
interface CanProps {
  minRole?: Role;
  inLocation?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ minRole, inLocation, children, fallback = null }: CanProps) {
  const user = useSession();
  const allowed =
    (minRole === undefined || hasMinRole(user, minRole)) &&
    (inLocation === undefined || canActInLocation(user, inLocation));
  return <>{allowed ? children : fallback}</>;
}
