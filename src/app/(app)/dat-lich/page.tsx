import { PageHeader } from '@/components/ui';
import { tTrenServer } from '@/lib/i18n/ngonNguServer';
import { DatLichScreen } from '@/features/dat-lich';

/* Server component mỏng: chỉ dựng khung, màn thật nằm trong features/. */
export default async function Page() {
  const t = await tTrenServer();

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title={t('nav.datLich')}
        description={t('trang.datLichMoTa')}
      />
      <DatLichScreen />
    </div>
  );
}
