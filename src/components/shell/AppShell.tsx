'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/components/auth/SessionProvider';
import { cn } from '@/lib/utils';
import { useT } from './NgonNguProvider';
import { Topbar } from './Topbar';
import { visibleNav } from './navigation';

export function AppShell({ children }: { children: ReactNode }) {
  const user = useSession();
  const pathname = usePathname();
  const t = useT();
  const nav = visibleNav(user);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="px-4 py-3 text-sm font-bold text-brand-ink">{t('app.name')}</div>
        <nav className="space-y-0.5 px-2 pb-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-control px-3 py-2 text-sm',
                isActive(item.href)
                  ? 'bg-brand-soft font-semibold text-brand-ink'
                  : 'text-ink hover:bg-brand-tint',
              )}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        {/* Điều hướng gọn cho màn hẹp */}
        <nav className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-2 py-1.5 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'whitespace-nowrap rounded-control px-3 py-1.5 text-sm',
                isActive(item.href)
                  ? 'bg-brand-soft font-semibold text-brand-ink'
                  : 'text-muted',
              )}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
