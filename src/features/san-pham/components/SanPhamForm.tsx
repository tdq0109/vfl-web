'use client';

import { useId, useState } from 'react';
import { Button, FormField, MoneyInput } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import type { Location } from '@/lib/api/types';
import { money } from '@/lib/format';
import {
  LOAI_SAN_PHAM_KHOA,
  LOAI_SAN_PHAM_ORDER,
  type LoaiSanPham,
  type SanPhamInput,
} from '../types';

/* Form thêm / sửa sản phẩm. Giá sàn không ở đây — nó có khối riêng
   (GiaSanPanel) vì chỉ Giám đốc trở lên đặt được. */

interface Props {
  defaultValue?: Partial<SanPhamInput>;
  /** Giá sàn hiện tại, chỉ để cảnh báo khi nhập giá niêm yết thấp hơn. */
  giaSanHienTai?: number;
  locations: Location[];
  fieldErrors?: Record<string, string>;
  submitting?: boolean;
  /** Bỏ trống thì dùng "Lưu". */
  submitLabel?: string;
  onSubmit: (input: SanPhamInput) => void;
  onCancel: () => void;
}

/** Loại có ràng buộc thời hạn / số buổi. */
const CO_GOI = new Set<LoaiSanPham>(['goi-tap', 'dich-vu']);

export function SanPhamForm({
  defaultValue,
  giaSanHienTai,
  locations,
  fieldErrors = {},
  submitting = false,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const t = useT();
  const uid = useId();
  const [v, setV] = useState<SanPhamInput>({
    ten: defaultValue?.ten ?? '',
    loai: defaultValue?.loai ?? 'goi-tap',
    moTa: defaultValue?.moTa ?? '',
    giaNiemYet: defaultValue?.giaNiemYet ?? 0,
    thoiHanNgay: defaultValue?.thoiHanNgay,
    soBuoi: defaultValue?.soBuoi,
    locationId: defaultValue?.locationId,
  });

  function set<K extends keyof SanPhamInput>(key: K, value: SanPhamInput[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  /* Cảnh báo tại chỗ: hạ giá niêm yết xuống dưới giá sàn thì không bán được.
     Chỉ nhắc, không chặn — backend mới là nơi quyết. */
  const duoiGiaSan =
    giaSanHienTai !== undefined && v.giaNiemYet > 0 && v.giaNiemYet < giaSanHienTai;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const coGoi = CO_GOI.has(v.loai);
    onSubmit({
      ten: v.ten.trim(),
      loai: v.loai,
      moTa: v.moTa?.trim() || undefined,
      giaNiemYet: v.giaNiemYet,
      thoiHanNgay: coGoi ? v.thoiHanNgay : undefined,
      soBuoi: coGoi ? v.soBuoi : undefined,
      locationId: v.locationId || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField
        label={t('sanPham.tenSanPham')}
        htmlFor={`${uid}-ten`}
        error={fieldErrors.ten}
        required
      >
        <input
          id={`${uid}-ten`}
          className="field"
          value={v.ten}
          onChange={(e) => set('ten', e.target.value)}
          required
        />
      </FormField>

      <FormField label={t('chung.loai')} htmlFor={`${uid}-loai`} error={fieldErrors.loai} required>
        <select
          id={`${uid}-loai`}
          className="field"
          value={v.loai}
          onChange={(e) => set('loai', e.target.value as LoaiSanPham)}
        >
          {LOAI_SAN_PHAM_ORDER.map((l) => (
            <option key={l} value={l}>
              {t(LOAI_SAN_PHAM_KHOA[l])}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label={t('sanPham.giaNiemYet')}
        htmlFor={`${uid}-gia`}
        error={fieldErrors.giaNiemYet}
        hint={
          duoiGiaSan
            ? undefined
            : giaSanHienTai !== undefined
              ? t('sanPham.giaSanHienTai', { soTien: money(giaSanHienTai) })
              : undefined
        }
        required
      >
        <MoneyInput
          id={`${uid}-gia`}
          value={v.giaNiemYet}
          onValueChange={(n) => set('giaNiemYet', n)}
        />
      </FormField>

      {duoiGiaSan ? (
        <p className="rounded-control bg-pill-warn-bg px-3 py-2 text-xs text-pill-warn-fg">
          {t('sanPham.duoiGiaSanCanhBao', { soTien: money(giaSanHienTai) })}
        </p>
      ) : null}

      {CO_GOI.has(v.loai) ? (
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label={t('sanPham.thoiHanNgay')}
            htmlFor={`${uid}-han`}
            error={fieldErrors.thoiHanNgay}
          >
            <input
              id={`${uid}-han`}
              type="number"
              min={0}
              className="field"
              value={v.thoiHanNgay ?? ''}
              onChange={(e) =>
                set('thoiHanNgay', e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </FormField>

          <FormField label={t('sanPham.soBuoi')} htmlFor={`${uid}-buoi`} error={fieldErrors.soBuoi}>
            <input
              id={`${uid}-buoi`}
              type="number"
              min={0}
              className="field"
              value={v.soBuoi ?? ''}
              onChange={(e) => set('soBuoi', e.target.value ? Number(e.target.value) : undefined)}
            />
          </FormField>
        </div>
      ) : null}

      <FormField
        label={t('chung.cauLacBo')}
        htmlFor={`${uid}-clb`}
        error={fieldErrors.locationId}
        hint={t('sanPham.boTrongMoiClb')}
      >
        <select
          id={`${uid}-clb`}
          className="field"
          value={v.locationId ?? ''}
          onChange={(e) => set('locationId', e.target.value || undefined)}
        >
          <option value="">{t('chung.moiClb')}</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label={t('chung.moTa')} htmlFor={`${uid}-mota`} error={fieldErrors.moTa}>
        <textarea
          id={`${uid}-mota`}
          className="field min-h-20"
          value={v.moTa ?? ''}
          onChange={(e) => set('moTa', e.target.value)}
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
