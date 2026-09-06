/* Chuẩn hoá đường dẫn quay lại sau khi đăng nhập hoặc làm mới phiên.

   Chỉ nhận đường dẫn nội bộ. //evil.com và https://evil.com là URL tuyệt đối trá
   hình, nhận vào sẽ thành lỗ hổng chuyển hướng mở. */
export function internalPath(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  // `/\evil.com` bị một số trình duyệt hiểu như `//evil.com`
  if (value.startsWith('/\\')) return fallback;
  return value;
}
