import { Fragment } from 'react';
import { Check, Minus } from 'lucide-react';
import { Table, Td, Th } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { capabilitiesByGroup, roleHasCapability } from '@/lib/auth/capabilities';
import { ROLE_KHOA, ROLE_ORDER } from '@/lib/auth/permissions';

/* Bảng tra "vai trò nào làm được việc gì" — CHỈ ĐỌC.

   ⚠ Bảng suy ra từ `lib/auth/capabilities.ts`, là bản sao để đối chiếu. Quyền
   thật do backend .NET quyết; khi backend chốt danh sách, đồng bộ lại tệp đó. */
export function MaTranPhanQuyen() {
  const t = useT();
  const groups = capabilitiesByGroup();

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t('quyen.bangThamChieu')}</p>

      <Table>
        <thead>
          <tr>
            <Th className="sticky left-0 bg-surface">{t('quyen.chucNang')}</Th>
            {ROLE_ORDER.map((r) => (
              <Th key={r} align="center" className="whitespace-nowrap">
                {t(ROLE_KHOA[r])}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <Fragment key={g.nhomKhoa}>
              <tr>
                <Td
                  colSpan={ROLE_ORDER.length + 1}
                  className="bg-brand-tint text-xs font-semibold uppercase tracking-wide text-brand-ink"
                >
                  {t(g.nhomKhoa)}
                </Td>
              </tr>
              {g.items.map((cap) => (
                <tr key={cap.id}>
                  <Td className="sticky left-0 bg-surface">{t(cap.nhanKhoa)}</Td>
                  {ROLE_ORDER.map((r) => (
                    <Td key={r} align="center">
                      {roleHasCapability(r, cap) ? (
                        <Check className="mx-auto h-4 w-4 text-ok" aria-label={t('quyen.coQuyen')} />
                      ) : (
                        <Minus
                          className="mx-auto h-4 w-4 text-line"
                          aria-label={t('quyen.khongCoQuyen')}
                        />
                      )}
                    </Td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
