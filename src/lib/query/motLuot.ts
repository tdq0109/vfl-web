import { useCallback, useRef } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';

/* Một LOẠT bấm liên tiếp chỉ được ghi MỘT lần.

   🐞 VÌ SAO CÓ TỆP NÀY — lỗi TIỀN, dựng lại được trên app đang chạy. Ở quầy: bỏ
   một mặt hàng 50.000 ₫ vào giỏ rồi bấm nút "Thu" ba lần thật nhanh → mock ghi
   nhận **ba giao dịch** 50.000 ₫. Khách trả một lần, sổ quầy có ba.

   Mọi nút ghi trong dự án đều đã viết `disabled={… || submitting}` — đúng ý,
   nhưng KHÔNG ĐỦ: `submitting` là `mutation.isPending`, và nó chỉ bật lên SAU
   khi React vẽ lại. Những cú bấm rơi vào khoảng giữa "bấm lần đầu" và "vẽ xong"
   đi lọt hết. Ở quầy khoảng đó không hề hiếm: máy chậm, và người thu ngân đã
   quen bấm lại khi màn chưa phản hồi.

   ⚠ VÌ SAO KHOÁ TỚI KHUNG HÌNH KẾ TIẾP, không phải một khoảng thời gian tự đặt:
   khoá này chỉ có nhiệm vụ che ĐÚNG cái khe trước lần vẽ lại. Vẽ xong thì
   `disabled={submitting}` tiếp quản và giữ cho tới lúc mutation xong. Khoá lâu
   hơn là chặn cả lần bấm lại HỢP LỆ sau khi thao tác thất bại — người dùng bấm
   "Thu" lần nữa vì lần đầu mất mạng thì phải cho đi.

   ⚠ ĐỪNG thay bằng debounce. Debounce làm TRỄ lời gọi đầu tiên; ở quầy thì lần
   bấm đầu phải đi ngay, chỉ những lần thừa mới bị bỏ. */

/** Chạy `nha` ở khung hình kế tiếp; lùi về macrotask khi không có rAF (node). */
function khungHinhKeTiep(nha: () => void): void {
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(nha);
  else setTimeout(nha, 0);
}

/** Bọc một mutation để `mutate` bỏ qua những cú gọi trùng trong cùng một loạt.

    Dùng ở MỌI hook ghi: `return motLuot(useMutation({ … }))`. `mutateAsync` giữ
    nguyên — nó dành cho chỗ gọi cần chờ kết quả, và những chỗ đó tự quản. */
export function useMotLuot<TData, TError, TVars, TCtx>(
  mut: UseMutationResult<TData, TError, TVars, TCtx>,
): UseMutationResult<TData, TError, TVars, TCtx> {
  const khoa = useRef(false);
  const goc = mut.mutate;

  const mutate = useCallback<typeof goc>(
    (...args) => {
      if (khoa.current) return;
      khoa.current = true;
      khungHinhKeTiep(() => {
        khoa.current = false;
      });
      goc(...args);
    },
    [goc],
  );

  return { ...mut, mutate };
}
