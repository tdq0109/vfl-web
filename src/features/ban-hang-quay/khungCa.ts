import type { Vnd } from '@/lib/api/types';
import { tienMatKyVong } from './quay';
import type { CaThuNgan } from './types';

/* KHUNG CA CHUẨN CỦA CLB — HÀM THUẦN, không import React.

   🐞 VÌ SAO PHẢI CÓ TỆP NÀY. Bản giám sát đầu tiên coi "ca" là một phiên thu
   ngân tuỳ ý: ai mở lúc nào cũng được, đóng lúc nào cũng được, và mỗi ca được
   đối soát RIÊNG LẺ. Thực tế vận hành CLB không như vậy — lễ tân chia **2 ca
   một ngày, có nơi 3 ca**, nối tiếp nhau trên cùng một két tiền.

   Mô hình cũ bỏ sót đúng ba thứ mà chỉ ca-nối-ca mới sinh ra, và cả ba đều là
   chỗ tiền biến mất:

   1. **BÀN GIAO** — tiền đếm cuối ca sáng PHẢI bằng tiền đầu ca chiều. Lệch ở
      khớp nối này thì không ca nào "sai" cả: ca sáng khớp két của nó, ca chiều
      khớp két của nó, mà tiền vẫn hụt. Đối soát từng ca riêng lẻ KHÔNG BAO GIỜ
      nhìn thấy — đây là lỗ hổng lớn nhất của bản trước.
   2. **KHOẢNG TRỐNG** — cả ca chiều không ai mở ca. Két vẫn có tiền, khách vẫn
      mua vé, nhưng không ai chịu trách nhiệm và không có phiếu nào. Bảng cũ chỉ
      liệt kê ca ĐÃ CÓ nên khoảng trống là vô hình.
   3. **CHỒNG LẤN** — hai thu ngân cùng mở ca trên một két. Tiền của người này
      rơi vào đối soát của người kia.

   ⚠ KHUNG GIỜ DƯỚI ĐÂY LÀ GIẢ ĐỊNH, cần vận hành chốt. Đặt thành dữ liệu để đổi
   một chỗ, và để test nói rõ khung nào đang có hiệu lực. */

export interface KhungCa {
  id: string;
  /** KHOÁ i18n của tên ca. */
  nhanKhoa: string;
  /** 'HH:mm' — giờ bắt đầu theo giờ địa phương. */
  batDau: string;
  /** 'HH:mm'. Nhỏ hơn `batDau` nghĩa là ca VẮT QUA NỬA ĐÊM. */
  ketThuc: string;
}

/** Hai ca — cách chia phổ biến nhất hiện nay. */
export const KHUNG_2_CA: KhungCa[] = [
  { id: 'sang', nhanKhoa: 'quay.khungCa.sang', batDau: '06:00', ketThuc: '14:00' },
  { id: 'chieu', nhanKhoa: 'quay.khungCa.chieu', batDau: '14:00', ketThuc: '22:00' },
];

/** Ba ca — có CLB chạy thêm ca đêm. Ca đêm VẮT QUA NỬA ĐÊM. */
export const KHUNG_3_CA: KhungCa[] = [
  { id: 'sang', nhanKhoa: 'quay.khungCa.sang', batDau: '06:00', ketThuc: '14:00' },
  { id: 'chieu', nhanKhoa: 'quay.khungCa.chieu', batDau: '14:00', ketThuc: '22:00' },
  { id: 'dem', nhanKhoa: 'quay.khungCa.dem', batDau: '22:00', ketThuc: '06:00' },
];

export type KieuKhung = '2-ca' | '3-ca';

export const KHUNG_THEO_KIEU: Record<KieuKhung, KhungCa[]> = {
  '2-ca': KHUNG_2_CA,
  '3-ca': KHUNG_3_CA,
};

/** Ca chạy quá khung của nó bao lâu thì coi là bất thường (giờ). */
export const GIO_VUOT_KHUNG = 2;

/** 'HH:mm' → số phút từ 0h. Trả `null` nếu không đọc được. */
export function phutTrongNgay(hhmm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m || m[1] === undefined || m[2] === undefined) return null;
  const gio = Number(m[1]);
  const phut = Number(m[2]);
  if (gio > 23 || phut > 59) return null;
  return gio * 60 + phut;
}

/** Phần 'HH:mm' của một mốc 'YYYY-MM-DDTHH:mm'. */
function gioCua(luc: string): string {
  return luc.slice(11, 16);
}

/** Độ dài khung theo phút. Khung vắt qua nửa đêm được cộng bù 24 giờ. */
export function doDaiKhung(khung: KhungCa): number {
  const bd = phutTrongNgay(khung.batDau);
  const kt = phutTrongNgay(khung.ketThuc);
  if (bd === null || kt === null) return 0;
  return kt > bd ? kt - bd : kt + 24 * 60 - bd;
}

