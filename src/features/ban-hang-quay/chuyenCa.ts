import type { Vnd } from '@/lib/api/types';
import { doanhThuTheoPhuongThuc, tienMatKyVong, viSaoKhongDongDuocCa } from './quay';
import {
  khungCuaThoiDiem,
  phutTrongNgay,
  type KhungCa,
  type NgayCuaClb,
} from './khungCa';
import type { CaThuNgan } from './types';

/* MỞ CA · CHUYỂN CA · CHỐT NGÀY — HÀM THUẦN, không import React.

   `khungCa.ts` mô tả CÁI KHUNG (ngày có mấy ca, ca nào từ mấy giờ). Tệp này mô
   tả CÁCH NGƯỜI TA ĐI QUA cái khung đó trong một ngày làm việc thật:

     mở ca (giờ thật) → bán → chuyển ca → bán → … → chốt ngày

   ⚠ BA QUYẾT ĐỊNH THIẾT KẾ, đừng đảo cái nào khi sửa:

   1. **MỞ MUỘN VẪN CHO MỞ, NHƯNG GHI LẠI.** Chặn không cho mở ca vì tới muộn là
      đẩy lễ tân vào chỗ bán chui không có ca — tiền vào túi, không có phiếu, và
      không còn dấu vết nào cả. Ghi độ muộn thì vừa mở được vừa truy được.

   2. **CHUYỂN CA LÀ MỘT THAO TÁC, KHÔNG PHẢI HAI.** Tiền đầu ca sau LẤY THẲNG từ
      tiền đếm của ca trước, không cho gõ tay. Đây chính là chỗ bịt lỗ hổng lớn
      nhất đã tìm ra: khi hai con số ấy do hai người gõ độc lập thì tiền bốc hơi
      ở khớp nối mà không ca nào "sai" cả. Nối cứng lại thì lệch bàn giao chỉ còn
      sinh ra được khi ai đó mở ca thủ công — và đó là việc phải giải thích.

   3. **CHỐT NGÀY ĐÒI MỌI CA ĐÃ ĐÓNG.** Chốt khi còn ca đang chạy là chốt một
      con số sẽ đổi ngay sau đó — tệ hơn không chốt, vì nó tạo cảm giác đã xong. */

/** Trễ quá số phút này so với giờ khung thì coi là MỞ CA MUỘN. */
export const DUNG_SAI_MO_MUON = 15;

/** Số phút mở ca muộn hơn giờ bắt đầu khung. `null` nếu ca nằm ngoài mọi khung.

    ⚠ PHẢI TÍNH THEO VÒNG 24 GIỜ. Ca đêm bắt đầu 22:00; mở lúc 01:00 mà trừ
    thẳng ra −1260 phút, và cảnh báo "mở muộn" hoá vô nghĩa với đúng ca dễ đi
    muộn nhất.

    KHÔNG có nhánh "mở sớm": khung chứa thời điểm nào thì khung ấy đã bắt đầu
    trước thời điểm đó rồi, nên độ trễ luôn nằm trong độ dài khung. Người tới
    sớm trước giờ ca rơi vào khung TRƯỚC (hoặc ngoài mọi khung nếu có quãng hở)
    — không phải việc của hàm này.

    🐞 Bản đầu có thêm một nhánh `tre >= doDaiKhung ? 0 : tre` tự nhận là chống
    "mở sớm bị tính thành muộn 23 tiếng". Đợt phá code để thử răng của test cho
    thấy KHÔNG test nào chết khi bỏ nhánh ấy đi — vì nó không bao giờ chạy. Code
    chết giả dạng lá chắn còn tệ hơn không có: lần sau đọc lại sẽ tưởng trường
    hợp đó đã được xử lý. */
export function soPhutMoMuon(
  ca: Pick<CaThuNgan, 'moLuc'>,
  khung: readonly KhungCa[],
): number | null {
  const k = khungCuaThoiDiem(ca.moLuc, khung);
  if (!k) return null;
  const batDau = phutTrongNgay(k.batDau);
  const luc = phutTrongNgay(ca.moLuc.slice(11, 16));
  if (batDau === null || luc === null) return null;

  return (luc - batDau + 24 * 60) % (24 * 60);
}

/** Ca này có bị coi là mở muộn không. */
export function moCaMuon(
  ca: Pick<CaThuNgan, 'moLuc'>,
  khung: readonly KhungCa[],
  dungSai: number = DUNG_SAI_MO_MUON,
): boolean {
  const tre = soPhutMoMuon(ca, khung);
  return tre !== null && tre > dungSai;
}

/** Khung ngay sau khung này trong ngày. `null` nếu đây đã là ca cuối.

    Ca cuối ngày KHÔNG chuyển ca — nó chốt ngày. Đó là lý do hàm trả `null` chứ
    không quay vòng về ca sáng. */
export function khungKeTiep(
  hienTai: KhungCa | null,
  khung: readonly KhungCa[],
): KhungCa | null {
  if (!hienTai) return null;
  const i = khung.findIndex((k) => k.id === hienTai.id);
  if (i < 0) return null;
  return khung[i + 1] ?? null;
}

/** Vì sao chưa chuyển ca được — KHOÁ i18n, `null` nghĩa là chuyển được.

    Mọi điều kiện của ĐÓNG ca đều áp dụng (đã đếm tiền, lệch thì phải ghi lý do),
    cộng thêm một điều kiện riêng: phải còn ca sau để mà chuyển sang. */
