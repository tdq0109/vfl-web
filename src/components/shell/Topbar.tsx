'use client';

import { LogoutButton } from '@/components/auth/LogoutButton';
import { useSession } from '@/components/auth/SessionProvider';
import { initials } from '@/lib/format';
import { ALL_LOCATIONS, useLocationScope } from './LocationProvider';
import { useT } from './NgonNguProvider';
import { NutDoiNgonNgu } from './NutDoiNgonNgu';

export function Topbar() {
  const user = useSession();
  const { current, options, setCurrent } = useLocationScope();
  const t = useT();

  return (
    <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2">
      <select
        aria-label={t('chung.cauLacBo')}
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        className="field max-w-56"
      >
        {user.allLocations ? <option value={ALL_LOCATIONS}>{t('location.tatCa')}</option> : null}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand-ink">
            {initials(user.fullName)}
          </span>
          <span className="hidden text-sm text-ink sm:block">{user.fullName}</span>
        </div>
        <NutDoiNgonNgu />
        <LogoutButton />
      </div>
    </header>
  );
}
