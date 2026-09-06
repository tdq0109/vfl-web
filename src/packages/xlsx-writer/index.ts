/* Cửa công khai của gói xlsx-writer: dựng tệp .xlsx thật (OOXML tự viết, tự
   đóng gói ZIP), port từ commercial-console.html.

   Màn nghiệp vụ chỉ cần taiVeXlsx() và bangThanhSheet(). */
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
