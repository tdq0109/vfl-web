import { normalize } from '@/lib/format/text';

/* VietQR / NAPAS — dựng chuỗi payload cho mã QR chuyển khoản. HÀM THUẦN.

   Port từ `commercial-console.html` ~12025–12042 (`_tlv`, `_crc16`,
   `vietQRString`, danh sách `BANKS`).

   ⚠ ĐÂY LÀ CHỖ TIỀN CHẠY QUA, và khác mọi chỗ khác ở một điểm: SAI Ở ĐÂY THÌ
   FRONTEND LÀ NƠI GÂY RA THIỆT HẠI, không phải backend. Mọi màn khác chỉ chặn
   sớm rồi để .NET kiểm lại; còn chuỗi này đi thẳng vào ứng dụng ngân hàng của
   khách qua ống kính camera — không có ai kiểm lại sau lưng. Sai một ký tự là
   khách chuyển nhầm số tiền, hoặc nhầm tài khoản.

   Vì vậy module này KHÔNG chấp nhận dữ liệu mập mờ: gặp thứ không dựng được thì
   ném lỗi hoặc trả câu lý do, tuyệt đối không "cố dựng ra một chuỗi gì đó".

   Chuẩn: EMVCo Merchant Presented QR + hồ sơ VietQR của NAPAS.

   ⚠ BẢY CÁI BẪY, đừng gỡ cái nào khi sửa hàm này:

   1. SAI BIẾN THỂ CRC. Có hàng chục biến thể CRC-16. VietQR dùng CCITT-FALSE
      (đa thức 0x1021, khởi tạo 0xFFFF, KHÔNG đảo bit, KHÔNG XOR đầu ra). Dùng
      nhầm biến thể vẫn ra 4 ký tự hex trông rất hợp lệ, và ứng dụng ngân hàng
      từ chối mã với thông báo chung chung.
   2. CRC PHẢI TÍNH TRÊN CẢ '6304'. Bốn ký tự tiêu đề của chính trường CRC nằm
      TRONG phần dữ liệu được tính. Đây là lỗi kinh điển của mọi bản tự viết.
   3. ĐỘ DÀI TLV LÀ HAI CHỮ SỐ. Giá trị dài từ 100 ký tự trở lên không biểu diễn
      được — phải NÉM, vì cắt bớt cho vừa nghĩa là đổi số tài khoản hoặc đổi nội
      dung chuyển khoản mà không báo ai.
   4. CÓ SỐ TIỀN vs KHÔNG CÓ SỐ TIỀN là hai loại mã khác nhau. Trường 01 phải là
      '12' (một lần, số tiền cố định) khi có tiền và '11' (tĩnh) khi không. Ghi
      nhầm thành '11' mà vẫn kèm số tiền thì nhiều ứng dụng cho khách SỬA số
      tiền — thu 12 triệu thành 12 nghìn.
   5. DẤU TIẾNG VIỆT LÀM LỆCH ĐỘ DÀI. Độ dài trong TLV là số BYTE, còn
      `chuoi.length` của JavaScript đếm đơn vị mã UTF-16. "Nguyễn" dài 6 theo
      JS nhưng 7 byte khi mã hoá UTF-8 — ngân hàng đọc lệch một byte là hỏng
      toàn bộ phần đuôi chuỗi, gồm cả CRC. Bản cũ `substring(0,25)` thẳng vào
      nội dung có dấu nên dính đúng bẫy này.
   6. SỐ TIỀN PHẢI LÀ SỐ NGUYÊN ĐỒNG DƯƠNG. VND không có phần lẻ. Số âm, NaN,
      Infinity hay 1e21 (ra ký hiệu mũ khi đổi sang chuỗi) đều phải bị chặn.
   7. SỐ TÀI KHOẢN PHẢI SẠCH. Người nhập hay gõ kèm dấu cách hoặc gạch nối. Bản
      cũ chỉ bỏ dấu cách ở tầng giao diện, còn hàm dựng chuỗi thì không — gọi
      thẳng hàm là ra mã trỏ vào một số tài khoản không tồn tại. */

