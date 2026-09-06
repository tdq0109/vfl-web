/* Đóng gói ZIP (PKZIP, phương thức STORE = không nén) — HÀM THUẦN.

   Port từ `commercial-console.html` ~3684–3754 (`crc32`, `u16`, `u32`,
   `buildZip`). Đây là nền của `xlsx-writer`: một tệp .xlsx chỉ là một ZIP chứa
   mấy tệp XML.

   ⚠ VÌ SAO TỰ VIẾT thay vì dùng thư viện: giữ nguyên lý do của bản cũ — bỏ hẳn
   phụ thuộc mạng lúc xuất tệp, và tự kiểm soát từng byte để tránh ca Excel báo
   "found a problem with content" vì lệch chuẩn đóng gói. Dự án hiện có ĐÚNG MỘT
   phụ thuộc lúc chạy (`qrcode-generator`); thêm một thư viện ZIP chỉ để ghép vài
   tệp XML là đổi một hàm 40 dòng lấy vài trăm KB.

   ⚠ KHÁC BẢN CŨ MỘT CHỖ, CÓ CHỦ Ý: bản cũ trả về `Blob` — thứ chỉ có trong
   trình duyệt, nên không test được ở node và cũng không dùng lại được phía
   server. Ở đây trả `Uint8Array`; phần dựng `Blob` và tải về nằm ở `taiVe.ts`.

   ⚠ BỐN CÁI BẪY, đừng gỡ cái nào khi sửa hàm này:

   1. SAI BIẾN THỂ CRC. ZIP dùng CRC-32/ISO-HDLC (đa thức đảo 0xEDB88320, khởi
      tạo 0xFFFFFFFF, XOR đầu ra 0xFFFFFFFF). Dùng nhầm biến thể vẫn ra 4 byte
      trông rất hợp lệ, và Excel từ chối tệp với thông báo chung chung. Test đối
      chiếu với `zlib.crc32` của Node — MỐC NGOÀI, không phải với chính hàm này.
   2. TRÀN SỐ 32 BIT. `>>> 0` ở cuối là bắt buộc: thiếu nó thì CRC ra số ÂM và
      ghi vào tệp thành 4 byte khác hẳn. JavaScript không báo gì.
   3. ĐỘ DÀI TÍNH BẰNG BYTE, KHÔNG PHẢI KÝ TỰ. Tên tệp và nội dung đều có thể có
      chữ tiếng Việt; `chuoi.length` đếm đơn vị mã UTF-16 nên "Hội viên" ra 8
      trong khi UTF-8 tốn 10 byte. Lệch một byte là hỏng toàn bộ phần sau.
   4. OFFSET TRONG BẢNG THƯ MỤC TRUNG TÂM. Mỗi mục trỏ tới vị trí local header
      của nó; cộng thiếu phần dữ liệu là trình giải nén đọc vào giữa tệp. */

/** Một tệp trong gói. `noiDung` là văn bản — .xlsx chỉ gồm XML. */
export interface TepZip {
  ten: string;
  noiDung: string;
}

/** CRC-32/ISO-HDLC, đúng biến thể ZIP dùng. Trả số nguyên không dấu 32 bit.

    BẪY 1 và 2 — tính trên BYTE (không phải ký tự), và `>>> 0` ở cuối để không
    ra số âm. */
export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    let c = (crc ^ (bytes[i] as number)) & 0xff;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Số 16 bit, thứ tự byte nhỏ trước (little-endian) — đúng quy ước của PKZIP. */
function u16(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff];
}

/** Số 32 bit, byte nhỏ trước. */
function u32(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
}

/* 1980-01-01 — giá trị ngày/giờ DOS hợp lệ nhỏ nhất.

   CỐ Ý dùng hằng thay cho thời gian thật, giữ đúng bản cũ: cùng một bộ dữ liệu
   thì cho ra cùng một chuỗi byte, nên so được hai lần xuất với nhau. Đóng dấu
   thời gian thật vào đây là mỗi lần xuất một tệp khác nhau dù nội dung y hệt. */
const GIO_DOS = 0;
const NGAY_DOS = 0x21;

