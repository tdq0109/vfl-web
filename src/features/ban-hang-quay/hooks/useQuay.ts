import { useQuery } from '@tanstack/react-query';
import { keys } from '@/lib/query/keys';
import { banHangQuayApi } from '../api';

/** Ca đang mở của chính mình tại CLB này. `null` = chưa mở ca. */
export function useCaDangMo(locationId: string | undefined) {
  return useQuery({
    queryKey: keys.banHangQuay.caDangMo(locationId ?? ''),
    queryFn: () => banHangQuayApi.caDangMo(locationId as string),
    enabled: Boolean(locationId),
    /* Ca là trạng thái đang chạy — để cũ dễ bán nhầm vào ca đã đóng ở máy khác. */
    staleTime: 0,
  });
}

/** Hàng bán được tại quầy. */
export function useHangQuay(locationId: string | undefined) {
  return useQuery({
    queryKey: keys.banHangQuay.hang(locationId ?? ''),
    queryFn: () => banHangQuayApi.hangQuay(locationId as string),
    enabled: Boolean(locationId),
  });
}
