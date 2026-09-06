'use client';

import { useId, useState, type FormEvent } from 'react';
import { Button, FormField } from '@/components/ui';
import type { HoiVien } from '@/features/hoi-vien';
import type { KhuyenMai, SanPham } from '@/features/san-pham';
import type { Location } from '@/lib/api/types';
import { useT } from '@/components/shell/NgonNguProvider';
import { canhBaoGiaSan } from '../hop-dong';
import type { DongHopDong, HopDong, HopDongInput, KhuyenMaiApDung } from '../types';
import { BangTongTien } from './BangTongTien';
import { DongSanPham } from './DongSanPham';

/* Form lập / sửa báo giá. Chỉ dùng khi hợp đồng còn ở bước bao-gia, sau đó hợp
   đồng là chứng từ và chỉ đi theo máy trạng thái.

   Thuần trình bày: mọi danh sách (hội viên, sản phẩm, khuyến mãi) do màn truyền
   vào. Ô tìm hội viên cũng do màn giữ, vì tìm là một lần gọi API. */

interface Props {
  defaultValue?: HopDong;
  hoiVienSearch: string;
  onHoiVienSearchChange: (value: string) => void;
  hoiVienOptions: HoiVien[];
  sanPham: SanPham[];
  khuyenMai: KhuyenMai[];
  locations: Location[];
  fieldErrors?: Record<string, string>;
  submitting?: boolean;
  /** Bỏ trống thì dùng "Lưu báo giá". */
  submitLabel?: string;
  onSubmit: (input: HopDongInput) => void;
  onCancel: () => void;
}

function apDung(km: KhuyenMai): KhuyenMaiApDung {
  return { id: km.id, ma: km.ma, ten: km.ten, loaiGiam: km.loaiGiam, giaTri: km.giaTri };
}

export function HopDongForm({
  defaultValue,
  hoiVienSearch,
  onHoiVienSearchChange,
  hoiVienOptions,
  sanPham,
  khuyenMai,
  locations,
  fieldErrors = {},
  submitting = false,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const t = useT();
  const uid = useId();
  const [hoiVienId, setHoiVienId] = useState(defaultValue?.hoiVienId ?? '');
  const [locationId, setLocationId] = useState(
    defaultValue?.locationId ?? locations[0]?.id ?? '',
  );
  const [dong, setDong] = useState<DongHopDong[]>(defaultValue?.dong ?? []);
  const [kmId, setKmId] = useState(defaultValue?.khuyenMai?.id ?? '');
  const [ngayBatDau, setNgayBatDau] = useState(defaultValue?.ngayBatDau ?? '');
  const [ngayKetThuc, setNgayKetThuc] = useState(defaultValue?.ngayKetThuc ?? '');
  const [ghiChu, setGhiChu] = useState(defaultValue?.ghiChu ?? '');

  const kmChon = khuyenMai.find((k) => k.id === kmId);
  const km = kmChon ? apDung(kmChon) : defaultValue?.khuyenMai?.id === kmId ? defaultValue?.khuyenMai : undefined;

  /* Hội viên đã chọn có thể không nằm trong kết quả tìm hiện tại (sửa hợp đồng
     cũ) — giữ lại một dòng để select không nhảy về rỗng. */
  const dsHoiVien =
    defaultValue && !hoiVienOptions.some((h) => h.id === defaultValue.hoiVienId)
      ? [
          {
            id: defaultValue.hoiVienId,
            hoTen: defaultValue.hoiVienTen,
            soDienThoai: defaultValue.hoiVienSdt ?? '',
          },
          ...hoiVienOptions,
        ]
      : hoiVienOptions;

  const canhBao = canhBaoGiaSan(dong, km);
  const ngaySai = ngayBatDau !== '' && ngayKetThuc !== '' && ngayBatDau > ngayKetThuc;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({
      hoiVienId,
      locationId,
      dong,
      khuyenMai: km,
      ngayBatDau: ngayBatDau || undefined,
      ngayKetThuc: ngayKetThuc || undefined,
      ghiChu: ghiChu.trim() || undefined,
    });
  }

  const chanLuu = hoiVienId === '' || locationId === '' || dong.length === 0 || ngaySai;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField label={t('hopDong.timHoiVien')} htmlFor={`${uid}-tim`}>
        <input
          id={`${uid}-tim`}
          type="search"
          className="field"
          placeholder={t('hopDong.tenHoacSdt')}
          value={hoiVienSearch}
          onChange={(e) => onHoiVienSearchChange(e.target.value)}
        />
      </FormField>

      <FormField
        label={t('chung.hoiVien')}
        htmlFor={`${uid}-hv`}
        error={fieldErrors.hoiVienId}
        required
      >
        <select
          id={`${uid}-hv`}
          className="field"
          value={hoiVienId}
          onChange={(e) => setHoiVienId(e.target.value)}
        >
          <option value="">{t('hopDong.chonHoiVien')}</option>
          {dsHoiVien.map((h) => (
            <option key={h.id} value={h.id}>
              {h.hoTen} · {h.soDienThoai}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label={t('chung.cauLacBo')}
        htmlFor={`${uid}-clb`}
        error={fieldErrors.locationId}
        required
      >
        <select
          id={`${uid}-clb`}
          className="field"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </FormField>

      <div className="space-y-1">
        <span className="text-sm font-medium text-ink">
          {t('hopDong.dongSanPham')} <span className="text-bad">*</span>
        </span>
        <DongSanPham dong={dong} sanPham={sanPham} khuyenMai={km} onChange={setDong} />
      </div>

      <FormField
        label={t('khuyenMai.nhom')}
        htmlFor={`${uid}-km`}
        hint={t('hopDong.apChoCaHopDong')}
      >
        <select
          id={`${uid}-km`}
          className="field"
          value={kmId}
          onChange={(e) => setKmId(e.target.value)}
        >
          <option value="">{t('hopDong.khongApDung')}</option>
          {khuyenMai.map((k) => (
            <option key={k.id} value={k.id}>
              {k.ma} — {k.ten}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <FormField
          label={t('hopDong.ngayBatDauHieuLuc')}
          htmlFor={`${uid}-bd`}
          error={fieldErrors.ngayBatDau}
          hint={t('hopDong.batBuocTruocKichHoat')}
        >
          <input
            id={`${uid}-bd`}
            type="date"
            className="field"
            value={ngayBatDau}
            onChange={(e) => setNgayBatDau(e.target.value)}
          />
        </FormField>
        <FormField
          label={t('hopDong.ngayKetThuc')}
          htmlFor={`${uid}-kt`}
          error={ngaySai ? t('hopDong.ngaySai') : fieldErrors.ngayKetThuc}
        >
          <input
            id={`${uid}-kt`}
            type="date"
            className="field"
            value={ngayKetThuc}
            onChange={(e) => setNgayKetThuc(e.target.value)}
          />
        </FormField>
      </div>

      <FormField label={t('chung.ghiChu')} htmlFor={`${uid}-gc`} error={fieldErrors.ghiChu}>
        <textarea
          id={`${uid}-gc`}
          className="field min-h-16"
          value={ghiChu}
          onChange={(e) => setGhiChu(e.target.value)}
        />
      </FormField>

      <BangTongTien dong={dong} khuyenMai={km} />

      {canhBao ? (
        <p className="text-xs text-warn">
          {t('hopDong.luuVanDuocNhungChanChot')}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          {t('action.huy')}
        </Button>
        <Button type="submit" disabled={chanLuu || submitting}>
          {submitting ? t('state.dangLuu') : (submitLabel ?? t('hopDong.luuBaoGia'))}
        </Button>
      </div>
    </form>
  );
}
