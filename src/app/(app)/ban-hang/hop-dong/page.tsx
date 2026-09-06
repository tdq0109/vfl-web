import { PageHeader } from '@/components/ui';
import { tTrenServer } from '@/lib/i18n/ngonNguServer';
import { HopDongScreen } from '@/features/hop-dong';

/* Server component mỏng — toàn bộ tương tác nằm trong <HopDongScreen> (client). */
export default async function Page() {
  const t = await tTrenServer();

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title={t('nav.hopDong')}
        description={t('trang.hopDongMoTa')}
      />
      <HopDongScreen />
    </div>
  );
}
