'use client';

import { useId, useState } from 'react';
import { Button, FormField } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import type { Location } from '@/lib/api/types';
import { GIOI_TINH_KHOA, GIOI_TINH_ORDER, type GioiTinh, type HoiVienInput } from '../types';

/* Form thêm / sửa. Giữ state nhập tại chỗ (state UI, không phải nghiệp vụ);
   khi gửi gọi `onSubmit` với dữ liệu đã dọn. Lỗi field do màn truyền vào từ
   `mutation.error`. */

interface Props {
  defaultValue?: Partial<HoiVienInput>;
  locations: Location[];
  fieldErrors?: Record<string, string>;
  submitting?: boolean;
  /** KHOÁ i18n của nhãn nút gửi, không phải chữ hiển thị. Hậu tố `Khoa` để
      truyền nhầm chữ tiếng Việt vào đây là nhìn thấy ngay. */
  submitLabelKhoa?: string;
  onSubmit: (input: HoiVienInput) => void;
  onCancel: () => void;
}

export function HoiVienForm({
  defaultValue,
  locations,
  fieldErrors = {},
  submitting = false,
  submitLabelKhoa = 'action.luu',
  onSubmit,
  onCancel,
}: Props) {
  const t = useT();
  const uid = useId();
  const [v, setV] = useState<HoiVienInput>({
    hoTen: defaultValue?.hoTen ?? '',
    soDienThoai: defaultValue?.soDienThoai ?? '',
    email: defaultValue?.email ?? '',
    gioiTinh: defaultValue?.gioiTinh,
    ngaySinh: defaultValue?.ngaySinh ?? '',
    locationId: defaultValue?.locationId ?? locations[0]?.id ?? '',
    ghiChu: defaultValue?.ghiChu ?? '',
  });

  function set<K extends keyof HoiVienInput>(key: K, value: HoiVienInput[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({
      hoTen: v.hoTen.trim(),
      soDienThoai: v.soDienThoai.trim(),
      email: v.email?.trim() || undefined,
      gioiTinh: v.gioiTinh,
      ngaySinh: v.ngaySinh || undefined,
      locationId: v.locationId,
      ghiChu: v.ghiChu?.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField label={t('chung.hoTen')} htmlFor={`${uid}-hoTen`} error={fieldErrors.hoTen} required>
        <input
          id={`${uid}-hoTen`}
          className="field"
          value={v.hoTen}
          onChange={(e) => set('hoTen', e.target.value)}
          required
        />
      </FormField>

      <FormField
        label={t('chung.soDienThoai')}
        htmlFor={`${uid}-sdt`}
        error={fieldErrors.soDienThoai}
        required
      >
        <input
          id={`${uid}-sdt`}
          className="field"
          inputMode="tel"
          value={v.soDienThoai}
          onChange={(e) => set('soDienThoai', e.target.value)}
          required
        />
      </FormField>

      <FormField label={t('chung.email')} htmlFor={`${uid}-email`} error={fieldErrors.email}>
        <input
          id={`${uid}-email`}
          type="email"
          className="field"
          value={v.email ?? ''}
          onChange={(e) => set('email', e.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('chung.gioiTinh')} htmlFor={`${uid}-gt`} error={fieldErrors.gioiTinh}>
          <select
            id={`${uid}-gt`}
            className="field"
            value={v.gioiTinh ?? ''}
            onChange={(e) => set('gioiTinh', (e.target.value || undefined) as GioiTinh | undefined)}
          >
            <option value="">—</option>
            {GIOI_TINH_ORDER.map((g) => (
              <option key={g} value={g}>
                {t(GIOI_TINH_KHOA[g])}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={t('chung.ngaySinh')} htmlFor={`${uid}-ns`} error={fieldErrors.ngaySinh}>
          <input
            id={`${uid}-ns`}
            type="date"
            className="field"
            value={v.ngaySinh ?? ''}
            onChange={(e) => set('ngaySinh', e.target.value)}
          />
        </FormField>
      </div>

      <FormField label={t('chung.cauLacBo')} htmlFor={`${uid}-clb`} error={fieldErrors.locationId} required>
        <select
          id={`${uid}-clb`}
          className="field"
          value={v.locationId}
          onChange={(e) => set('locationId', e.target.value)}
          required
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label={t('chung.ghiChu')} htmlFor={`${uid}-gc`} error={fieldErrors.ghiChu}>
        <textarea
          id={`${uid}-gc`}
          className="field min-h-20"
          value={v.ghiChu ?? ''}
          onChange={(e) => set('ghiChu', e.target.value)}
        />
      </FormField>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('action.huy')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? t('state.dangLuu') : t(submitLabelKhoa)}
        </Button>
      </div>
    </form>
  );
}
