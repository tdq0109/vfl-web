import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { keys } from '@/lib/query/keys';
import { hoiVienApi } from '../api';
import type { HoiVienListParams } from '../types';

/** Danh sách hội viên có lọc + phân trang. Giữ trang cũ trên màn khi đang tải
    trang mới để bảng không nhấp nháy. */
export function useHoiVienList(params: HoiVienListParams) {
  return useQuery({
    queryKey: keys.hoiVien.list(params),
    queryFn: () => hoiVienApi.list(params),
    placeholderData: keepPreviousData,
  });
}
