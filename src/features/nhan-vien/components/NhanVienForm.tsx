'use client';

import { useId, useState } from 'react';
import { Button, FormField } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import type { Location } from '@/lib/api/types';
import type { NhanVienInput } from '../types';

/* Form thêm / sửa HỒ SƠ. Vai trò và cờ toàn hệ thống KHÔNG ở đây — chúng có
   khối riêng (`VaiTroPanel`) vì chịu kiểm tra phân quyền chặt hơn. */

interface Props {
  defaultValue?: Partial<NhanVienInput>;
  locations: Location[];
  fieldErrors?: Record<string, string>;
  submitting?: boolean;
  /** Bỏ trống thì dùng "Lưu". */
  submitLabel?: string;
  onSubmit: (input: NhanVienInput) => void;
  onCancel: () => void;
}

export function NhanVienForm({
  defaultValue,
  locations,
  fieldErrors = {},
  submitting = false,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const t = useT();
  const uid = useId();
  const [v, setV] = useState<NhanVienInput>({
    hoTen: defaultValue?.hoTen ?? '',
    soDienThoai: defaultValue?.soDienThoai ?? '',
    email: defaultValue?.email ?? '',
    locationId: defaultValue?.locationId ?? locations[0]?.id ?? '',
    ngayVaoLam: defaultValue?.ngayVaoLam ?? '',
    ghiChu: defaultValue?.ghiChu ?? '',
  });

  function set<K extends keyof NhanVienInput>(key: K, value: NhanVienInput[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({
      hoTen: v.hoTen.trim(),
      soDienThoai: v.soDienThoai.trim(),
      email: v.email.trim(),
      locationId: v.locationId,
      ngayVaoLam: v.ngayVaoLam || undefined,
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

      <FormField
        label={t('chung.email')}
        htmlFor={`${uid}-email`}
        error={fieldErrors.email}
        hint={t('nhanVien.emailLaTaiKhoan')}
        required
      >
        <input
          id={`${uid}-email`}
          type="email"
          className="field"
          value={v.email}
          onChange={(e) => set('email', e.target.value)}
          required
        />
      </FormField>

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

      <FormField label={t('nhanVien.ngayVaoLam')} htmlFor={`${uid}-nvl`} error={fieldErrors.ngayVaoLam}>
        <input
          id={`${uid}-nvl`}
          type="date"
          className="field"
          value={v.ngayVaoLam ?? ''}
          onChange={(e) => set('ngayVaoLam', e.target.value)}
        />
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
          {submitting ? t('state.dangLuu') : (submitLabel ?? t('action.luu'))}
        </Button>
      </div>
    </form>
  );
}
