import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import { useBaoLoiGhi } from '@/lib/query/baoLoi';
import { useMotLuot } from '@/lib/query/motLuot';
import { useT } from '@/components/shell/NgonNguProvider';
import { invalidateAffected, keys } from '@/lib/query/keys';
import { hoiVienApi } from '../api';
import type { HoiVien, HoiVienInput, HoiVienStatus } from '../types';

/* Toàn bộ logic ghi của nhóm Hội viên. Component chỉ gọi hook, không tự gọi API.

   ⚠ Thông điệp toast lấy `t` từ hook, KHÔNG gọi `t()` ở module scope. Gọi ở
   module scope là chuỗi bị đóng băng theo ngôn ngữ lúc nạp tệp — đổi ngôn ngữ
   xong vẫn thấy toast tiếng cũ, mà chỉ lộ ra đúng lúc thao tác thành công.
   Ghi xong thì invalidate các nhánh mà sự kiện `hoiVienThayDoi` ảnh hưởng (khai
   trong lib/query/keys.ts). Lỗi ProblemDetails KHÔNG nuốt — để component đọc từ
   `mutation.error` và gắn vào ô nhập. */

export function useCreateHoiVien() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (input: HoiVienInput) => hoiVienApi.create(input),
      onSuccess: async () => {
        await invalidateAffected(qc, 'hoiVienThayDoi');
        toast.ok(t('hoiVien.daThem'));
      },
      onError: baoLoi,
    }),
  );
}

export function useUpdateHoiVien() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { id: string; input: HoiVienInput }) =>
        hoiVienApi.update(vars.id, vars.input),
      onSuccess: async (updated: HoiVien) => {
        qc.setQueryData(keys.hoiVien.detail(updated.id), updated);
        await invalidateAffected(qc, 'hoiVienThayDoi');
        toast.ok(t('hoiVien.daLuu'));
      },
      onError: baoLoi,
    }),
  );
}

export function useDoiTrangThaiHoiVien() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { id: string; trangThai: HoiVienStatus }) =>
        hoiVienApi.doiTrangThai(vars.id, vars.trangThai),
      onSuccess: async (updated: HoiVien) => {
        qc.setQueryData(keys.hoiVien.detail(updated.id), updated);
        await invalidateAffected(qc, 'hoiVienThayDoi');
        toast.ok(t('chung.daDoiTrangThai'));
      },
      onError: baoLoi,
    }),
  );
}
