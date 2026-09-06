import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui';
import { ngonNguTrenServer, tTrenServer } from '@/lib/i18n/ngonNguServer';
import { Providers } from './providers';
import './globals.css';

// subset 'vietnamese' bắt buộc — thiếu nó thì chữ có dấu sẽ rơi về phông dự phòng
const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' });

/* `metadata` tĩnh không thấy request nào nên không dịch được; `generateMetadata()`
   chạy trong ngữ cảnh request nên đọc được cookie ngôn ngữ. Tên hệ thống là tên
   riêng, giữ nguyên ở cả hai bản. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await tTrenServer();
  return { title: t('app.name'), description: t('app.tagline') };
}

/* ⚠ `lang` LẤY TỪ COOKIE, không phải hằng "vi".

   Trình đọc màn hình chọn giọng đọc theo thuộc tính này. Trước đây nó luôn là
   "vi" và `NgonNguProvider` sửa lại sau khi hydrate — nghĩa là trong suốt lần
   dựng HTML đầu, máy đọc tiếng Anh bằng giọng tiếng Việt. Đọc cookie tại đây là
   đúng ngay từ byte đầu.

   Cùng giá trị đó truyền xuống `Providers` làm ảnh chụp server của kho ngôn
   ngữ, nên client không phải đoán lại và không lệch hydration. */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const ngonNgu = await ngonNguTrenServer();

  return (
    <html lang={ngonNgu} className={inter.variable}>
      <body>
        <Providers ngonNgu={ngonNgu}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
