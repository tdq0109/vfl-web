import { normalize } from '@/lib/format/text';

/* VietQR / NAPAS — dựng chuỗi payload cho mã QR chuyển khoản.
   Port từ commercial-console.html (_tlv, _crc16, vietQRString, BANKS).

   Chuỗi này đi thẳng vào app ngân hàng của khách qua camera, không ai kiểm lại
   phía sau, nên gặp dữ liệu không dựng được thì ném lỗi chứ đừng cố dựng ra một
   chuỗi gì đó.

   Chuẩn EMVCo Merchant Presented QR + hồ sơ VietQR của NAPAS. Mấy chỗ dễ sai:
   - CRC là CCITT-FALSE (0x1021, init 0xFFFF, không đảo bit, không XOR đầu ra),
     và tính trên cả '6304' của chính trường CRC.
   - Độ dài TLV hai chữ số, đếm theo byte UTF-8 chứ không phải length của JS.
   - Trường 01 là '12' khi mã khoá số tiền, '11' khi để người trả tự nhập. */

// Hằng của chuẩn

/** Mã định danh của NAPAS trong trường 38. */
const GUID_NAPAS = 'A000000727';
/** Chuyển khoản đến số tài khoản (khác QRIBFTTC — đến số thẻ). */
const DICH_VU_CHUYEN_KHOAN = 'QRIBFTTA';
const TIEN_TE_VND = '704';
const QUOC_GIA = 'VN';

const ID_PHIEN_BAN = '00';
const ID_KIEU_KHOI_TAO = '01';
const ID_THONG_TIN_NHAN = '38';
const ID_TIEN_TE = '53';
const ID_SO_TIEN = '54';
const ID_QUOC_GIA = '58';
const ID_BO_SUNG = '62';
const ID_NOI_DUNG = '08';

/** Mã tĩnh — người trả tự nhập số tiền. */
const KHOI_TAO_TINH = '11';
/** Mã một lần — số tiền đã cố định trong mã. */
const KHOI_TAO_MOT_LAN = '12';

/** Nội dung chuyển khoản dài quá thì ngân hàng tự cắt; cắt sẵn cho biết trước. */
export const DO_DAI_NOI_DUNG_TOI_DA = 25;

/** Độ dài lớn nhất một trường TLV biểu diễn được — hai chữ số. */
export const DO_DAI_TLV_TOI_DA = 99;

// Danh sách ngân hàng

export interface NganHang {
  /** Mã BIN 6 chữ số do NAPAS cấp. */
  bin: string;
  ten: string;
}

/** Giữ đúng danh sách của bản cũ. Thêm ngân hàng thì thêm ở đây — BIN phải tra
    từ bảng của NAPAS, đừng đoán. */
export const NGAN_HANG: readonly NganHang[] = [
  { bin: '970436', ten: 'Vietcombank' },
  { bin: '970407', ten: 'Techcombank' },
  { bin: '970422', ten: 'MB Bank' },
  { bin: '970416', ten: 'ACB' },
  { bin: '970418', ten: 'BIDV' },
  { bin: '970415', ten: 'VietinBank' },
  { bin: '970432', ten: 'VPBank' },
  { bin: '970423', ten: 'TPBank' },
  { bin: '970403', ten: 'Sacombank' },
  { bin: '970405', ten: 'Agribank' },
  { bin: '970448', ten: 'OCB' },
  { bin: '970443', ten: 'SHB' },
  { bin: '970426', ten: 'MSB' },
  { bin: '970441', ten: 'VIB' },
  { bin: '970431', ten: 'Eximbank' },
];

export function timNganHang(bin: string): NganHang | undefined {
  return NGAN_HANG.find((n) => n.bin === bin);
}

/** Tên ngân hàng để hiện lên màn; BIN lạ thì trả chính nó, không mất thông tin. */
export function tenNganHang(bin: string): string {
  return timNganHang(bin)?.ten ?? bin;
}

// TLV

/** Một trường EMVCo: mã 2 ký tự + độ dài 2 chữ số + giá trị.

    Ném khi giá trị dài quá 99 hoặc có ký tự ngoài ASCII. Ép ASCII ngay ở đây
    để "số ký tự" và "số byte" luôn bằng nhau, thay vì tin chỗ gọi đã lo. */
