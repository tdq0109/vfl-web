import { PageHeader } from '@/components/ui';
import { tTrenServer } from '@/lib/i18n/ngonNguServer';
import { NhanVienScreen } from '@/features/nhan-vien';

/* Server component mỏng: chỉ dựng khung, màn thật nằm trong features/. */
export default async function Page() {
  const t = await tTrenServer();

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title={t('nav.nhanVien')}
        description={t('trang.nhanVienMoTa')}
      />
      <NhanVienScreen />
    </div>
  );
}
