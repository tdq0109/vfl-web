import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Card } from '@/components/ui';
import { tTrenServer } from '@/lib/i18n/ngonNguServer';
import { LoginForm } from './LoginForm';

/* `metadata` tĩnh không dịch được — nó tính một lần lúc dựng, không thấy request
   nào cả. `generateMetadata()` thì chạy trong ngữ cảnh request nên đọc được
   cookie ngôn ngữ, y như thân trang. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await tTrenServer();
  return { title: `${t('dangNhap.tieuDe')} · ${t('app.name')}` };
}

export default async function Page() {
  const t = await tTrenServer();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm space-y-6 p-6">
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-ink">{t('dangNhap.tieuDe')}</h1>
          <p className="text-sm text-muted">{t('app.tagline')}</p>
        </div>
        {/* useSearchParams cần ranh giới Suspense khi build tĩnh */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </Card>
    </main>
  );
}
