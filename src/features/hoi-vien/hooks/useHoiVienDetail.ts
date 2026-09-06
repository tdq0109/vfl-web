import { useQuery } from '@tanstack/react-query';
import { keys } from '@/lib/query/keys';
import { hoiVienApi } from '../api';

/** Chi tiết một hội viên. `id = null` thì không gọi (dùng khi ngăn kéo đóng). */
export function useHoiVienDetail(id: string | null) {
  return useQuery({
    queryKey: keys.hoiVien.detail(id ?? ''),
    queryFn: () => hoiVienApi.detail(id as string),
    enabled: id !== null,
  });
}
