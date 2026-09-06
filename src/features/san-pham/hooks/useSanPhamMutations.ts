import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import { useBaoLoiGhi } from '@/lib/query/baoLoi';
import { useMotLuot } from '@/lib/query/motLuot';
import { useT } from '@/components/shell/NgonNguProvider';
import type { Vnd } from '@/lib/api/types';
import { invalidateAffected, keys } from '@/lib/query/keys';
import { sanPhamApi } from '../api';
import type {
  KhuyenMai,
  KhuyenMaiInput,
  SanPham,
  SanPhamInput,
  SanPhamStatus,
} from '../types';

/* Toàn bộ logic ghi của nhóm Sản phẩm. Lỗi ProblemDetails không nuốt, màn đọc
   mutation.error để gắn vào ô nhập.

   Chữ của toast lấy qua useT() bên trong hook, không gọi t() ở module scope —
   xem ghi chú cùng loại ở useNhanVienMutations.ts. */

export function useCreateSanPham() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (input: SanPhamInput) => sanPhamApi.create(input),
      onSuccess: async () => {
        await invalidateAffected(qc, 'sanPhamThayDoi');
        toast.ok(t('sanPham.daThem'));
      },
      onError: baoLoi,
    }),
  );
}

export function useUpdateSanPham() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { id: string; input: SanPhamInput }) =>
        sanPhamApi.update(vars.id, vars.input),
      onSuccess: async (updated: SanPham) => {
        qc.setQueryData(keys.sanPham.detail(updated.id), updated);
        await invalidateAffected(qc, 'sanPhamThayDoi');
        toast.ok(t('sanPham.daLuu'));
      },
      onError: baoLoi,
    }),
  );
}

export function useDatGiaSan() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { id: string; giaSan: Vnd }) =>
        sanPhamApi.datGiaSan(vars.id, vars.giaSan),
      onSuccess: async (updated: SanPham) => {
        qc.setQueryData(keys.sanPham.detail(updated.id), updated);
        await invalidateAffected(qc, 'sanPhamThayDoi');
        toast.ok(t('sanPham.daDatGiaSan'));
      },
      onError: baoLoi,
    }),
  );
}

export function useDoiTrangThaiSanPham() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { id: string; trangThai: SanPhamStatus }) =>
        sanPhamApi.doiTrangThai(vars.id, vars.trangThai),
      onSuccess: async (updated: SanPham) => {
        qc.setQueryData(keys.sanPham.detail(updated.id), updated);
        await invalidateAffected(qc, 'sanPhamThayDoi');
        toast.ok(t('chung.daDoiTrangThai'));
      },
      onError: baoLoi,
    }),
  );
}

// Khuyến mãi

export function useCreateKhuyenMai() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (input: KhuyenMaiInput) => sanPhamApi.createKhuyenMai(input),
      onSuccess: async () => {
        await invalidateAffected(qc, 'khuyenMaiThayDoi');
        toast.ok(t('khuyenMai.daThem'));
      },
      onError: baoLoi,
    }),
  );
}

export function useUpdateKhuyenMai() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { id: string; input: KhuyenMaiInput }) =>
        sanPhamApi.updateKhuyenMai(vars.id, vars.input),
      onSuccess: async () => {
        await invalidateAffected(qc, 'khuyenMaiThayDoi');
        toast.ok(t('khuyenMai.daLuu'));
      },
      onError: baoLoi,
    }),
  );
}

export function useDoiKichHoatKhuyenMai() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { id: string; kichHoat: boolean }) =>
        sanPhamApi.doiKichHoatKhuyenMai(vars.id, vars.kichHoat),
      onSuccess: async (updated: KhuyenMai) => {
        await invalidateAffected(qc, 'khuyenMaiThayDoi');
        toast.ok(updated.kichHoat ? t('khuyenMai.daBat') : t('khuyenMai.daTamDung'));
      },
      onError: baoLoi,
    }),
  );
}