/* ── Hằng của chuẩn ──────────────────────────────────────────────────────── */

/** Mã định danh của NAPAS trong trường 38. */
const GUID_NAPAS = 'A000000727';
/** Chuyển khoản ĐẾN SỐ TÀI KHOẢN (khác `QRIBFTTC` — đến số thẻ). */
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
/** Mã một lần — số tiền đã cố định trong mã. Xem bẫy 4. */
const KHOI_TAO_MOT_LAN = '12';

/** Nội dung chuyển khoản dài quá thì ngân hàng tự cắt; cắt sẵn cho biết trước. */
export const DO_DAI_NOI_DUNG_TOI_DA = 25;

/** Độ dài lớn nhất một trường TLV biểu diễn được — hai chữ số. Xem bẫy 3. */
export const DO_DAI_TLV_TOI_DA = 99;

/* ── Danh sách ngân hàng ─────────────────────────────────────────────────── */

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

/* ── TLV ─────────────────────────────────────────────────────────────────── */

/** Một trường EMVCo: mã 2 ký tự + độ dài 2 chữ số + giá trị.

    BẪY 3 và BẪY 5 — NÉM chứ không cắt, và chỉ nhận ASCII. Độ dài phải là số
    BYTE; ép ASCII làm cho "số ký tự" và "số byte" bằng nhau, nên bất biến này
    được giữ ngay tại chỗ thay vì tin vào lời hứa của chỗ gọi. */
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

/** Đọc ngược một chuỗi TLV. Dùng để KIỂM chuỗi vừa dựng — đọc lại được đúng
    từng trường là bằng chứng mạnh hơn nhiều so với so chuỗi với một hằng số
    chép tay. Trả mảng rỗng nếu chuỗi hỏng. */
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

/* ── CRC ─────────────────────────────────────────────────────────────────── */

/** CRC-16/CCITT-FALSE, trả 4 ký tự hex viết hoa.

    BẪY 1 — đa thức 0x1021, khởi tạo 0xFFFF, KHÔNG đảo bit vào/ra, KHÔNG XOR
    đầu ra. Giá trị kiểm chuẩn của biến thể này: chuỗi "123456789" ra `29B1` —
    test dùng đúng con số đó làm mốc đối chiếu ngoài, thay vì so với chính kết
    quả của hàm này. */
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

/* ── Nội dung chuyển khoản ───────────────────────────────────────────────── */

/** Đưa nội dung chuyển khoản về ASCII in hoa, cắt còn `DO_DAI_NOI_DUNG_TOI_DA`.

    BẪY 5 — bỏ dấu tiếng Việt là BẮT BUỘC, không phải cho đẹp: độ dài trong TLV
    tính theo byte, mà chữ có dấu chiếm nhiều byte hơn số ký tự JavaScript đếm
    được. Dùng lại `normalize()` của `lib/format/text` để phần bỏ dấu chỉ nằm ở
    một chỗ, rồi viết hoa cho hợp thói quen sao kê ngân hàng.

    Ký tự lạ (chữ Hán, emoji, xuống dòng) đổi thành dấu cách rồi gộp lại — thà
    mất một ký tự trong nội dung còn hơn hỏng cả chuỗi. */
export function chuanHoaNoiDung(noiDung: string): string {
  return normalize(noiDung)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, DO_DAI_NOI_DUNG_TOI_DA)
    .trim();
}

/** Bỏ dấu cách, gạch nối, chấm — thứ người ta hay gõ kèm số tài khoản. BẪY 7. */
export function chuanHoaSoTaiKhoan(soTaiKhoan: string): string {
  return soTaiKhoan.replace(/[\s.\-]/g, '');
}

/* ── Dựng chuỗi ──────────────────────────────────────────────────────────── */

export interface ThongTinChuyenKhoan {
  /** BIN 6 chữ số của ngân hàng nhận. */
  bin: string;
  soTaiKhoan: string;
  /** Bỏ trống = mã TĨNH, người trả tự nhập số tiền. Xem bẫy 4. */
  soTien?: number;
  noiDung?: string;
}

