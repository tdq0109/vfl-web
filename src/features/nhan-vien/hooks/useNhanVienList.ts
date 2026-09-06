import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { keys } from '@/lib/query/keys';
import { nhanVienApi } from '../api';
import type { NhanVienListParams } from '../types';

/** Danh bạ nhân viên có lọc + phân trang. */
export function useNhanVienList(params: NhanVienListParams) {
  return useQuery({
    queryKey: keys.nhanVien.list(params),
    queryFn: () => nhanVienApi.list(params),
    placeholderData: keepPreviousData,
  });
}
