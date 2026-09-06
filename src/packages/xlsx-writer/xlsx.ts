import { dungZip, type TepZip } from './zip';
import { STYLE, STYLES_XML, THEME_XML, type TenStyle } from './mau-xml';

/* Dựng tệp .xlsx (OOXML tự viết) — hàm thuần, chỉ dựng byte, không chạm DOM.

   Port từ commercial-console.html (VXL). Giữ nguyên lý do bản cũ tự viết:
   SheetJS bản miễn phí không ghi được màu nền / tô đậm khi xuất, mà đó chính là
   thứ tệp mẫu của kế toán cần.

   dungXlsx() trả Uint8Array, còn taiVe.ts lo phần trình duyệt — cùng cách đã
   tách ở signature-pad.

   Năm chỗ đừng gỡ khi sửa:

   1. Tên cột không phải cơ số 26 thông thường. Excel đánh A..Z rồi AA..AZ, hệ
      này không có "chữ số 0" nên phải trừ 1 trước mỗi lần chia. Sai một nhịp là
      cột 27 ra "AZ", và lỗi chỉ lộ ra từ cột 27 trở đi.
   2. Phải thoát ký tự XML. Tên hội viên có & hay < là tệp hỏng hẳn, Excel từ
      chối mở.
   3. Ngày phải là số serial chứ không phải chữ, nếu không Excel canh trái và
      không lọc theo khoảng ngày được. Mốc: 1899-12-30.
   4. Tên sheet dài quá 31 ký tự làm Excel từ chối mở workbook. Bản cũ cắt sẵn
      bằng slice(0,31), giữ nguyên.
   5. Số thứ tự quan hệ (rId) phải khớp danh sách sheet: workbook.xml trỏ tới
      rId1..n, styles và theme là rId(n+1), rId(n+2). Cứng hoá rId2 cho styles
      là workbook từ hai sheet trở lên hỏng. */

export { STYLE };
export type { TenStyle };

/** Giá trị một ô: số, chữ, hoặc trống. */
export type GiaTriO = string | number | null | undefined;

export interface OBang {
  gia: GiaTriO;
  style?: number;
}

/** Một sheet trong workbook. */
export interface SheetXlsx {
  /** Tên tab. Dài quá 31 ký tự sẽ bị cắt — Excel không mở nổi tên dài hơn. */
  ten: string;
  /** Các dòng, mỗi dòng là danh sách ô. Dòng 1 của sheet là `dong[0]`. */
  dong: readonly (readonly OBang[])[];
  /** Độ rộng từng cột, tính theo ký tự. Bỏ trống thì Excel tự canh. */
  rongCot?: readonly number[];
}

// Chuỗi và toạ độ

/* Viết bằng new RegExp thay vì hằng regex /'/g, vì tools/quet-chuoi-viet.mjs
   duyệt từng ký tự và không phân biệt được dấu nháy trong hằng regex với dấu
   nháy mở đầu một chuỗi. Gặp /'/g là nó tưởng chuỗi bắt đầu từ đó rồi nuốt mấy
   chục dòng mã phía sau. */
const NHAY_DON = new RegExp(String.fromCharCode(39), 'g');
const NHAY_KEP = new RegExp(String.fromCharCode(34), 'g');

/** Thoát năm ký tự XML bắt buộc. */
export function thoatXml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(NHAY_KEP, '&quot;')
    .replace(NHAY_DON, '&apos;');
}

/** Tên cột Excel từ chỉ số đếm từ 1: 1→A, 27→AA, 16384→XFD.

    Hệ đánh số này không có "chữ số 0" (bijective base-26) nên phải trừ 1 trước
    mỗi lần lấy dư và chia. Quên trừ là cột 27 ra "AZ". */
export function tenCot(n: number): string {
  let s = '';
  let con = Math.trunc(n);
  while (con > 0) {
    const du = (con - 1) % 26;
    s = String.fromCharCode(65 + du) + s;
    con = Math.floor((con - 1) / 26);
  }
  return s;
}

/** Số serial ngày kiểu Excel từ chuỗi YYYY-MM-DD. null nếu không đúng dạng.

    Mốc là 1899-12-30 chứ không phải 1900-01-01: Excel cố ý giữ lỗi "năm 1900 là
    năm nhuận" của Lotus 1-2-3, và mốc lệch một ngày này bù đúng chỗ đó cho mọi
    ngày từ 1900-03-01 trở đi. Dùng UTC để không dính lệch múi giờ. */
export function ngayThanhSerial(s: unknown): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s ?? ''));
  if (!m) return null;
  const utc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(utc)) return null;
  return Math.round((utc - Date.UTC(1899, 11, 30)) / 86_400_000);
}

// Ô và dòng

/** XML của một ô.

    Số ghi thẳng vào <v> để Excel hiểu là số. Chữ ghi dạng inlineStr chứ không
    dùng sharedStrings.xml — thêm một tệp nữa phải đồng bộ, mà tệp báo cáo không
    đủ lớn để lợi. */