export function tlv(id: string, giaTri: string): string {
  if (!/^\d{2}$/.test(id)) {
    throw new Error(`VietQR: mã trường phải là 2 chữ số, nhận "${id}".`);
  }
  if (!laAscii(giaTri)) {
    throw new Error(`VietQR: trường ${id} có ký tự ngoài ASCII — độ dài TLV sẽ lệch.`);
  }
  if (giaTri.length > DO_DAI_TLV_TOI_DA) {
    throw new Error(
      `VietQR: trường ${id} dài ${giaTri.length} ký tự, vượt mức ${DO_DAI_TLV_TOI_DA}.`,
    );
  }
  return id + String(giaTri.length).padStart(2, '0') + giaTri;
}

/** Ký tự in được trong bảng ASCII (0x20–0x7E). */
function laAscii(s: string): boolean {
  for (let i = 0; i < s.length; i += 1) {
    const m = s.charCodeAt(i);
    if (m < 0x20 || m > 0x7e) return false;
  }
  return true;
}

export interface TruongTLV {
  id: string;
  giaTri: string;
}

/** Đọc ngược một chuỗi TLV, dùng để kiểm lại chuỗi vừa dựng. Trả mảng rỗng
    nếu chuỗi hỏng. */
export function docTLV(s: string): TruongTLV[] {
  const truong: TruongTLV[] = [];
  let i = 0;
  while (i + 4 <= s.length) {
    const id = s.slice(i, i + 2);
    const doDai = Number(s.slice(i + 2, i + 4));
    if (!Number.isInteger(doDai) || doDai < 0) return [];
    const giaTri = s.slice(i + 4, i + 4 + doDai);
    if (giaTri.length !== doDai) return [];
    truong.push({ id, giaTri });
    i += 4 + doDai;
  }
  return i === s.length ? truong : [];
}

/** Giá trị của một trường trong chuỗi TLV, `null` nếu không có. */
export function truong(s: string, id: string): string | null {
  return docTLV(s).find((t) => t.id === id)?.giaTri ?? null;
}

// CRC

/** CRC-16/CCITT-FALSE, trả 4 ký tự hex viết hoa.

    Đa thức 0x1021, khởi tạo 0xFFFF, không đảo bit vào/ra, không XOR đầu ra.
    Mốc kiểm của biến thể này: "123456789" ra 29B1. */
export function crc16(s: string): string {
  let c = 0xffff;
  for (let i = 0; i < s.length; i += 1) {
    c ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j += 1) {
      c = (c & 0x8000) !== 0 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
    }
  }
  return c.toString(16).toUpperCase().padStart(4, '0');
}

// Nội dung chuyển khoản

/** Đưa nội dung chuyển khoản về ASCII in hoa, cắt còn DO_DAI_NOI_DUNG_TOI_DA.

    Bỏ dấu là bắt buộc chứ không phải cho đẹp: độ dài TLV tính theo byte, chữ có
    dấu chiếm nhiều byte hơn số ký tự JS đếm được. Ký tự lạ đổi thành dấu cách
    rồi gộp lại — thà mất một ký tự còn hơn hỏng cả chuỗi. */
export function chuanHoaNoiDung(noiDung: string): string {
  return normalize(noiDung)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, DO_DAI_NOI_DUNG_TOI_DA)
    .trim();
}

/** Bỏ dấu cách, gạch nối, chấm — thứ người ta hay gõ kèm số tài khoản. */
export function chuanHoaSoTaiKhoan(soTaiKhoan: string): string {
  return soTaiKhoan.replace(/[\s.\-]/g, '');
}

// Dựng chuỗi

export interface ThongTinChuyenKhoan {
  /** BIN 6 chữ số của ngân hàng nhận. */
  bin: string;
  soTaiKhoan: string;
  /** Bỏ trống = mã tĩnh, người trả tự nhập số tiền. */
  soTien?: number;
  noiDung?: string;
}

