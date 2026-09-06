import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { keys } from '@/lib/query/keys';
import { hopDongApi } from '../api';
import type { HopDongListParams } from '../types';

/** Danh sách hợp đồng có lọc + phân trang. */
export function useHopDongList(params: HopDongListParams) {
  return useQuery({
    queryKey: keys.hopDong.list(params),
    queryFn: () => hopDongApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Chi tiết một hợp đồng. id = null thì không gọi (ngăn kéo đang đóng).

    staleTime: 0 vì hợp đồng là chứng từ chạy qua nhiều người — sales chốt, thu
    ngân thu, kế toán xác minh. Đọc bản cũ rồi bấm bước tiếp là nhận 409. */
export function useHopDongDetail(id: string | null) {
  return useQuery({
    queryKey: keys.hopDong.detail(id ?? ''),
    queryFn: () => hopDongApi.detail(id as string),
    enabled: id !== null,
    staleTime: 0,
  });
}
