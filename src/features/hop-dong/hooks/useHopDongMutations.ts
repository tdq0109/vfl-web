import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { useBaoLoiGhi } from '@/lib/query/baoLoi';
import { useMotLuot } from '@/lib/query/motLuot';
import { invalidateAffected, keys } from '@/lib/query/keys';
import { money } from '@/lib/format';
import { hopDongApi } from '../api';
import {
  HANH_DONG_KHOA,
  type ChuyenTrangThaiInput,
  type HopDong,
  type HopDongInput,
  type ThanhToanInput,
} from '../types';

/* Toàn bộ logic ghi của nhóm Hợp đồng. Mọi thao tác đều phát sự kiện banHopDong
   để invalidate hợp đồng, hội viên, công nợ và tổng quan cùng lúc — bán một hợp
   đồng đụng tới cả bốn nhánh.

   Lỗi ProblemDetails không nuốt: màn đọc từ mutation.error để gắn vào ô nhập
   hoặc hiện nguyên câu backend trả về. */

function useLuuVaLamMoi() {
  const qc = useQueryClient();
  return async (hd: HopDong) => {
    qc.setQueryData(keys.hopDong.detail(hd.id), hd);
    await invalidateAffected(qc, 'banHopDong');
  };
}

export function useCreateHopDong() {
  const luu = useLuuVaLamMoi();
  const baoLoi = useBaoLoiGhi();
  const t = useT();
  return useMotLuot(
    useMutation({
      mutationFn: (input: HopDongInput) => hopDongApi.create(input),
      onSuccess: async (hd: HopDong) => {
        await luu(hd);
        toast.ok(t('hopDong.daLapBaoGia', { ma: hd.maHopDong }));
      },
      onError: baoLoi,
    }),
  );
}

export function useUpdateHopDong() {
  const luu = useLuuVaLamMoi();
  const baoLoi = useBaoLoiGhi();
  const t = useT();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { id: string; input: HopDongInput }) =>
        hopDongApi.update(vars.id, vars.input),
      onSuccess: async (hd: HopDong) => {
        await luu(hd);
        toast.ok(t('hopDong.daLuuThayDoi'));
      },
      onError: baoLoi,
    }),
  );
}

/** Một hook cho MỌI bước của máy trạng thái — chốt bán, gửi xác minh, phát
    hành, ký, kích hoạt, huỷ. Thêm bước mới không phải thêm hook. */
export function useChuyenTrangThai() {
  const luu = useLuuVaLamMoi();
  const baoLoi = useBaoLoiGhi();
  const t = useT();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { id: string; input: ChuyenTrangThaiInput }) =>
        hopDongApi.chuyenTrangThai(vars.id, vars.input),
      onSuccess: async (hd: HopDong, vars) => {
        await luu(hd);
        toast.ok(
          t('hopDong.daChuyenBuoc', {
            hanhDong: t(HANH_DONG_KHOA[vars.input.den]),
            ma: hd.maHopDong,
          }),
        );
      },
      onError: baoLoi,
    }),
  );
}

export function useThanhToanHopDong() {
  const luu = useLuuVaLamMoi();
  const baoLoi = useBaoLoiGhi();
  const t = useT();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { id: string; input: ThanhToanInput }) =>
        hopDongApi.thanhToan(vars.id, vars.input),
      onSuccess: async (hd: HopDong, vars) => {
        await luu(hd);
        toast.ok(t('hopDong.daGhiNhan', { soTien: money(vars.input.soTien) }));
      },
      onError: baoLoi,
    }),
  );
}