export function viSaoKhongChuyenDuocCa(
  ca: Pick<CaThuNgan, 'trangThai' | 'tienDauCa' | 'giaoDich' | 'moLuc'> | null,
  tienDem: number | null,
  ghiChu: string,
  khung: readonly KhungCa[],
): string | null {
  const chanDong = viSaoKhongDongDuocCa(ca, tienDem, ghiChu);
  if (chanDong) return chanDong;
  if (!ca) return 'quay.khongDong.khongCoCa';

  const keTiep = khungKeTiep(khungCuaThoiDiem(ca.moLuc, khung), khung);
  if (!keTiep) return 'quay.chuyenCa.khongConCaSau';
  return null;
}

/** Vì sao chưa chốt ngày được — KHOÁ i18n, `null` nghĩa là chốt được. */
export function viSaoKhongChotDuocNgay(
  dsCa: readonly Pick<CaThuNgan, 'trangThai'>[],
  daChot: boolean,
): string | null {
  if (daChot) return 'quay.chotNgay.daChot';
  if (dsCa.length === 0) return 'quay.chotNgay.khongCoCa';
  if (dsCa.some((c) => c.trangThai === 'dang-mo')) return 'quay.chotNgay.conCaDangMo';
  return null;
}

/** Bản tổng kết cả ngày để nhân viên xác nhận trước khi chốt. */
export interface TongKetNgay {
  soCa: number;
  /** Tiền mặt trong két lúc mở ca ĐẦU TIÊN của ngày. */
  tienMatDauNgay: Vnd;
  /** Tiền mặt LẼ RA còn trong két lúc kết thúc ngày, đi theo cả chuỗi. */
  tienMatCuoiNgayKyVong: Vnd;
  /** Tiền mặt ĐẾM ĐƯỢC ở ca cuối cùng. */
  tienMatCuoiNgayThucTe: Vnd | null;
  /** Chênh lệch cuối ngày = thực tế − kỳ vọng. */
  lechCuoiNgay: number | null;
  tienMat: Vnd;
  chuyenKhoan: Vnd;
  the: Vnd;
  tongDoanhThu: Vnd;
  soGiaoDich: number;
  soGiaoDichHuy: number;
  tienHuy: Vnd;
  /** Tổng chênh lệch két của từng ca, cộng CÓ DẤU. */
  tongLechKet: number;
  /** Tổng lệch bàn giao giữa các ca, cộng CÓ DẤU. */
  tongLechBanGiao: number;
  soCaMoMuon: number;
  soKhungTrong: number;
}

/** Tổng kết một ngày làm việc của một CLB.

    ⚠ `tienMatCuoiNgayKyVong` đi theo CHUỖI, không cộng từng ca: bắt đầu bằng
    tiền đầu ca ĐẦU TIÊN rồi cộng tiền mặt bán được của cả ngày. Cộng
    `tienMatKyVong` của từng ca là tiền đầu ca bị đếm lại nhiều lần — mỗi lần
    bàn giao một lần. */
export function tongKetNgay(
  ngay: NgayCuaClb,
  khung: readonly KhungCa[],
  dungSai: number = DUNG_SAI_MO_MUON,
): TongKetNgay {
  const cacCa = ngay.matXich.map((m) => m.ca);
  const moiGiaoDich = cacCa.flatMap((c) => c.giaoDich);
  const dau = cacCa[0];
  const cuoi = cacCa[cacCa.length - 1];

  const tienMatDauNgay = dau?.tienDauCa ?? 0;
  const kyVong = dau
    ? tienMatKyVong({ tienDauCa: tienMatDauNgay, giaoDich: moiGiaoDich })
    : 0;
  const thucTe = cuoi?.tienDemCuoiCa ?? null;

  const tienMat = doanhThuTheoPhuongThuc(moiGiaoDich, 'tien-mat');
  const chuyenKhoan = doanhThuTheoPhuongThuc(moiGiaoDich, 'chuyen-khoan');
  const the = doanhThuTheoPhuongThuc(moiGiaoDich, 'the');
  const conHieuLuc = moiGiaoDich.filter((g) => !g.daHuy);
  const daHuy = moiGiaoDich.filter((g) => g.daHuy);

  let tongLechKet = 0;
  for (const c of cacCa) {
    if (c.tienDemCuoiCa === undefined) continue;
    tongLechKet += c.tienDemCuoiCa - tienMatKyVong(c);
  }

  return {
    soCa: cacCa.length,
    tienMatDauNgay,
    tienMatCuoiNgayKyVong: kyVong,
    tienMatCuoiNgayThucTe: thucTe,
    lechCuoiNgay: thucTe === null ? null : thucTe - kyVong,
    tienMat,
    chuyenKhoan,
    the,
    tongDoanhThu: tienMat + chuyenKhoan + the,
    soGiaoDich: conHieuLuc.length,
    soGiaoDichHuy: daHuy.length,
    tienHuy: daHuy.reduce((t, g) => t + g.tongTien, 0),
    tongLechKet,
    tongLechBanGiao: ngay.matXich.reduce((t, m) => t + (m.lechBanGiao ?? 0), 0),
    soCaMoMuon: cacCa.filter((c) => moCaMuon(c, khung, dungSai)).length,
    soKhungTrong: ngay.khungTrong.length,
  };
}