/** Vì sao chưa dựng được mã QR — `null` nghĩa là dựng được.

    Trả LÝ DO, cùng lối với `viSaoKhongChuyenDuoc()` của nhóm Hợp đồng: ở quầy mà
    thấy một ô trống không nói gì thì không ai biết phải sửa chỗ nào.

    ⚠ Trả KHOÁ i18n, không trả câu tiếng Việt — màn gọi `t(lyDo)`. Hàm thuần
    không biết ngôn ngữ hiện hành; gọi `t()` ở tầng này là đóng băng chuỗi theo
    ngôn ngữ lúc nạp tệp. Ở đây khoá TRẦN là đủ vì không nhánh nào có chỗ điền,
    khác `signature-pad/chu-ky.ts` (dùng `LyDo` vì có nhánh mang con số). */
export function viSaoKhongTaoDuocQR(tt: ThongTinChuyenKhoan): string | null {
  if (!/^\d{6}$/.test(tt.bin)) {
    return 'vietqr.loi.chuaChonNganHang';
  }
  const stk = chuanHoaSoTaiKhoan(tt.soTaiKhoan ?? '');
  if (!stk) return 'vietqr.loi.chuaCoSoTaiKhoan';
  if (!/^[0-9A-Za-z]{4,30}$/.test(stk)) {
    return 'vietqr.loi.soTaiKhoanSai';
  }

  /* BẪY 6 — chặn trước khi đổi sang chuỗi. `String(1e21)` ra "1e+21", và ngân
     hàng đọc được đúng một chữ số 1. */
  if (tt.soTien !== undefined) {
    if (!Number.isFinite(tt.soTien)) return 'vietqr.loi.soTienKhongHopLe';
    if (!Number.isInteger(tt.soTien)) return 'vietqr.loi.soTienPhaiNguyen';
    if (tt.soTien <= 0) return 'vietqr.loi.soTienPhaiDuong';
    if (tt.soTien > 999_999_999_999) return 'vietqr.loi.soTienVuotMuc';
  }
  return null;
}

/** Chuỗi payload để vẽ thành mã QR VietQR.

    Ném nếu `viSaoKhongTaoDuocQR()` khác `null` — xem ghi chú ở đầu tệp về việc
    module này không dựng bừa. Chỗ gọi phải hỏi trước rồi mới dựng.

    Thông điệp của lỗi ném ra mang KHOÁ (`VietQR: vietqr.loi.chuaCoSoTaiKhoan`),
    không phải câu đã dịch: đây là lỗi lập trình — chỗ gọi quên hỏi trước — nên
    người đọc nó là lập trình viên, và khoá chỉ thẳng ra nhánh nào đã chặn. */
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
    /* BẪY 4 — '12' khi mã đã khoá số tiền, '11' khi để người trả tự nhập. */
    tlv(ID_KIEU_KHOI_TAO, coTien ? KHOI_TAO_MOT_LAN : KHOI_TAO_TINH) +
    tlv(ID_THONG_TIN_NHAN, thongTinNhan) +
    tlv(ID_TIEN_TE, TIEN_TE_VND) +
    (coTien ? tlv(ID_SO_TIEN, String(tt.soTien)) : '') +
    tlv(ID_QUOC_GIA, QUOC_GIA) +
    (noiDung ? tlv(ID_BO_SUNG, tlv(ID_NOI_DUNG, noiDung)) : '');

  /* BẪY 2 — '6304' là mã trường CRC (63) kèm độ dài (04). Bốn ký tự này nằm
     TRONG phần được tính CRC. */
  s += '6304';
  return s + crc16(s);
}

/** Kiểm một chuỗi VietQR có nguyên vẹn không — đọc lại được TLV và CRC khớp.

    Dùng ở chỗ gọi như một cái chốt cuối trước khi vẽ ra màn hình: mã hỏng thì
    thà không hiện còn hơn hiện ra để khách quét. */
export function chuoiVietQRHopLe(s: string): boolean {
  if (s.length < 8) return false;
  const than = s.slice(0, -4);
  if (!than.endsWith('6304')) return false;
  if (crc16(than) !== s.slice(-4)) return false;
  return docTLV(s).length > 0;
}