export function oXml(toaDo: string, gia: GiaTriO, style?: number): string {
  const s = style ? ` s="${style}"` : '';
  if (gia === null || gia === undefined || gia === '') return `<c r="${toaDo}"${s}/>`;
  if (typeof gia === 'number' && Number.isFinite(gia)) {
    return `<c r="${toaDo}"${s}><v>${gia}</v></c>`;
  }
  return `<c r="${toaDo}"${s} t="inlineStr"><is><t xml:space="preserve">${thoatXml(gia)}</t></is></c>`;
}

export function dongXml(chiSo: number, o: readonly string[]): string {
  return `<row r="${chiSo}">${o.join('')}</row>`;
}

/** Phạm vi dữ liệu của sheet, ví dụ `A1:D12`. Sheet rỗng vẫn phải có `A1:A1`. */
export function phamVi(soDong: number, soCot: number): string {
  if (soDong < 1 || soCot < 1) return 'A1:A1';
  return `A1:${tenCot(soCot)}${soDong}`;
}

function sheetXml(sheet: SheetXlsx): string {
  const soCot = sheet.dong.reduce((a, d) => Math.max(a, d.length), 0);
  const dongs = sheet.dong
    .map((d, i) =>
      dongXml(
        i + 1,
        d.map((o, c) => oXml(`${tenCot(c + 1)}${i + 1}`, o.gia, o.style)),
      ),
    )
    .join('');

  const cot =
    sheet.rongCot && sheet.rongCot.length > 0
      ? `<cols>${sheet.rongCot
          .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
          .join('')}</cols>`
      : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="${phamVi(sheet.dong.length, soCot)}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/>${cot}<sheetData>${dongs}</sheetData></worksheet>`;
}

/** Excel từ chối mở workbook có tên sheet dài quá 31 ký tự. Cắt như bản cũ:
    mất mấy chữ cuối vẫn hơn không mở được tệp. */
export const DAI_TEN_SHEET_TOI_DA = 31;

export function catTenSheet(ten: string): string {
  return ten.slice(0, DAI_TEN_SHEET_TOI_DA);
}

// Đóng gói workbook

/** Dựng toàn bộ tệp .xlsx. Trả byte — phần tải về nằm ở taiVe.ts. */
export function dungXlsx(sheet: readonly SheetXlsx[]): Uint8Array {
  if (sheet.length === 0) {
    throw new Error('xlsx-writer: workbook phải có ít nhất một sheet.');
  }

  const theSheet = sheet
    .map(
      (s, i) =>
        `<sheet name="${thoatXml(catTenSheet(s.ten))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
    )
    .join('');

  /* Styles và theme đứng sau mọi sheet trong bảng quan hệ. */
  const ridStyles = `rId${sheet.length + 1}`;
  const ridTheme = `rId${sheet.length + 2}`;
  const quanHe =
    sheet
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join('') +
    `<Relationship Id="${ridStyles}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `<Relationship Id="${ridTheme}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>`;

  const ghiDe = sheet
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join('');

  const tep: TepZip[] = [
    {
      ten: '[Content_Types].xml',
      noiDung: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${ghiDe}</Types>`,
    },
    {
      ten: '_rels/.rels',
      noiDung: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      ten: 'xl/workbook.xml',
      noiDung: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="20000" windowHeight="12000"/></bookViews><sheets>${theSheet}</sheets><calcPr calcId="0" fullCalcOnLoad="1"/></workbook>`,
    },
    {
      ten: 'xl/_rels/workbook.xml.rels',
      noiDung: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${quanHe}</Relationships>`,
    },
    { ten: 'xl/styles.xml', noiDung: STYLES_XML },
    { ten: 'xl/theme/theme1.xml', noiDung: THEME_XML },
    ...sheet.map((s, i) => ({
      ten: `xl/worksheets/sheet${i + 1}.xml`,
      noiDung: sheetXml(s),
    })),
  ];

  return dungZip(tep);
}

// Dựng sheet từ bảng thô

/** Dựng một sheet kiểu bảng chung từ mảng hai chiều, dòng đầu là tiêu đề.

    Port ý của buildGenericSheet: cột nào có chữ "ngày" ở tiêu đề thì giá trị
    YYYY-MM-DD được ghi thành ngày thật (số serial + định dạng dd/mm/yyyy) để
    Excel lọc và sắp xếp được. Ô không đúng dạng ISO vẫn giữ chữ. */
export function bangThanhSheet(
  ten: string,
  bang: readonly (readonly GiaTriO[])[],
  rongCot?: readonly number[],
): SheetXlsx {
  const tieuDe = bang[0] ?? [];
  const cotNgay = new Set<number>();
  tieuDe.forEach((h, c) => {
    if (/ngày/i.test(String(h ?? ''))) cotNgay.add(c);
  });

  const dong = bang.map((hang, i) =>
    hang.map<OBang>((gia, c) => {
      if (i === 0) return { gia, style: STYLE.hdrL };
      if (cotNgay.has(c)) {
        const serial = ngayThanhSerial(gia);
        if (serial !== null) return { gia: serial, style: STYLE.cellDate };
      }
      if (typeof gia === 'number') return { gia, style: STYLE.cellNum };
      return { gia, style: STYLE.cellText };
    }),
  );

  return { ten, dong, ...(rongCot ? { rongCot } : {}) };
}
