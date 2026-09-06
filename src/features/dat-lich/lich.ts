import type {
  Buoi,
  ChoDat,
  IsoDateTime,
  KhoangBuoi,
  LoaiBuoi,
  TrangThaiBuoi,
} from './types';

/* Logic lịch — hàm thuần, không import React. Bốn hàm kiểm tra trả khoá i18n
   chứ không trả câu tiếng Việt; null vẫn giữ nghĩa "không có lỗi".

   Trọng tâm là chống trùng lịch HLV, và ba chỗ đừng gỡ khi sửa:

   1. Xuyên CLB: HLV không thể có mặt ở hai CLB cùng lúc, nên timTrungLichHlv cố
      ý không nhận locationId — lọc theo CLB trước rồi mới dò là cho xếp trùng.
   2. Liền kề không phải trùng: 8–9h và 9–10h là hợp lệ, nên dùng khoảng nửa mở
      [batDau, ketThuc).
   3. Khi sửa một buổi phải bỏ chính nó ra khỏi danh sách đối chiếu. */

/** Hai khoảng thời gian có chồng nhau không. Nửa mở: chạm biên không tính. */
export function chongLan(
  aBatDau: IsoDateTime,
  aKetThuc: IsoDateTime,
  bBatDau: IsoDateTime,
  bKetThuc: IsoDateTime,
): boolean {
  return aBatDau < bKetThuc && bBatDau < aKetThuc;
}

/** Khoảng thời gian hợp lệ: kết thúc phải sau bắt đầu. Trả khoá i18n hoặc
    null. */
export function kiemTraKhoangGio(batDau: IsoDateTime, ketThuc: IsoDateTime): string | null {
  if (!batDau || !ketThuc) return null;
  if (ketThuc <= batDau) return 'datLich.loi.gioKetThuc';
  return null;
}

interface TimTrungInput {
  hlvId?: string;
  batDau: IsoDateTime;
  ketThuc: IsoDateTime;
  /** Id buổi đang sửa — bỏ chính nó ra khỏi danh sách đối chiếu. */
  boQuaId?: string;
}

/** Các buổi khác của cùng HLV bị chồng giờ với buổi đang xếp. Không nhận
    locationId — truyền vào đây toàn bộ buổi trong khoảng đó, mọi CLB. */
export function timTrungLichHlv(
  buoiMoi: TimTrungInput,
  cacBuoi: readonly KhoangBuoi[],
): KhoangBuoi[] {
  const { hlvId, batDau, ketThuc, boQuaId } = buoiMoi;

  // Chưa phân HLV thì không có gì để trùng.
  if (!hlvId) return [];
  // Khoảng giờ vô nghĩa thì không kết luận — để `kiemTraKhoangGio` báo lỗi.
  if (ketThuc <= batDau) return [];

  return cacBuoi.filter(
    (b) =>
      b.id !== boQuaId &&
      !b.daHuy &&
      b.hlvId === hlvId &&
      chongLan(batDau, ketThuc, b.batDau, b.ketThuc),
  );
}

/** Thông điệp lỗi trùng lịch, hoặc null nếu không trùng. */
export function moTaTrungLich(trung: readonly KhoangBuoi[]): string | null {
  if (trung.length === 0) return null;
  /* Trả khoá, còn số buổi thì màn tự truyền: t(khoa, { so: trung.length }).
     Phép chọn ít/nhiều ở lại đây vì nó là quy tắc, chỉ có chữ là đi ra ngoài.
     Khoá số ít không có chỗ trống nên truyền thừa so cũng vô hại. */
  return trung.length === 1 ? 'datLich.trungLichMot' : 'datLich.trungLichNhieu';
}

// Sức chứa, giữ chỗ, hàng chờ

/** Chỗ đã đặt còn hiệu lực: chỗ chốt luôn tính, chỗ giữ chỉ tính khi chưa
    hết hạn. */
export function choDatConHieuLuc(daDat: readonly ChoDat[], bayGio: Date = new Date()): ChoDat[] {
  const moc = thoiDiem(bayGio);
  return daDat.filter((c) => !c.giuCho || (c.giuChoDenLuc ?? '') > moc);
}

