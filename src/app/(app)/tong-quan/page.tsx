import { PageHeader } from '@/components/ui';
import { tTrenServer } from '@/lib/i18n/ngonNguServer';
import { TongQuanScreen } from '@/features/tong-quan';

/* Server component mỏng — toàn bộ tương tác nằm trong <TongQuanScreen> (client). */
export default async function Page() {
  const t = await tTrenServer();

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title={t('nav.tongQuan')}
        description={t('trang.tongQuanMoTa')}
      />
      <TongQuanScreen />
    </div>
  );
}
