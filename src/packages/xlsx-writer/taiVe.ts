import { dungXlsx, type SheetXlsx } from './xlsx';

/* Phần CHẠM TRÌNH DUYỆT của gói — mỏng nhất có thể.

   Mọi phép dựng byte nằm ở `xlsx.ts` và `zip.ts`, đều là hàm thuần có test. Ở
   đây chỉ còn ba việc không test bằng node được: dựng `Blob`, tạo thẻ `<a>`, và
   thu hồi URL. Bản cũ trộn cả ba với phần dựng XML trong một hàm nên không thử
   được gì — đây đúng là chỗ tách ra, cùng cách `signature-pad` tách phần canvas.

   ⚠ PHẢI THU HỒI `objectURL`. Mỗi lần xuất mà không gọi `revokeObjectURL` là giữ
   lại nguyên tệp trong bộ nhớ tab cho tới khi tải lại trang. Quầy xuất báo cáo
   cả ngày trên một tab thì đó là rò rỉ thật. */

/** Kiểu MIME chính thức của .xlsx. Sai kiểu thì một số trình duyệt đổi đuôi tệp. */
export const MIME_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Dựng workbook rồi đẩy cho trình duyệt tải về.

    `tenTep` nên kèm đuôi `.xlsx`; không có thì tự thêm. */
export function taiVeXlsx(sheet: readonly SheetXlsx[], tenTep: string): void {
  const byte = dungXlsx(sheet);
  const ten = tenTep.toLowerCase().endsWith('.xlsx') ? tenTep : `${tenTep}.xlsx`;

  /* `Blob` nhận `Uint8Array` trực tiếp; không sao chép thêm lần nào. */
  const blob = new Blob([byte as BlobPart], { type: MIME_XLSX });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ten;
  document.body.appendChild(a);
  a.click();

  /* Thu hồi SAU một nhịp: gọi ngay lập tức thì Safari huỷ mất lượt tải. */
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1500);
}
