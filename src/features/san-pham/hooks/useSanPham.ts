import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { keys } from '@/lib/query/keys';
import { sanPhamApi } from '../api';
import type { SanPhamListParams } from '../types';

/** Danh mục sản phẩm có lọc + phân trang. */
export function useSanPhamList(params: SanPhamListParams) {
  return useQuery({
    queryKey: keys.sanPham.list(params),
    queryFn: () => sanPhamApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Chi tiết một sản phẩm. `id = null` thì không gọi. */
export function useSanPhamDetail(id: string | null) {
  return useQuery({
    queryKey: keys.sanPham.detail(id ?? ''),
    queryFn: () => sanPhamApi.detail(id as string),
    enabled: id !== null,
  });
}

/** Danh sách khuyến mãi. Ít bản ghi nên không phân trang. */
export function useKhuyenMaiList() {
  return useQuery({
    queryKey: keys.khuyenMai.all,
    queryFn: () => sanPhamApi.listKhuyenMai(),
  });
}
