/* Tiền VND — luôn là số nguyên đồng, không phần lẻ. Mọi nơi hiển thị hay nhập
   tiền phải đi qua đây để cách nhóm hàng nghìn và ký hiệu đồng nhất. */

const GROUPED = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

/** `1250000` → `"1.250.000 ₫"`. Trả `"—"` khi không có giá trị. */
export function money(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${GROUPED.format(Math.round(value))} ₫`;
}

/** Định dạng cho ô nhập tiền: chỉ nhóm hàng nghìn, không ký hiệu.
    `1250000` → `"1.250.000"`, `null` → `""`. Nhận cả chuỗi người dùng đang gõ. */
export function moneyInput(value: number | string | null | undefined): string {
  if (value == null || value === '') return '';
  const n = typeof value === 'string' ? parseVnd(value) : value;
  if (!Number.isFinite(n)) return '';
  return GROUPED.format(Math.trunc(n));
}

/** Đọc số tiền người dùng gõ: bỏ mọi ký tự không phải chữ số, giữ dấu âm đứng đầu.
    `"1.250.000 ₫"` → `1250000`, `""` → `0`. */
export function parseVnd(input: string): number {
  const negative = input.trimStart().startsWith('-');
  const digits = input.replace(/\D/g, '');
  if (!digits) return 0;
  const n = Number(digits);
  return negative ? -n : n;
}

/** Làm tròn đến hàng nghìn — giá niêm yết và thu tiền mặt không dùng lẻ trăm đồng. */
export function roundVnd(value: number): number {
  return Math.round(value / 1000) * 1000;
}
