import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { keys } from '@/lib/query/keys';
import { datLichApi } from '../api';
import type { LichTuanParams } from '../types';

/** Lịch một tuần. Giữ tuần cũ trên màn khi đang tải tuần mới cho đỡ nháy. */
export function useLichTuan(params: LichTuanParams) {
  return useQuery({
    queryKey: keys.datLich.tuan(params),
    queryFn: () => datLichApi.lichTuan(params),
    placeholderData: keepPreviousData,
  });
}

export function useBuoiDetail(id: string | null) {
  return useQuery({
    queryKey: keys.datLich.buoi(id ?? ''),
    queryFn: () => datLichApi.detail(id as string),
    enabled: id !== null,
  });
}

export function useDanhSachHlv(locationId?: string) {
  return useQuery({
    queryKey: keys.datLich.danhSachHlv(locationId),
    queryFn: () => datLichApi.danhSachHlv(locationId),
  });
}

/** Lịch của một HLV trong tuần, mọi CLB — dùng để dò trùng trước khi lưu.

    Chỉ chạy khi đã chọn HLV. Cố ý không truyền CLB: xem chú thích ở
    datLichApi.lichHlv và timTrungLichHlv. */
export function useLichHlv(hlvId: string | undefined, tuNgay: string) {
  return useQuery({
    queryKey: keys.datLich.hlv(hlvId ?? '', tuNgay),
    queryFn: () => datLichApi.lichHlv(hlvId as string, tuNgay),
    enabled: Boolean(hlvId),
  });
}
