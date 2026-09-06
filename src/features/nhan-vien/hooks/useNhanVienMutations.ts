import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import { useBaoLoiGhi } from '@/lib/query/baoLoi';
import { useMotLuot } from '@/lib/query/motLuot';
import { useT } from '@/components/shell/NgonNguProvider';
import { invalidateAffected, keys } from '@/lib/query/keys';
import { nhanVienApi } from '../api';
import type { DoiVaiTroInput, NhanVien, NhanVienInput, NhanVienStatus } from '../types';

/* Toàn bộ logic ghi của nhóm Nhân viên. Lỗi ProblemDetails không nuốt — màn đọc
   `mutation.error` để gắn vào ô nhập.

   ⚠ Chữ của toast lấy qua `useT()` BÊN TRONG hook, không gọi `t()` ở module
   scope: gọi ngoài hook là đóng băng chuỗi theo ngôn ngữ lúc nạp tệp — đổi ngôn
   ngữ xong vẫn thấy toast tiếng cũ, mà chỉ lộ ra đúng lúc thao tác thành công. */

export function useCreateNhanVien() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (input: NhanVienInput) => nhanVienApi.create(input),
      onSuccess: async () => {
        await invalidateAffected(qc, 'nhanVienThayDoi');
        toast.ok(t('nhanVien.daThem'));
      },
      onError: baoLoi,
    }),
  );
}

export function useUpdateNhanVien() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { id: string; input: NhanVienInput }) =>
        nhanVienApi.update(vars.id, vars.input),
      onSuccess: async (updated: NhanVien) => {
        qc.setQueryData(keys.nhanVien.detail(updated.id), updated);
        await invalidateAffected(qc, 'nhanVienThayDoi');
        toast.ok(t('nhanVien.daLuuHoSo'));
      },
      onError: baoLoi,
    }),
  );
}

export function useDoiVaiTro() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { id: string; input: DoiVaiTroInput }) =>
        nhanVienApi.doiVaiTro(vars.id, vars.input),
      onSuccess: async (updated: NhanVien) => {
        qc.setQueryData(keys.nhanVien.detail(updated.id), updated);
        await invalidateAffected(qc, 'nhanVienThayDoi');
        toast.ok(t('nhanVien.daDoiVaiTro'));
      },
      onError: baoLoi,
    }),
  );
}

export function useDoiTrangThaiNhanVien() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { id: string; trangThai: NhanVienStatus }) =>
        nhanVienApi.doiTrangThai(vars.id, vars.trangThai),
      onSuccess: async (updated: NhanVien) => {
        qc.setQueryData(keys.nhanVien.detail(updated.id), updated);
        await invalidateAffected(qc, 'nhanVienThayDoi');
        toast.ok(t('chung.daDoiTrangThai'));
      },
      onError: baoLoi,
    }),
  );
}
