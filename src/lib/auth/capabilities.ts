import { ROLE_RANK, type Role } from './permissions';

/* MA TRẬN PHÂN QUYỀN — bảng tra "vai trò nào làm được việc gì", hiển thị ở màn
   Nhân viên để người vận hành đối chiếu.

   ⚠ Đây là BẢN SAO ĐỂ HIỂN THỊ, không phải nguồn sự thật. Quyền thật do backend
   .NET quyết. Khi backend chốt danh sách quyền, đồng bộ lại bảng này. Mỗi mục
   ghi cấp bậc tối thiểu; ai đạt cấp đó trở lên thì có quyền.

   ⚠ `nhomKhoa` và `nhanKhoa` chứa KHOÁ i18n, không phải chữ tiếng Việt — đọc
   bằng `t(cap.nhanKhoa)`. Tên trường mang chữ "Khoá" để không ai lỡ đem đi
   hiển thị thẳng; khoá phải có thật trong từ điển `lib/i18n`. */

export interface Capability {
  id: string;
  /** KHOÁ i18n của nhóm — dùng để gom dòng trong bảng. Gom theo KHOÁ chứ không
      theo chữ đã dịch: đổi ngôn ngữ không được làm bảng gom lại khác đi. */
  nhomKhoa: string;
  /** KHOÁ i18n của tên quyền. */
  nhanKhoa: string;
  minRank: number;
}

export const CAPABILITIES: Capability[] = [
  { id: 'hoi-vien.xem', nhomKhoa: 'quyen.nhom.hoiVien', nhanKhoa: 'quyen.hoi-vien.xem', minRank: ROLE_RANK.ctv },
  { id: 'hoi-vien.them', nhomKhoa: 'quyen.nhom.hoiVien', nhanKhoa: 'quyen.hoi-vien.them', minRank: ROLE_RANK.staff },
  { id: 'hoi-vien.trang-thai', nhomKhoa: 'quyen.nhom.hoiVien', nhanKhoa: 'chung.doiTrangThai', minRank: ROLE_RANK.leader },

  { id: 'nhan-vien.xem', nhomKhoa: 'quyen.nhom.nhanVien', nhanKhoa: 'quyen.nhan-vien.xem', minRank: ROLE_RANK.leader },
  { id: 'nhan-vien.sua', nhomKhoa: 'quyen.nhom.nhanVien', nhanKhoa: 'quyen.nhan-vien.sua', minRank: ROLE_RANK.manager },
  { id: 'nhan-vien.vai-tro', nhomKhoa: 'quyen.nhom.nhanVien', nhanKhoa: 'quyen.nhan-vien.vai-tro', minRank: ROLE_RANK.manager },
  { id: 'nhan-vien.all-club', nhomKhoa: 'quyen.nhom.nhanVien', nhanKhoa: 'quyen.nhan-vien.all-club', minRank: ROLE_RANK.director },

  { id: 'san-pham.xem', nhomKhoa: 'quyen.nhom.sanPham', nhanKhoa: 'quyen.san-pham.xem', minRank: ROLE_RANK.staff },
  { id: 'san-pham.sua', nhomKhoa: 'quyen.nhom.sanPham', nhanKhoa: 'quyen.san-pham.sua', minRank: ROLE_RANK.manager },
  { id: 'san-pham.gia-san', nhomKhoa: 'quyen.nhom.sanPham', nhanKhoa: 'quyen.san-pham.gia-san', minRank: ROLE_RANK.director },

  { id: 'ban-hang.quay', nhomKhoa: 'quyen.nhom.banHang', nhanKhoa: 'quyen.ban-hang.quay', minRank: ROLE_RANK.staff },
  { id: 'ban-hang.hop-dong', nhomKhoa: 'quyen.nhom.banHang', nhanKhoa: 'quyen.ban-hang.hop-dong', minRank: ROLE_RANK.staff },
  { id: 'ban-hang.xac-minh', nhomKhoa: 'quyen.nhom.banHang', nhanKhoa: 'quyen.ban-hang.xac-minh', minRank: ROLE_RANK.accountant },
  { id: 'ban-hang.huy', nhomKhoa: 'quyen.nhom.banHang', nhanKhoa: 'quyen.ban-hang.huy', minRank: ROLE_RANK.director },

  { id: 'bao-cao.clb', nhomKhoa: 'quyen.nhom.baoCao', nhanKhoa: 'quyen.bao-cao.clb', minRank: ROLE_RANK.leader },
  { id: 'bao-cao.toan-he-thong', nhomKhoa: 'quyen.nhom.baoCao', nhanKhoa: 'quyen.bao-cao.toan-he-thong', minRank: ROLE_RANK.director },
];

/** Nhóm quyền theo `nhomKhoa`, giữ nguyên thứ tự khai báo. */
export function capabilitiesByGroup(): { nhomKhoa: string; items: Capability[] }[] {
  const out: { nhomKhoa: string; items: Capability[] }[] = [];
  for (const cap of CAPABILITIES) {
    const last = out[out.length - 1];
    if (last && last.nhomKhoa === cap.nhomKhoa) last.items.push(cap);
    else out.push({ nhomKhoa: cap.nhomKhoa, items: [cap] });
  }
  return out;
}

/** Vai trò `role` có quyền `cap` không. */
export function roleHasCapability(role: Role, cap: Capability): boolean {
  return ROLE_RANK[role] >= cap.minRank;
}
