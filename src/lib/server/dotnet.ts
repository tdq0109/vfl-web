import 'server-only';

/* NƠI DUY NHẤT biết địa chỉ backend .NET. Không tệp nào khác được đọc
   `DOTNET_API_URL` hay gọi thẳng ra .NET — mọi thứ đi qua đây (route handler
   trong `app/api/`).

   Đây là tầng vận chuyển thô: nó KHÔNG gắn Authorization, KHÔNG refresh, KHÔNG
   hiểu nghiệp vụ. Route handler chịu trách nhiệm gắn `Authorization: Bearer`. */

function baseUrl(): string {
  const url = process.env.DOTNET_API_URL;
  if (!url) {
    throw new Error(
      'Thiếu biến môi trường DOTNET_API_URL — chép .env.example thành .env.local và điền địa chỉ backend .NET.',
    );
  }
  return url.replace(/\/+$/, '');
}

/** Gọi thô ra .NET. `path` bắt đầu bằng `/`. Luôn `no-store` vì đây là proxy. */
export function dotnet(path: string, init?: RequestInit): Promise<Response> {
  const target = `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(target, { ...init, cache: 'no-store' });
}

/** Gọi ra .NET và ép kiểu JSON trả về. Ném nếu .NET trả mã lỗi. */
export async function dotnetJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await dotnet(path, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    throw new Error(`.NET ${init?.method ?? 'GET'} ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}
