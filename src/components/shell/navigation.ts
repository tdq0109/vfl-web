import type { Role } from '@/lib/auth/permissions';
import { hasMinRole } from '@/lib/auth/permissions';
import type { UserProfile } from '@/lib/auth/types';

/* MENU LÀ DỮ LIỆU, không phải JSX. Thêm màn = thêm một dòng ở đây; quyền tự lọc.

   `minRole` là mức tối thiểu để THẤY mục menu — mới đặt sơ bộ, tinh chỉnh khi
   dựng từng màn (Bước 7+). Đường dẫn tiếng Việt để đọc URL biết đang ở đâu. */

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
  /* Giám sát ca nhìn ca của NGƯỜI KHÁC nên đặt từ cấp `leader` — thu ngân chỉ
     thấy ca của chính mình ở màn Bán vé ngày. Đây chỉ là ẩn mục menu; backend
     .NET mới là nơi chặn thật (mock trả 403 cho `staff`). */
  { labelKey: 'nav.giamSatCa', href: '/ban-hang/giam-sat-ca', minRole: 'leader' },
  { labelKey: 'nav.hopDong', href: '/ban-hang/hop-dong', minRole: 'staff' },
];

/** Lọc menu theo cấp bậc của người dùng. */
export function visibleNav(user: Pick<UserProfile, 'role'>): NavItem[] {
  return NAV.filter((item) => item.minRole === undefined || hasMinRole(user, item.minRole));
}
