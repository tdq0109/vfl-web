import { NextResponse } from 'next/server';
import { dotnet } from '@/lib/server/dotnet';

/* Web này có gọi được backend .NET không — kiểm nhanh cho ngày chuyển đổi,
   không cần đăng nhập.

   Vì ai cũng gọi được nên không trả DOTNET_API_URL và không trả nguyên văn lỗi
   mạng. .NET chưa có health endpoint riêng nên gọi /auth/me không kèm token:
   401 vẫn là sống, chỉ lỗi mạng hoặc quá hạn mới là chết. */

export const dynamic = 'force-dynamic';

const TIMEOUT_MS = 2_000;

type TrangThaiBackend = 'ok' | 'khong-cau-hinh' | 'khong-goi-duoc';

interface SucKhoe {
  app: 'ok';
  backend: TrangThaiBackend;
  /** Mã HTTP backend trả về, nếu gọi tới nơi. */
  backendStatus?: number;
  /** Thời gian gọi, mili giây. */
  doTreMs?: number;
}

export async function GET(): Promise<NextResponse<SucKhoe>> {
  if (!process.env.DOTNET_API_URL) {
    return NextResponse.json({ app: 'ok', backend: 'khong-cau-hinh' }, { status: 503 });
  }

  const batDau = Date.now();
  try {
    const res = await dotnet('/auth/me', { signal: AbortSignal.timeout(TIMEOUT_MS) });
    return NextResponse.json({
      app: 'ok',
      backend: 'ok',
      backendStatus: res.status,
      doTreMs: Date.now() - batDau,
    });
  } catch {
    return NextResponse.json(
      { app: 'ok', backend: 'khong-goi-duoc', doTreMs: Date.now() - batDau },
      { status: 503 },
    );
  }
}