/** Khung chứa thời điểm này. `null` nếu rơi ngoài mọi khung (giờ không ai trực).

    ⚠ Khung VẮT QUA NỬA ĐÊM (22:00 → 06:00) phải xét bằng HOẶC, không phải VÀ:
    01:30 vừa không ≥ 22:00 vừa không thuộc khoảng nào nếu so kiểu thường. */
export function khungCuaThoiDiem(luc: string, khung: readonly KhungCa[]): KhungCa | null {
  const t = phutTrongNgay(gioCua(luc));
  if (t === null) return null;

  for (const k of khung) {
    const bd = phutTrongNgay(k.batDau);
    const kt = phutTrongNgay(k.ketThuc);
    if (bd === null || kt === null) continue;
    const trong = kt > bd ? t >= bd && t < kt : t >= bd || t < kt;
    if (trong) return k;
  }
  return null;
}

/** NGÀY LÀM VIỆC của một mốc — không phải ngày trên lịch.

    Ca đêm mở 23:00 ngày 04 và ca đêm mở 01:00 ngày 05 là CÙNG MỘT CA của ngày
    04. Lấy ngày lịch là ca đêm bị cắt đôi giữa hai ngày, và cả hai ngày cùng
    thiếu một nửa. */
export function ngayLamViec(luc: string, khung: readonly KhungCa[]): string {
  const ngay = luc.slice(0, 10);
  const k = khungCuaThoiDiem(luc, khung);
  if (!k) return ngay;

  const bd = phutTrongNgay(k.batDau);
  const kt = phutTrongNgay(k.ketThuc);
  const t = phutTrongNgay(gioCua(luc));
  if (bd === null || kt === null || t === null) return ngay;

  /* Chỉ khung vắt qua nửa đêm mới phải lùi, và chỉ ở nửa SAU nửa đêm. */
  if (kt <= bd && t < kt) {
    const d = new Date(`${ngay}T00:00`);
    d.setDate(d.getDate() - 1);
    const hai = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`;
  }
  return ngay;
}

/** Số giờ một ca chạy quá khung của nó. 0 nghĩa là trong khung. */
export function soGioVuotKhung(
  ca: Pick<CaThuNgan, 'moLuc' | 'dongLuc'>,
  khung: readonly KhungCa[],
  bayGio: Date,
): number {
  const k = khungCuaThoiDiem(ca.moLuc, khung);
  if (!k) return 0;
  const mo = new Date(ca.moLuc).getTime();
  const den = ca.dongLuc ? new Date(ca.dongLuc).getTime() : bayGio.getTime();
  if (Number.isNaN(mo) || Number.isNaN(den)) return 0;
  const daChay = (den - mo) / 60_000;
  const vuot = daChay - doDaiKhung(k);
  return vuot > 0 ? vuot / 60 : 0;
}

/** Một mắt xích trong chuỗi ca của một ngày tại một CLB. */
export interface MatXichCa {
  /** Khung ca này thuộc về. `null` = ca mở ngoài mọi khung. */
  khung: KhungCa | null;
  ca: CaThuNgan;
  /** Lệch bàn giao so với ca LIỀN TRƯỚC: tiền đầu ca này − tiền cuối ca trước.

      `null` khi không có ca trước, hoặc ca trước chưa đóng (chưa đếm thì chưa
      có gì để so). Dương = ca này nhận NHIỀU hơn số ca trước bàn giao. */
  lechBanGiao: number | null;
  /** Số giờ chạy quá khung. */
  gioVuotKhung: number;
  /** Ca này chồng giờ với ca liền trước tại cùng CLB. */
  chongLanCaTruoc: boolean;
}

/** Một khung KHÔNG có ca nào phụ trách. */
export interface KhungTrong {
  khung: KhungCa;
}

export interface NgayCuaClb {
  ngay: string;
  locationId: string;
  locationName?: string;
  matXich: MatXichCa[];
  /** Khung trong ngày mà không ai mở ca — két không có người chịu trách nhiệm. */
  khungTrong: KhungTrong[];
}

/** Gom ca theo NGÀY LÀM VIỆC × CLB, xếp theo giờ mở, rồi tính:
    lệch bàn giao giữa hai ca liền nhau · ca chạy quá khung · ca chồng lấn ·
    khung không ai trực.

    `chiKhungDaQua` — chỉ báo khung trống khi khung ấy ĐÃ KẾT THÚC so với
    `bayGio`. Không có nó thì lúc 8h sáng màn đã kêu "ca chiều không ai trực",
    trong khi ca chiều còn chưa tới giờ. */
export function gomTheoNgayVaClb(
  dsCa: readonly CaThuNgan[],
  khung: readonly KhungCa[],
  bayGio: Date,
): NgayCuaClb[] {
  const nhom = new Map<string, NgayCuaClb>();

  for (const ca of dsCa) {
    const ngay = ngayLamViec(ca.moLuc, khung);
    const khoa = `${ngay}|${ca.locationId}`;
    let muc = nhom.get(khoa);
    if (!muc) {
      muc = {
        ngay,
        locationId: ca.locationId,
        ...(ca.locationName === undefined ? {} : { locationName: ca.locationName }),
        matXich: [],
        khungTrong: [],
      };
      nhom.set(khoa, muc);
    }
    muc.matXich.push({
      khung: khungCuaThoiDiem(ca.moLuc, khung),
      ca,
      lechBanGiao: null,
      gioVuotKhung: soGioVuotKhung(ca, khung, bayGio),
      chongLanCaTruoc: false,
    });
  }

  for (const muc of nhom.values()) {
    muc.matXich.sort((a, b) => (a.ca.moLuc < b.ca.moLuc ? -1 : a.ca.moLuc > b.ca.moLuc ? 1 : 0));

    for (let i = 1; i < muc.matXich.length; i += 1) {
      const truoc = muc.matXich[i - 1];
      const nay = muc.matXich[i];
      if (!truoc || !nay) continue;

      /* Bàn giao chỉ so được khi ca trước ĐÃ ĐẾM TIỀN. */
      if (truoc.ca.tienDemCuoiCa !== undefined) {
        nay.lechBanGiao = nay.ca.tienDauCa - truoc.ca.tienDemCuoiCa;
      }

      /* Chồng lấn: ca trước chưa đóng, hoặc đóng SAU khi ca này đã mở. */
      nay.chongLanCaTruoc = !truoc.ca.dongLuc || truoc.ca.dongLuc > nay.ca.moLuc;
    }

    /* Khung trống — chỉ tính khung đã kết thúc. */
    const daCo = new Set(muc.matXich.map((m) => m.khung?.id).filter(Boolean));
    for (const k of khung) {
      if (daCo.has(k.id)) continue;
      if (khungDaKetThuc(muc.ngay, k, bayGio)) muc.khungTrong.push({ khung: k });
    }
  }

  return [...nhom.values()].sort((a, b) =>
    a.ngay === b.ngay ? a.locationId.localeCompare(b.locationId) : a.ngay < b.ngay ? 1 : -1,
  );
}

/** Khung của ngày làm việc `ngay` đã kết thúc so với `bayGio` chưa. */
export function khungDaKetThuc(ngay: string, khung: KhungCa, bayGio: Date): boolean {
  const bd = phutTrongNgay(khung.batDau);
  const dai = doDaiKhung(khung);
  if (bd === null) return false;
  const batDau = new Date(`${ngay}T00:00`);
  batDau.setMinutes(batDau.getMinutes() + bd);
  return bayGio.getTime() >= batDau.getTime() + dai * 60_000;
}

/** Tổng tiền mặt lẽ ra còn lại cuối ngày tại một CLB, đi theo CHUỖI bàn giao.

    Đây là con số kế toán muốn: bắt đầu bằng tiền đầu ca đầu tiên, cộng tiền mặt
    bán được của mọi ca, và đó là số PHẢI có trong két lúc giao ca cuối cùng —
    không phụ thuộc từng ca đối soát ra sao. */
export function tienMatCuoiNgayKyVong(ngay: NgayCuaClb): Vnd | null {
  const dau = ngay.matXich[0];
  if (!dau) return null;
  return tienMatKyVong({
    tienDauCa: dau.ca.tienDauCa,
    giaoDich: ngay.matXich.flatMap((m) => m.ca.giaoDich),
  });
}

/** Dấu hiệu cần chú ý sinh ra từ VỊ TRÍ CỦA CA TRONG CHUỖI — mảng KHOÁ i18n.

    Khác hẳn `giamSat.ts::chuYCuaCa()`: hàm kia soi MỘT ca đứng riêng (lệch két,
    huỷ nhiều). Hàm này chỉ thấy được khi đặt ca cạnh ca liền trước — và đó đúng
    là chỗ mô hình cũ mù hoàn toàn.

    ⚠ LỆCH BÀN GIAO KHÔNG CÓ NGƯỠNG. Lệch két vài nghìn còn có thể do trả tiền
    thừa; còn tiền đầu ca sau khác tiền cuối ca trước thì luôn có nghĩa là ai đó
    đếm sai hoặc ai đó cầm đi — không có mức nào "chấp nhận được". */
export function chuYCuaMatXich(m: MatXichCa): string[] {
  const ra: string[] = [];
  if (m.lechBanGiao !== null && m.lechBanGiao !== 0) {
    ra.push('quay.giamSat.chuY.lechBanGiao');
  }
  if (m.chongLanCaTruoc) ra.push('quay.giamSat.chuY.chongLanCa');
  if (m.gioVuotKhung >= GIO_VUOT_KHUNG) ra.push('quay.giamSat.chuY.vuotKhung');
  if (m.khung === null) ra.push('quay.giamSat.chuY.ngoaiKhung');
  return ra;
}

/** Tổng lệch bàn giao trong một ngày tại một CLB — cộng có dấu.

    Đây là con số trả lời "hôm nay có đồng nào rơi giữa các ca không", thứ mà
    tổng chênh lệch của từng ca không nói được. */
export function tongLechBanGiao(ngay: NgayCuaClb): number {
  return ngay.matXich.reduce((tong, m) => tong + (m.lechBanGiao ?? 0), 0);
}
