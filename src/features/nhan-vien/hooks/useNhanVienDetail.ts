import { useQuery } from '@tanstack/react-query';
import { keys } from '@/lib/query/keys';
import { nhanVienApi } from '../api';

/** Hồ sơ một nhân viên. `id = null` thì không gọi. */
export function useNhanVienDetail(id: string | null) {
  return useQuery({
    queryKey: keys.nhanVien.detail(id ?? ''),
    queryFn: () => nhanVienApi.detail(id as string),
    enabled: id !== null,
  });
}
