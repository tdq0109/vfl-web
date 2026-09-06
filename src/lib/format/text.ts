/* Chuỗi — chuẩn hoá cho tìm kiếm không dấu, và vài tiện ích hiển thị. */

/** Bỏ dấu tiếng Việt + chữ thường, để so khớp tìm kiếm.
    `"Nguyễn Văn An"` → `"nguyen van an"`. */
export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // mọi dấu kết hợp (sắc, huyền, hỏi, ngã, nặng, mũ, móc)
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Chữ cái đầu của họ và tên, để làm ảnh đại diện.
    `"Nguyễn Văn An"` → `"NA"`, `"Bình"` → `"B"`. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0] ?? '';
  if (parts.length === 1) return first.charAt(0).toUpperCase();
  const last = parts[parts.length - 1] ?? '';
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

/** Che số giữa của số điện thoại. `"0912345678"` → `"0912***678"`.
    Số ngắn hơn 7 chữ số thì giữ nguyên. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return phone;
  return digits.slice(0, 4) + '*'.repeat(digits.length - 7) + digits.slice(-3);
}
