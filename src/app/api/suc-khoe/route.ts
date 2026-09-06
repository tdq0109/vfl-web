import { NextResponse } from 'next/server';
import { dotnet } from '@/lib/server/dotnet';

/* Kiểm tra sức khoẻ — dùng cho ngày chuyển đổi (Bước 14) và cho giám sát.

   Trả lời đúng một câu hỏi: web này có nói chuyện được với backend .NET
   không. Ngày mở CLB đầu tiên, câu đó phải trả lời được trong 2 giây mà không
   cần ai đăng nhập.

   Không lộ thông tin nội bộ: không trả địa chỉ DOTNET_API_URL, không trả
   nguyên văn lỗi mạng. Endpoint này không yêu cầu đăng nhập nên bất kỳ ai chạm
   được cũng đọc được phần trả lời.

   Không có endpoint health riêng bên .NET nên ta gọi /auth/me không kèm token:
   401 vẫn là sống, chỉ lỗi mạng hoặc quá hạn mới là chết. Khi đội .NET làm
   health endpoint thật thì đổi đúng một dòng dưới đây. */

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
