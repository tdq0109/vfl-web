import { PageHeader } from '@/components/ui';
import { tTrenServer } from '@/lib/i18n/ngonNguServer';
import { BanHangQuayScreen } from '@/features/ban-hang-quay';

/* Server component mỏng: chỉ dựng khung, màn thật nằm trong features/. */
export default async function Page() {
  const t = await tTrenServer();

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title={t('trang.quayTieuDe')}
        description={t('trang.quayMoTa')}
      />
      <BanHangQuayScreen />
    </div>
  );
}
