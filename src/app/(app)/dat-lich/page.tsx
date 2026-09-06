import { PageHeader } from '@/components/ui';
import { tTrenServer } from '@/lib/i18n/ngonNguServer';
import { DatLichScreen } from '@/features/dat-lich';

/* Server component mỏng — theo khuôn Bước 7. */
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