const KY_HIEU_LOCAL = 0x04034b50;
const KY_HIEU_TRUNG_TAM = 0x02014b50;
const KY_HIEU_KET = 0x06054b50;

/** Đóng gói danh sách tệp thành một kho ZIP (STORE, không nén).

    Không nén là cố ý: tệp .xlsx của báo cáo chỉ vài chục KB, mà thêm DEFLATE là
    thêm một bộ nén tự viết nữa để sai. Excel đọc ZIP không nén y như nén. */
export function dungZip(tep: readonly TepZip[]): Uint8Array {
  const enc = new TextEncoder();
  const phanLocal: Uint8Array[] = [];
  const trungTam: Uint8Array[] = [];
  let viTri = 0;

  for (const t of tep) {
    /* BẪY 3 — mã hoá ra BYTE trước, rồi mới lấy độ dài. */
    const tenBytes = enc.encode(t.ten);
    const duLieu = enc.encode(t.noiDung);
    const crc = crc32(duLieu);
    const coTep = duLieu.length;

    const lfh = new Uint8Array(30 + tenBytes.length);
    let o = 0;
    const datLfh = (v: number[]) => {
      lfh.set(v, o);
      o += v.length;
    };
    datLfh(u32(KY_HIEU_LOCAL));
    datLfh(u16(20)); // phiên bản cần để giải nén
    datLfh(u16(0)); // cờ
    datLfh(u16(0)); // phương thức nén: 0 = STORE
    datLfh(u16(GIO_DOS));
    datLfh(u16(NGAY_DOS));
    datLfh(u32(crc));
    datLfh(u32(coTep)); // cỡ sau nén
    datLfh(u32(coTep)); // cỡ gốc — bằng nhau vì không nén
    datLfh(u16(tenBytes.length));
    datLfh(u16(0)); // độ dài trường phụ
    lfh.set(tenBytes, o);
    phanLocal.push(lfh, duLieu);

    const cdh = new Uint8Array(46 + tenBytes.length);
    let c = 0;
    const datCdh = (v: number[]) => {
      cdh.set(v, c);
      c += v.length;
    };
    datCdh(u32(KY_HIEU_TRUNG_TAM));
    datCdh(u16(20)); // phiên bản tạo
    datCdh(u16(20)); // phiên bản cần để giải nén
    datCdh(u16(0));
    datCdh(u16(0));
    datCdh(u16(GIO_DOS));
    datCdh(u16(NGAY_DOS));
    datCdh(u32(crc));
    datCdh(u32(coTep));
    datCdh(u32(coTep));
    datCdh(u16(tenBytes.length));
    datCdh(u16(0)); // trường phụ
    datCdh(u16(0)); // chú thích
    datCdh(u16(0)); // số đĩa
    datCdh(u16(0)); // thuộc tính nội bộ
    datCdh(u32(0)); // thuộc tính ngoài
    /* BẪY 4 — vị trí local header CỦA CHÍNH mục này, tính trước khi cộng dồn. */
    datCdh(u32(viTri));
    cdh.set(tenBytes, c);
    trungTam.push(cdh);

    viTri += lfh.length + duLieu.length;
  }

  const coTrungTam = trungTam.reduce((a, b) => a + b.length, 0);
  const viTriTrungTam = viTri;

  const eocd = new Uint8Array(22);
  let e = 0;
  const datEocd = (v: number[]) => {
    eocd.set(v, e);
    e += v.length;
  };
  datEocd(u32(KY_HIEU_KET));
  datEocd(u16(0)); // số đĩa
  datEocd(u16(0)); // đĩa chứa bảng thư mục
  datEocd(u16(tep.length));
  datEocd(u16(tep.length));
  datEocd(u32(coTrungTam));
  datEocd(u32(viTriTrungTam));
  datEocd(u16(0)); // độ dài chú thích

  return noi([...phanLocal, ...trungTam, eocd]);
}

function noi(phan: readonly Uint8Array[]): Uint8Array {
  const tong = phan.reduce((a, b) => a + b.length, 0);
  const ra = new Uint8Array(tong);
  let o = 0;
  for (const p of phan) {
    ra.set(p, o);
    o += p.length;
  }
  return ra;
}
