import { useQuery } from '@tanstack/react-query';
import { hoiVienApi } from '@/features/hoi-vien';
import { sanPhamApi, trangThaiKhuyenMai } from '@/features/san-pham';
import { keys } from '@/lib/query/keys';

/* Nguồn dữ liệu để CHỌN khi lập hợp đồng: hội viên, sản phẩm đang bán, khuyến
   mãi đang chạy. Dùng lại api và khoá cache của hai nhóm kia — không tự đặt
   endpoint mới, không tự đặt khoá mới. */

const HV_PAGE_SIZE = 20;
const SP_PAGE_SIZE = 100;

/* `enabled` để ba truy vấn này chỉ chạy khi form soạn thảo đang mở — danh sách
   sản phẩm và khuyến mãi vô ích với người chỉ vào xem hợp đồng. */

/** Tìm hội viên để gắn vào hợp đồng. Chuỗi tìm đã được debounce ở màn. */
export function useHoiVienChon(search: string, locationId: string | undefined, enabled: boolean) {
  const params = {
    page: 1,
    pageSize: HV_PAGE_SIZE,
    search: search || undefined,
    trangThai: undefined,
    locationId,
  };
  return useQuery({
    queryKey: keys.hoiVien.list(params),
    queryFn: () => hoiVienApi.list(params),
    enabled,
  });
}

/** Sản phẩm đang bán tại CLB — nguồn cho dòng hợp đồng. */
export function useSanPhamBanDuoc(locationId: string | undefined, enabled: boolean) {
  const params = {
    page: 1,
    pageSize: SP_PAGE_SIZE,
    trangThai: 'dang-ban' as const,
    locationId,
  };
  return useQuery({
    queryKey: keys.sanPham.list(params),
    queryFn: () => sanPhamApi.list(params),
    enabled,
  });
}

/** Chỉ khuyến mãi đang chạy mới áp được — trạng thái suy từ ngày, không lưu. */
export function useKhuyenMaiDangChay(enabled: boolean) {
  return useQuery({
    queryKey: keys.khuyenMai.all,
    queryFn: () => sanPhamApi.listKhuyenMai(),
    select: (ds) => ds.filter((km) => trangThaiKhuyenMai(km) === 'dang-chay'),
    enabled,
  });
}
