/* Cửa công khai của gói `xlsx-writer`.

   Dựng tệp .xlsx "thật" (OOXML tự viết, tự đóng gói ZIP) — port từ
   `commercial-console.html`, xem mục 8 của tài liệu bàn giao.

   Màn nghiệp vụ chỉ cần `taiVeXlsx()` và `bangThanhSheet()`; phần còn lại xuất
   ra cho test và cho những màn cần dựng sheet thủ công. */
export { dungZip, crc32, type TepZip } from './zip';
export {
  DAI_TEN_SHEET_TOI_DA,
  STYLE,
  bangThanhSheet,
  catTenSheet,
  dungXlsx,
  ngayThanhSerial,
  phamVi,
  tenCot,
  thoatXml,
  type GiaTriO,
  type OBang,
  type SheetXlsx,
  type TenStyle,
} from './xlsx';
export { MIME_XLSX, taiVeXlsx } from './taiVe';