/** Số chỗ còn trống. Không bao giờ âm. */
export function soChoConLai(
  buoi: Pick<Buoi, 'sucChua' | 'daDat'>,
  bayGio: Date = new Date(),
): number {
  return Math.max(0, buoi.sucChua - choDatConHieuLuc(buoi.daDat, bayGio).length);
}

export function conCho(
  buoi: Pick<Buoi, 'sucChua' | 'daDat'>,
  bayGio: Date = new Date(),
): boolean {
  return soChoConLai(buoi, bayGio) > 0;
}

/** Hội viên này đã có chỗ (kể cả đang giữ) trong buổi chưa. */
export function daCoCho(
  buoi: Pick<Buoi, 'daDat'>,
  hoiVienId: string,
  bayGio: Date = new Date(),
): boolean {
  return choDatConHieuLuc(buoi.daDat, bayGio).some((c) => c.hoiVienId === hoiVienId);
}

/** Vì sao không đặt được chỗ — khoá i18n, null nghĩa là đặt được. Thứ tự bốn
    nhánh là có ý: buổi huỷ hoặc đã xong nói trước, rồi mới tới lý do của riêng
    hội viên này. */
export function viSaoKhongDatDuoc(
  buoi: Pick<Buoi, 'sucChua' | 'daDat' | 'daHuy' | 'ketThuc'>,
  hoiVienId: string,
  bayGio: Date = new Date(),
): string | null {
  if (buoi.daHuy) return 'datLich.khongDat.daHuy';
  if (buoi.ketThuc <= thoiDiem(bayGio)) return 'datLich.khongDat.daKetThuc';
  if (daCoCho(buoi, hoiVienId, bayGio)) return 'datLich.khongDat.daCoCho';
  if (!conCho(buoi, bayGio)) return 'datLich.khongDat.daDay';
  return null;
}

/** Trạng thái hiển thị của buổi — suy ra, không lưu. */
export function trangThaiBuoi(
  buoi: Pick<Buoi, 'sucChua' | 'daDat' | 'daHuy' | 'ketThuc'>,
  bayGio: Date = new Date(),
): TrangThaiBuoi {
  if (buoi.daHuy) return 'da-huy';
  if (buoi.ketThuc <= thoiDiem(bayGio)) return 'da-xong';
  return conCho(buoi, bayGio) ? 'mo' : 'day';
}

// Tiện ích thời gian

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Date → 'YYYY-MM-DDTHH:mm' theo giờ địa phương. */
export function thoiDiem(d: Date): IsoDateTime {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function ngayCua(luc: IsoDateTime): string {
  return luc.slice(0, 10);
}

export function gioCua(luc: IsoDateTime): string {
  return luc.slice(11, 16);
}

/** 'HH:mm – HH:mm' để hiện trên thẻ buổi. */
export function khungGio(batDau: IsoDateTime, ketThuc: IsoDateTime): string {
  return `${gioCua(batDau)} – ${gioCua(ketThuc)}`;
}

/** Gom buổi theo ngày, khoá là 'YYYY-MM-DD', mỗi ngày sắp theo giờ bắt đầu. */
export function gomTheoNgay(cacBuoi: readonly Buoi[]): Map<string, Buoi[]> {
  const theoNgay = new Map<string, Buoi[]>();
  for (const b of cacBuoi) {
    const ngay = ngayCua(b.batDau);
    const ds = theoNgay.get(ngay);
    if (ds) ds.push(b);
    else theoNgay.set(ngay, [b]);
  }
  for (const ds of theoNgay.values()) {
    ds.sort((x, y) => (x.batDau < y.batDau ? -1 : x.batDau > y.batDau ? 1 : 0));
  }
  return theoNgay;
}

/** Sức chứa hợp lệ theo loại buổi. PT bắt buộc 1 kèm 1. Trả khoá i18n hoặc
    null. */
export function kiemTraSucChua(loai: LoaiBuoi, sucChua: number): string | null {
  if (!Number.isInteger(sucChua) || sucChua < 1) return 'datLich.loi.sucChuaNguyen';
  if (loai === 'pt' && sucChua !== 1) return 'datLich.loi.ptMotKemMot';
  return null;
}
