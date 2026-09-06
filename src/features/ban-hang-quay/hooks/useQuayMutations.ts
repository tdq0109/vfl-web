import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import { useBaoLoiGhi } from '@/lib/query/baoLoi';
import { useMotLuot } from '@/lib/query/motLuot';
import { useT } from '@/components/shell/NgonNguProvider';
import { invalidateAffected, keys } from '@/lib/query/keys';
import { banHangQuayApi } from '../api';
import { fmtDate, money } from '@/lib/format';
import type {
  BanHangInput,
  CaThuNgan,
  ChotNgay,
  ChotNgayInput,
  ChuyenCaInput,
  DongCaInput,
  KetQuaChuyenCa,
  MoCaInput,
} from '../types';

/* Toàn bộ logic ghi của quầy.

   Mọi thao tác đều làm mới ca đang mở: bán một vé xong thì tiền mặt kỳ vọng
   cuối ca đổi ngay, thu ngân phải thấy con số mới trước khi đếm két.

   Chữ của toast lấy qua useT() bên trong từng hook, không đặt ở useLamMoiCa (nó
   không hiện chữ nào) và không gọi t() ở module scope. */

function useLamMoiCa() {
  const qc = useQueryClient();
  return (locationId: string) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: keys.banHangQuay.caDangMo(locationId) }),
      invalidateAffected(qc, 'banVeQuay'),
    ]);
}

export function useMoCa() {
  const lamMoi = useLamMoiCa();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (input: MoCaInput) => banHangQuayApi.moCa(input),
      onSuccess: async (ca: CaThuNgan) => {
        await lamMoi(ca.locationId);
        toast.ok(t('quay.daMoCa', { maCa: ca.maCa }));
      },
      onError: baoLoi,
    }),
  );
}

export function useDongCa() {
  const lamMoi = useLamMoiCa();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { caId: string; input: DongCaInput }) =>
        banHangQuayApi.dongCa(vars.caId, vars.input),
      onSuccess: async (ca: CaThuNgan) => {
        await lamMoi(ca.locationId);
        toast.ok(t('quay.daDongCa', { maCa: ca.maCa }));
      },
      onError: baoLoi,
    }),
  );
}

export function useBanHang(locationId: string) {
  const lamMoi = useLamMoiCa();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { caId: string; input: BanHangInput }) =>
        banHangQuayApi.banHang(vars.caId, vars.input),
      onSuccess: async () => {
        await lamMoi(locationId);
        toast.ok(t('quay.daThuTien'));
      },
      onError: baoLoi,
    }),
  );
}

export function useHuyGiaoDich(locationId: string) {
  const lamMoi = useLamMoiCa();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { caId: string; giaoDichId: string; lyDo: string }) =>
        banHangQuayApi.huyGiaoDich(vars.caId, vars.giaoDichId, vars.lyDo),
      onSuccess: async () => {
        await lamMoi(locationId);
        toast.ok(t('quay.daHuyGiaoDich'));
      },
      onError: baoLoi,
    }),
  );
}

/** Chuyển ca: chốt ca đang chạy rồi mở ngay ca kế tiếp.

    Toast nói rõ cả hai vế — ca nào vừa chốt, ca nào vừa mở, tiền bàn giao bao
    nhiêu. Chỉ báo "đã chuyển ca" thì người trực không biết mình đang đứng trên
    ca nào và két đang được tính từ con số nào. */
export function useChuyenCa() {
  const lamMoi = useLamMoiCa();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (vars: { caId: string; input: ChuyenCaInput }) =>
        banHangQuayApi.chuyenCa(vars.caId, vars.input),
      onSuccess: async (kq: KetQuaChuyenCa) => {
        await lamMoi(kq.caMoi.locationId);
        toast.ok(
          t('quay.daChuyenCa', {
            maCu: kq.caDaDong.maCa,
            maMoi: kq.caMoi.maCa,
            soTien: money(kq.caMoi.tienDauCa),
          }),
        );
      },
      onError: baoLoi,
    }),
  );
}

/** Chốt ngày: khoá ngày làm việc sau khi nhân viên xác nhận bản tổng kết. */
export function useChotNgay() {
  const qc = useQueryClient();
  const t = useT();
  const baoLoi = useBaoLoiGhi();
  return useMotLuot(
    useMutation({
      mutationFn: (input: ChotNgayInput) => banHangQuayApi.chotNgay(input),
      onSuccess: async (ban: ChotNgay) => {
        await Promise.all([
          qc.invalidateQueries({ queryKey: keys.banHangQuay.all }),
          invalidateAffected(qc, 'banVeQuay'),
        ]);
        toast.ok(t('quay.daChotNgay', { ngay: fmtDate(ban.ngay) }));
      },
      onError: baoLoi,
    }),
  );
}
