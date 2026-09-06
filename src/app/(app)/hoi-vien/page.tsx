import { PageHeader } from '@/components/ui';
import { tTrenServer } from '@/lib/i18n/ngonNguServer';
import { HoiVienScreen } from '@/features/hoi-vien';

/* Server component mỏng — chỉ dựng khung tĩnh. Toàn bộ tương tác nằm trong
   <HoiVienScreen> (client). Đây là khuôn cho 5 nhóm còn lại. */
export default async function Page() {
  const t = await tTrenServer();

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title={t('nav.hoiVien')}
        description={t('trang.hoiVienMoTa')}
      />
      <HoiVienScreen />
    </div>
  );
}
