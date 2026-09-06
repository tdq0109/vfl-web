import { ApiError } from './errors';

/* Máy khách HTTP DUY NHẤT phía trình duyệt. Mọi lời gọi API của client đi qua
   đây (quy ước 1 trong lộ trình). Server component / route handler KHÔNG dùng
   tệp này — chúng gọi .NET qua `lib/server/dotnet.ts` (Bước 5).

   - Gọi tới `/api/*` của Next, không tự gắn Authorization: cookie phiên là
     httpOnly nên trình duyệt tự đính kèm, JS không bao giờ chạm token.
   - Gặp 401 thì refresh một lần rồi thử lại. Mọi request 401 đồng thời DÙNG
     CHUNG một lần refresh — nếu không, 10 request 401 gọi refresh 10 lần và 9
     lần sau chạy với refresh token đã xoay vòng → người dùng bị đăng xuất oan. */

const BASE = '/api';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  query?: QueryParams;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'same-origin',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function buildUrl(path: string, query?: QueryParams): string {
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(
  method: string,
  path: string,
  body: unknown,
  options: RequestOptions,
): Promise<T> {
  const url = buildUrl(path, options.query);
  const isAuthCall = path.startsWith('/auth/');

  const init: RequestInit = {
    method,
    credentials: 'same-origin',
    signal: options.signal,
    headers: { ...options.headers },
  };

  if (body !== undefined) {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      init.headers = { 'Content-Type': 'application/json', ...init.headers };
      init.body = JSON.stringify(body);
    }
  }

  let res = await fetch(url, init);

  if (res.status === 401 && !isAuthCall && (await refreshSession())) {
    res = await fetch(url, init);
  }

  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;

  const contentType = res.headers.get('content-type') ?? '';
  return (contentType.includes('application/json') ? JSON.parse(text) : text) as T;
}

export const api = {
  get: <T>(path: string, options: RequestOptions = {}): Promise<T> =>
    request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options: RequestOptions = {}): Promise<T> =>
    request<T>('DELETE', path, undefined, options),
};
