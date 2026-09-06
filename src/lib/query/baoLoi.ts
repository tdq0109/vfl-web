import { toast } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { ApiError } from '@/lib/api';

/* Báo cho người dùng biết một thao tác GHI đã bị từ chối.

   🐞 VÌ SAO CÓ TỆP NÀY — lỗi thật, tìm ra bằng cách rà lại toàn bộ nhóm nghiệp
   vụ. Trước đó **24 mutation ở năm nhóm** không có nhánh `onError` nào. Màn chỉ
   hiện `fieldErrors` (lỗi 400 gắn vào từng ô), nên MỌI thứ khác — 403 không đủ
   quyền, 409 dữ liệu đã đổi ở máy khác, 404 bản ghi vừa bị xoá, mất mạng — đều
   rơi vào im lặng: nút hết mờ, hộp thoại đứng nguyên, không một câu nào.

   Đã dựng lại đúng cảnh đó trên app: mở một buổi tập, bỏ chỗ đang giữ bằng lời
   gọi API khác (giả người dùng thứ hai), rồi bấm "Chốt" trên màn đang cầm dữ
   liệu cũ. Backend trả 404 — màn không đổi một chữ. Người ở quầy đọc ra là "bấm
   mà không có gì xảy ra" nên bấm tiếp.

   ⚠ HAI NHÁNH, CỐ Ý TÁCH:

   1. Lỗi có FIELD ERRORS thì IM. Form đã gắn câu lỗi vào đúng ô nhập; toast nữa
      là nói hai lần và kéo mắt người dùng ra khỏi chỗ cần sửa. Xét theo
      `fieldErrors` chứ KHÔNG theo `isValidation`: mock (và .NET) trả cả **409
      kèm `errors`** — ví dụ HLV trùng lịch — mà `isValidation` chỉ đúng với 400.
   2. Còn lại thì toast. Câu của backend (`detail`/`title`) hiện NGUYÊN VĂN vì nó
      mới là chỗ biết chuyện gì hỏng; `ApiError` không mang câu nào thì dịch khoá
      nó giữ; lỗi mạng thì một câu chung — "Failed to fetch" không phải câu cho
      người dùng đọc. */

/** Hàm báo lỗi đã gắn sẵn ngôn ngữ. Gắn vào `onError` của MỌI mutation ghi. */
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
