import type { UserProfile } from './types';

/* Phân quyền 3 chiều, chỉ để ẩn/hiện nút và lối đi — bảo mật thật nằm ở backend
   .NET, không ngoại lệ.

   1. Cấp bậc vai trò: không ai thao tác được người ngang hoặc cao hơn mình.
   2. Phạm vi CLB: chỉ làm việc trong các CLB được giao.
   3. Cờ toàn hệ thống: chỉ Giám đốc / CEO gán được cho người khác. */

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

/** Khoá i18n của nhãn vai trò. Một chỗ duy nhất, mọi màn lấy từ đây.

    Giữ hình Record<Role, string> để TypeScript vẫn bắt thiếu nhánh khi thêm một
    vai trò mới. Khoá phải có thật trong từ điển lib/i18n. */
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

export function rankOf(role: string): number {
  return (ROLE_RANK as Record<string, number>)[role] ?? 0;
}

/** Khoá i18n của một mã vai trò; mã lạ trả về chính mã đó.

    Trả nguyên mã lạ cũng đúng lối với t(): tra không ra thì trả lại chính khoá.
    Backend thêm vai trò mới mà frontend chưa biết thì màn hiện mã thô — xấu
    nhưng không mất thông tin. */
export function roleKhoa(role: string): string {
  return (ROLE_KHOA as Record<string, string>)[role] ?? role;
}

/** Người dùng đạt tối thiểu cấp bậc role chưa. Dùng cho <Can minRole> và
    menu. */
export function hasMinRole(user: Pick<UserProfile, 'role'>, role: Role): boolean {
  return rankOf(user.role) >= ROLE_RANK[role];
}

/** Chiều 1: actor có được thao tác lên người mang targetRole không. Nghiêm
    ngặt hơn — phải cao hơn hẳn, không được ngang. */
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

/** Các vai trò actor được phép gán cho người khác — hệ quả trực tiếp của
    chiều 1: chỉ gán được vai trò thấp hơn hẳn vai trò của mình. */
export function assignableRoles(actor: Pick<UserProfile, 'role'>): Role[] {
  return ROLE_ORDER.filter((r) => canManageRole(actor, r));
}

/** actor có được sửa hồ sơ / vai trò của target không. Gộp chiều 1 và 2:
    phải cao cấp hơn và có phạm vi trong CLB của người kia. Tự sửa mình thì
    không dùng hàm này, màn hồ sơ cá nhân lo riêng. */
export function canManageStaff(
  actor: Pick<UserProfile, 'role' | 'allLocations' | 'locations'>,
  target: { role: string; locationId: string },
): boolean {
  return canManageRole(actor, target.role) && canActInLocation(actor, target.locationId);
}
