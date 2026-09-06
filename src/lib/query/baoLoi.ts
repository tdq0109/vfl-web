import { toast } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { ApiError } from '@/lib/api';

/* Báo cho người dùng biết một thao tác ghi đã bị từ chối.

   Trước đó 24 mutation ở năm nhóm không có nhánh onError nào. Màn chỉ hiện
   fieldErrors (lỗi 400 gắn vào từng ô), nên mọi thứ khác — 403 không đủ quyền,
   409 dữ liệu đã đổi ở máy khác, 404 bản ghi vừa bị xoá, mất mạng — đều rơi vào
   im lặng: nút hết mờ, hộp thoại đứng nguyên, không một câu nào. Người ở quầy
   đọc ra là "bấm mà không có gì xảy ra" nên bấm tiếp.

   Hai nhánh, cố ý tách:

   1. Lỗi có fieldErrors thì im. Form đã gắn câu lỗi vào đúng ô nhập, toast nữa
      là nói hai lần và kéo mắt người dùng ra khỏi chỗ cần sửa. Xét theo
      fieldErrors chứ không theo isValidation: mock và .NET trả cả 409 kèm
      errors (ví dụ HLV trùng lịch) mà isValidation chỉ đúng với 400.
   2. Còn lại thì toast. Câu của backend (detail/title) hiện nguyên văn vì nó
      mới là chỗ biết chuyện gì hỏng; ApiError không mang câu nào thì dịch khoá
      nó giữ; lỗi mạng thì một câu chung, "Failed to fetch" không phải câu cho
      người dùng đọc. */

/** Hàm báo lỗi đã gắn sẵn ngôn ngữ. Gắn vào onError của mọi mutation ghi. */
export function useBaoLoiGhi(): (err: unknown) => void {
  const t = useT();
  return (err: unknown) => {
    if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) return;
    toast.error(
      err instanceof ApiError
        ? err.khoaThongDiep
          ? t(err.khoaThongDiep, { ma: err.status })
          : err.message
        : t('loi.khongLuuDuoc'),
    );
  };
}
