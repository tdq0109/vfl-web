import 'server-only';
import { NextResponse } from 'next/server';

/* Chuyển nguyên một phản hồi từ .NET về cho client — giữ mã trạng thái, thân, và
   vài header an toàn. Dùng khi route handler không cần đọc/biến đổi thân (ví dụ
   trả lỗi ProblemDetails của .NET nguyên văn để form gắn lỗi field). */

const SAFE_HEADERS = ['content-type', 'content-disposition', 'cache-control'];

export function relay(res: Response): NextResponse {
  const headers = new Headers();
  for (const name of SAFE_HEADERS) {
    const value = res.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new NextResponse(res.body, { status: res.status, headers });
}
