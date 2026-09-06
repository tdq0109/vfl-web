import { PageHeader } from '@/components/ui';
import { tTrenServer } from '@/lib/i18n/ngonNguServer';
import { GiamSatCaScreen } from '@/features/ban-hang-quay';

/* Server component mỏng — mọi tương tác nằm trong <GiamSatCaScreen> (client). */
export default async function Page() {
  const t = await tTrenServer();

  return (
    <div className="space-y-4 p-6">
      <PageHeader title={t('nav.giamSatCa')} description={t('trang.giamSatCaMoTa')} />
      <GiamSatCaScreen />
    </div>
  );
}
