/* Tên cookie phiên — tách riêng, không kèm `server-only`, để middleware (chạy ở
   edge runtime) dùng chung một nguồn với `session.ts`. */

export const ACCESS_COOKIE = 'vfl_at';
export const REFRESH_COOKIE = 'vfl_rt';
