/* Đóng gói ZIP (PKZIP, phương thức STORE = không nén) — hàm thuần. Port từ
   commercial-console.html; một tệp .xlsx chỉ là một ZIP chứa mấy tệp XML.

   Tự viết thay vì thêm thư viện để bỏ hẳn phụ thuộc mạng lúc xuất tệp và tự
   kiểm soát từng byte. Trả Uint8Array chứ không trả Blob như bản cũ, phần dựng
   Blob nằm ở taiVe.ts.

   Bốn chỗ đừng gỡ khi sửa:

   1. CRC-32/ISO-HDLC (đa thức đảo 0xEDB88320, init 0xFFFFFFFF, XOR ra
      0xFFFFFFFF). Nhầm biến thể vẫn ra 4 byte trông hợp lệ và Excel từ chối tệp.
   2. >>> 0 ở cuối là bắt buộc, thiếu nó thì CRC ra số âm.
   3. Độ dài tính bằng byte chứ không phải ký tự: "Hội viên" dài 8 theo JS nhưng
      tốn 10 byte UTF-8.
   4. Offset trong bảng thư mục trung tâm trỏ tới local header của chính mục đó. */

/** Một tệp trong gói. `noiDung` là văn bản — .xlsx chỉ gồm XML. */
export interface TepZip {
  ten: string;
  noiDung: string;
}

/** CRC-32/ISO-HDLC, đúng biến thể ZIP dùng. Trả số nguyên không dấu 32 bit.
    Tính trên byte chứ không phải ký tự, và >>> 0 ở cuối để không ra số âm. */
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

   Cố ý dùng hằng thay cho thời gian thật, giữ đúng bản cũ: cùng một bộ dữ liệu
   thì cho ra cùng một chuỗi byte, nên so được hai lần xuất với nhau. */
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
    /* Mã hoá ra byte trước, rồi mới lấy độ dài. */
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
    /* Vị trí local header của chính mục này, tính trước khi cộng dồn. */
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
