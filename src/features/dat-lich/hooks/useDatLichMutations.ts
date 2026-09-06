import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import { useBaoLoiGhi } from '@/lib/query/baoLoi';
import { useMotLuot } from '@/lib/query/motLuot';
import { useT } from '@/components/shell/NgonNguProvider';
import { invalidateAffected, keys } from '@/lib/query/keys';
import { datLichApi } from '../api';
import type { Buoi, BuoiInput } from '../types';

/* Toàn bộ logic ghi của nhóm Đặt lịch.

   Mọi thao tác đụng tới chỗ ngồi đều invalidate cả nhánh `dat-lich` chứ không
   chỉ buổi đang mở: đặt/huỷ một chỗ làm số chỗ trống trên lịch tuần đổi theo.

   Toast nhận khoá i18n, và useBuoiMutation mới gọi t() — gọi trong hook
   chứ không ở module scope, nếu không chuỗi bị đóng băng theo ngôn ngữ lúc nạp
   tệp và đổi ngôn ngữ xong vẫn thấy toast tiếng cũ. */

function useBuoiMutation<TVars>(fn: (vars: TVars) => Promise<Buoi>, khoaToast: string) {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: fn,
      onSuccess: async (buoi: Buoi) => {
        qc.setQueryData(keys.datLich.buoi(buoi.id), buoi);
        await invalidateAffected(qc, 'datLichThayDoi');
        toast.ok(t(khoaToast));
      },
      onError: baoLoi,
    }),
  );
}

export function useCreateBuoi() {
  return useBuoiMutation((input: BuoiInput) => datLichApi.create(input), 'datLich.daTaoBuoi');
}

export function useUpdateBuoi() {
  return useBuoiMutation(
    (vars: { id: string; input: BuoiInput }) => datLichApi.update(vars.id, vars.input),
    'datLich.daLuuBuoi',
  );
}

export function useHuyBuoi() {
  return useBuoiMutation((id: string) => datLichApi.huyBuoi(id), 'datLich.daHuyBuoi');
}

export function useGiuCho() {
  return useBuoiMutation(
    (vars: { buoiId: string; hoiVienId: string }) =>
      datLichApi.giuCho(vars.buoiId, vars.hoiVienId),
    'datLich.daGiuCho',
  );
}

export function useChotCho() {
  return useBuoiMutation(
    (vars: { buoiId: string; choId: string }) => datLichApi.chotCho(vars.buoiId, vars.choId),
    'datLich.daChotCho',
  );
}

export function useBoCho() {
  return useBuoiMutation(
    (vars: { buoiId: string; choId: string }) => datLichApi.boCho(vars.buoiId, vars.choId),
    'datLich.daBoCho',
  );
}

export function useVaoHangCho() {
  return useBuoiMutation(
    (vars: { buoiId: string; hoiVienId: string }) =>
      datLichApi.vaoHangCho(vars.buoiId, vars.hoiVienId),
    'datLich.daThemHangCho',
  );
}

export function useRoiHangCho() {
  return useBuoiMutation(
    (vars: { buoiId: string; choDoiId: string }) =>
      datLichApi.roiHangCho(vars.buoiId, vars.choDoiId),
    'datLich.daRoiHangCho',
  );
}
