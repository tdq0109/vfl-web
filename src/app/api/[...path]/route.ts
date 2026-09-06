import { type NextRequest, NextResponse } from 'next/server';
import { dotnet } from '@/lib/server/dotnet';
import { getAccessToken } from '@/lib/auth/session';

/* Proxy chung: mọi `/api/<x>` không phải `/api/auth/*` → `{DOTNET}/<x>`, gắn
   `Authorization: Bearer` lấy từ cookie httpOnly.

   Ở đây chỉ được đọc cookie, chuyển tiếp request và gắn header. Không truy
   vấn, không tính toán, không nghiệp vụ — cần logic nghĩa là endpoint .NET còn
   thiếu.

   Không tự refresh khi 401: lib/api/client.ts bắt 401, gọi /api/auth/refresh
   một lần rồi thử lại. */

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

async function forward(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  /* Next 15: `params` là Promise, phải await trước khi dựng đường dẫn. */
  const [token, { path }] = await Promise.all([getAccessToken(), ctx.params]);
  const target = `/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key) && key !== 'authorization' && key !== 'cookie') {
      headers.set(key, value);
    }
  });
  if (token) headers.set('authorization', `Bearer ${token}`);

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const upstream = await dotnet(target, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
  });

  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key) && key !== 'set-cookie') {
      resHeaders.set(key, value);
    }
  });
  return new NextResponse(upstream.body, { status: upstream.status, headers: resHeaders });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
