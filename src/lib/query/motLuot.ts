import { useCallback, useRef } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';

/* Một loạt bấm liên tiếp chỉ được ghi một lần.

   Lỗi tiền, dựng lại được trên app: ở quầy bỏ một mặt hàng 50.000 ₫ vào giỏ rồi
   bấm nút Thu ba lần thật nhanh, mock ghi nhận ba giao dịch 50.000 ₫. Khách trả
   một lần, sổ quầy có ba.

   Mọi nút ghi đều đã viết disabled={… || submitting}, đúng ý nhưng không đủ:
   submitting là mutation.isPending và nó chỉ bật lên sau khi React vẽ lại,
   những cú bấm rơi vào khoảng giữa đi lọt hết. Ở quầy khoảng đó không hiếm —
   máy chậm, và thu ngân đã quen bấm lại khi màn chưa phản hồi.

   Khoá tới khung hình kế tiếp chứ không phải một khoảng thời gian tự đặt: khoá
   này chỉ che đúng cái khe trước lần vẽ lại, vẽ xong thì disabled={submitting}
   tiếp quản. Khoá lâu hơn là chặn cả lần bấm lại hợp lệ sau khi thao tác thất
   bại.

   Đừng thay bằng debounce: debounce làm trễ lời gọi đầu tiên, mà ở quầy thì lần
   bấm đầu phải đi ngay, chỉ những lần thừa mới bị bỏ. */

/** Chạy nha ở khung hình kế tiếp; lùi về macrotask khi không có rAF. */
function khungHinhKeTiep(nha: () => void): void {
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(nha);
  else setTimeout(nha, 0);
}

/** Bọc một mutation để mutate bỏ qua những cú gọi trùng trong cùng một loạt.

    Dùng ở mọi hook ghi: return motLuot(useMutation({ … })). mutateAsync giữ
    nguyên vì nó dành cho chỗ gọi cần chờ kết quả, và những chỗ đó tự quản. */
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
