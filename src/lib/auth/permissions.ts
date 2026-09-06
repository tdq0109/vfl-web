import type { UserProfile } from './types';

/* Phân quyền 3 CHIỀU. Đây chỉ để ẩn/hiện nút và lối đi — bảo mật thật nằm ở
   backend .NET, không ngoại lệ.

   1. Cấp bậc vai trò — không ai thao tác được người có vai trò ngang hoặc cao
      hơn mình (gán vai trò, sửa hồ sơ, xoá…).
   2. Phạm vi CLB — chỉ làm việc trong các CLB được giao.
   3. Cờ "toàn hệ thống" (allLocations) — chỉ Giám đốc / CEO mới gán được cho
      người khác. */

export const ROLE_RANK = {
  ctv: 10,
  staff: 20,
  coach: 20,
  leader: 30,
  accountant: 35,
  manager: 40,
  director: 60,
  ceo: 100,
} as const;

export type Role = keyof typeof ROLE_RANK;

/** KHOÁ i18n của nhãn vai trò. Một chỗ duy nhất, mọi màn lấy từ đây.

    ⚠ ĐÂY LÀ KHOÁ, KHÔNG PHẢI CHỮ TIẾNG VIỆT. Đọc nhãn bằng `t(ROLE_KHOA[r])`.
    Giữ hình `Record<Role, string>` để TypeScript vẫn bắt thiếu nhánh khi thêm
    một vai trò mới; còn khoá có thật trong từ điển hay không thì
    khoá phải có thật trong từ điển `lib/i18n`. */
export const ROLE_KHOA: Record<Role, string> = {
  ctv: 'vaiTro.ctv',
  staff: 'vaiTro.staff',
  coach: 'vaiTro.coach',
  leader: 'vaiTro.leader',
  accountant: 'vaiTro.accountant',
  manager: 'vaiTro.manager',
  director: 'vaiTro.director',
  ceo: 'vaiTro.ceo',
};

/** Vai trò xếp từ thấp lên cao, để dựng danh sách chọn và ma trận quyền. */
export const ROLE_ORDER: Role[] = ['ctv', 'staff', 'coach', 'leader', 'accountant', 'manager', 'director', 'ceo'];

/** Cấp bậc của một mã vai trò; vai trò lạ trả 0 (thấp nhất). */
export function rankOf(role: string): number {
  return (ROLE_RANK as Record<string, number>)[role] ?? 0;
}

/** KHOÁ i18n của một mã vai trò; mã lạ trả về CHÍNH MÃ ĐÓ.

    Trả nguyên mã lạ vẫn đúng sau khi chuyển sang i18n, và đúng vì cùng một lý
    do: `t()` tra không ra thì trả lại chính khoá. Backend thêm vai trò mới mà
    frontend chưa biết thì màn hiện mã thô — xấu nhưng không mất thông tin,
    đúng như trước khi chuyển. */
export function roleKhoa(role: string): string {
  return (ROLE_KHOA as Record<string, string>)[role] ?? role;
}

/** Người dùng đạt tối thiểu cấp bậc `role` chưa. Dùng cho `<Can minRole>` và menu. */
export function hasMinRole(user: Pick<UserProfile, 'role'>, role: Role): boolean {
  return rankOf(user.role) >= ROLE_RANK[role];
}

/** Chiều 1: `actor` có được thao tác lên người mang `targetRole` không.
    Nghiêm ngặt hơn — phải CAO HƠN hẳn, không được ngang. */
export function canManageRole(
  actor: Pick<UserProfile, 'role'>,
  targetRole: string,
): boolean {
  return rankOf(actor.role) > rankOf(targetRole);
}

/** Chiều 2: `user` có được làm việc trong CLB `locationId` không. */
export function canActInLocation(
  user: Pick<UserProfile, 'allLocations' | 'locations'>,
  locationId: string,
): boolean {
  return user.allLocations || user.locations.some((l) => l.id === locationId);
}

/** Chiều 3: `actor` có được gán cờ "toàn hệ thống" cho người khác không. */
export function canGrantAllLocations(actor: Pick<UserProfile, 'role'>): boolean {
  return rankOf(actor.role) >= ROLE_RANK.director;
}

/** Các vai trò `actor` được phép GÁN cho người khác — hệ quả trực tiếp của
    chiều 1: chỉ gán được vai trò thấp hơn hẳn vai trò của mình. */
export function assignableRoles(actor: Pick<UserProfile, 'role'>): Role[] {
  return ROLE_ORDER.filter((r) => canManageRole(actor, r));
}

/** `actor` có được sửa hồ sơ / vai trò của `target` không. Gộp chiều 1 và 2:
    phải cao cấp hơn VÀ có phạm vi trong CLB của người kia. Tự sửa mình thì
    không dùng hàm này (màn hồ sơ cá nhân lo riêng). */
export function canManageStaff(
  actor: Pick<UserProfile, 'role' | 'allLocations' | 'locations'>,
  target: { role: string; locationId: string },
): boolean {
  return canManageRole(actor, target.role) && canActInLocation(actor, target.locationId);
}
