import type { Role } from '@/lib/auth/permissions';
import { hasMinRole } from '@/lib/auth/permissions';
import type { UserProfile } from '@/lib/auth/types';

/* Menu là dữ liệu, không phải JSX: thêm màn là thêm một dòng, quyền tự lọc.
   minRole là mức tối thiểu để thấy mục menu. */

export interface NavItem {
  /** Khoá i18n. */
  labelKey: string;
  href: string;
  minRole?: Role;
}

export const NAV: readonly NavItem[] = [
  { labelKey: 'nav.tongQuan', href: '/tong-quan' },
  { labelKey: 'nav.hoiVien', href: '/hoi-vien' },
  { labelKey: 'nav.nhanVien', href: '/nhan-vien', minRole: 'leader' },
  { labelKey: 'nav.sanPham', href: '/san-pham', minRole: 'leader' },
  { labelKey: 'nav.datLich', href: '/dat-lich' },
  { labelKey: 'nav.banHangQuay', href: '/ban-hang/quay' },
  /* Giám sát ca nhìn ca của người khác nên đặt từ cấp leader — thu ngân chỉ
     thấy ca của chính mình ở màn Bán vé ngày. Đây chỉ là ẩn mục menu, backend
     .NET mới là nơi chặn thật (mock trả 403 cho staff). */
  { labelKey: 'nav.giamSatCa', href: '/ban-hang/giam-sat-ca', minRole: 'leader' },
  { labelKey: 'nav.hopDong', href: '/ban-hang/hop-dong', minRole: 'staff' },
];

export function visibleNav(user: Pick<UserProfile, 'role'>): NavItem[] {
  return NAV.filter((item) => item.minRole === undefined || hasMinRole(user, item.minRole));
}
