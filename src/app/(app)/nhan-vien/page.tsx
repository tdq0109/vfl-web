import { PageHeader } from '@/components/ui';
import { tTrenServer } from '@/lib/i18n/ngonNguServer';
import { NhanVienScreen } from '@/features/nhan-vien';

/* Server component mỏng — theo khuôn Bước 7. */
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