/** Vì sao chưa dựng được mã QR — null nghĩa là dựng được. Trả khoá i18n chứ
    không trả câu tiếng Việt; ở quầy mà thấy một ô trống không nói gì thì không
    ai biết phải sửa chỗ nào. */
export function viSaoKhongTaoDuocQR(tt: ThongTinChuyenKhoan): string | null {
  if (!/^\d{6}$/.test(tt.bin)) {
    return 'vietqr.loi.chuaChonNganHang';
  }
  const stk = chuanHoaSoTaiKhoan(tt.soTaiKhoan ?? '');
  if (!stk) return 'vietqr.loi.chuaCoSoTaiKhoan';
  if (!/^[0-9A-Za-z]{4,30}$/.test(stk)) {
    return 'vietqr.loi.soTaiKhoanSai';
  }

  /* Chặn trước khi đổi sang chuỗi: String(1e21) ra "1e+21", ngân hàng đọc
     được đúng chữ số 1. */
  if (tt.soTien !== undefined) {
    if (!Number.isFinite(tt.soTien)) return 'vietqr.loi.soTienKhongHopLe';
    if (!Number.isInteger(tt.soTien)) return 'vietqr.loi.soTienPhaiNguyen';
    if (tt.soTien <= 0) return 'vietqr.loi.soTienPhaiDuong';
    if (tt.soTien > 999_999_999_999) return 'vietqr.loi.soTienVuotMuc';
  }
  return null;
}

/** Chuỗi payload để vẽ thành mã QR VietQR.

    Ném nếu viSaoKhongTaoDuocQR() khác null — chỗ gọi phải hỏi trước rồi mới
    dựng. Lỗi ném ra mang khoá chứ không phải câu đã dịch, vì người đọc nó là
    lập trình viên và khoá chỉ thẳng ra nhánh nào đã chặn. */
export function chuoiVietQR(tt: ThongTinChuyenKhoan): string {
  const lyDo = viSaoKhongTaoDuocQR(tt);
  if (lyDo) throw new Error(`VietQR: ${lyDo}`);

  const soTaiKhoan = chuanHoaSoTaiKhoan(tt.soTaiKhoan);

  /* Trường 38 lồng ba tầng: GUID của NAPAS · (BIN + số tài khoản) · mã dịch vụ. */
  const beNhan = tlv(ID_PHIEN_BAN, tt.bin) + tlv(ID_KIEU_KHOI_TAO, soTaiKhoan);
  const thongTinNhan =
    tlv(ID_PHIEN_BAN, GUID_NAPAS) +
    tlv(ID_KIEU_KHOI_TAO, beNhan) +
    tlv('02', DICH_VU_CHUYEN_KHOAN);

  const coTien = tt.soTien !== undefined;
  const noiDung = tt.noiDung ? chuanHoaNoiDung(tt.noiDung) : '';

  let s =
    tlv(ID_PHIEN_BAN, '01') +
    /* '12' khi mã đã khoá số tiền, '11' khi để người trả tự nhập. */
    tlv(ID_KIEU_KHOI_TAO, coTien ? KHOI_TAO_MOT_LAN : KHOI_TAO_TINH) +
    tlv(ID_THONG_TIN_NHAN, thongTinNhan) +
    tlv(ID_TIEN_TE, TIEN_TE_VND) +
    (coTien ? tlv(ID_SO_TIEN, String(tt.soTien)) : '') +
    tlv(ID_QUOC_GIA, QUOC_GIA) +
    (noiDung ? tlv(ID_BO_SUNG, tlv(ID_NOI_DUNG, noiDung)) : '');

  /* '6304' là mã trường CRC (63) kèm độ dài (04). Bốn ký tự này nằm trong
     phần được tính CRC. */
  s += '6304';
  return s + crc16(s);
}

/** Kiểm một chuỗi VietQR có nguyên vẹn không — đọc lại được TLV và CRC khớp.
    Mã hỏng thì thà không hiện, còn hơn hiện ra cho khách quét. */
export function chuoiVietQRHopLe(s: string): boolean {
  if (s.length < 8) return false;
  const than = s.slice(0, -4);
  if (!than.endsWith('6304')) return false;
  if (crc16(than) !== s.slice(-4)) return false;
  return docTLV(s).length > 0;
}
