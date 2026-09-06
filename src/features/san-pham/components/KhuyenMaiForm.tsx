'use client';

import { useId, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, FormField, MoneyInput } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { money } from '@/lib/format';
import { giaSauGiam, kiemTraGiaTriGiam, kiemTraKhoangNgay, viPhamGiaSan } from '../gia';
import {
  LOAI_GIAM_KHOA,
  LOAI_GIAM_ORDER,
  type KhuyenMaiInput,
  type LoaiGiam,
  type SanPham,
} from '../types';

/* Form khuyến mãi. Điểm đáng giá nhất là khối xem trước ở cuối: nhập xong thấy
   ngay chương trình này kéo sản phẩm nào xuống dưới giá sàn, trước khi lưu. */

interface Props {
  defaultValue?: Partial<KhuyenMaiInput>;
  sanPhams: SanPham[];
  fieldErrors?: Record<string, string>;
  submitting?: boolean;
  /** Bỏ trống thì dùng "Lưu". */
  submitLabel?: string;
  onSubmit: (input: KhuyenMaiInput) => void;
  onCancel: () => void;
}

export function KhuyenMaiForm({
  defaultValue,
  sanPhams,
  fieldErrors = {},
  submitting = false,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const t = useT();
  const uid = useId();
  const [v, setV] = useState<KhuyenMaiInput>({
    ma: defaultValue?.ma ?? '',
    ten: defaultValue?.ten ?? '',
    loaiGiam: defaultValue?.loaiGiam ?? 'phan-tram',
    giaTri: defaultValue?.giaTri ?? 0,
    tuNgay: defaultValue?.tuNgay ?? '',
    denNgay: defaultValue?.denNgay ?? '',
    sanPhamIds: defaultValue?.sanPhamIds ?? [],
    kichHoat: defaultValue?.kichHoat ?? true,
  });

  function set<K extends keyof KhuyenMaiInput>(key: K, value: KhuyenMaiInput[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  const loiGiaTri = kiemTraGiaTriGiam(v.loaiGiam, v.giaTri);
  const loiNgay = kiemTraKhoangNgay(v.tuNgay, v.denNgay);

  const phamVi =
    v.sanPhamIds && v.sanPhamIds.length > 0
      ? sanPhams.filter((sp) => v.sanPhamIds?.includes(sp.id))
      : sanPhams;
  const viPham = loiGiaTri ? [] : phamVi.filter((sp) => viPhamGiaSan(sp, v));

  function toggleSanPham(id: string) {
    const cur = v.sanPhamIds ?? [];
    set('sanPhamIds', cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loiGiaTri || loiNgay) return;
    onSubmit({
      ...v,
      ma: v.ma.trim().toUpperCase(),
      ten: v.ten.trim(),
      sanPhamIds: v.sanPhamIds && v.sanPhamIds.length > 0 ? v.sanPhamIds : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField
        label={t('khuyenMai.maChuongTrinh')}
        htmlFor={`${uid}-ma`}
        error={fieldErrors.ma}
        required
      >
        <input
          id={`${uid}-ma`}
          className="field uppercase"
          value={v.ma}
          onChange={(e) => set('ma', e.target.value)}
          required
        />
      </FormField>

      <FormField
        label={t('khuyenMai.tenChuongTrinh')}
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

      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('khuyenMai.kieuGiam')} htmlFor={`${uid}-loai`} error={fieldErrors.loaiGiam}>
          <select
            id={`${uid}-loai`}
            className="field"
            value={v.loaiGiam}
            onChange={(e) => set('loaiGiam', e.target.value as LoaiGiam)}
          >
            {LOAI_GIAM_ORDER.map((l) => (
              <option key={l} value={l}>
                {t(LOAI_GIAM_KHOA[l])}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label={
            v.loaiGiam === 'phan-tram' ? t('khuyenMai.phanTramGiam') : t('khuyenMai.soTienGiam')
          }
          htmlFor={`${uid}-gt`}
          /* `loiGiaTri` là KHOÁ i18n do `kiemTraGiaTriGiam()` trả về. */
          error={fieldErrors.giaTri ?? (loiGiaTri ? t(loiGiaTri) : undefined)}
          required
        >
          {v.loaiGiam === 'phan-tram' ? (
            <input
              id={`${uid}-gt`}
              type="number"
              min={1}
              max={100}
              className="field text-right tabular-nums"
              value={v.giaTri || ''}
              onChange={(e) => set('giaTri', Number(e.target.value))}
              required
            />
          ) : (
            <MoneyInput id={`${uid}-gt`} value={v.giaTri} onValueChange={(n) => set('giaTri', n)} />
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('chung.tuNgay')} htmlFor={`${uid}-tu`} error={fieldErrors.tuNgay} required>
          <input
            id={`${uid}-tu`}
            type="date"
            className="field"
            value={v.tuNgay}
            onChange={(e) => set('tuNgay', e.target.value)}
            required
          />
        </FormField>

        <FormField
          label={t('chung.denNgay')}
          htmlFor={`${uid}-den`}
          error={fieldErrors.denNgay ?? (loiNgay ? t(loiNgay) : undefined)}
          required
        >
          <input
            id={`${uid}-den`}
            type="date"
            className="field"
            value={v.denNgay}
            onChange={(e) => set('denNgay', e.target.value)}
            required
          />
        </FormField>
      </div>

      <FormField
        label={t('khuyenMai.apDungCho')}
        error={fieldErrors.sanPhamIds}
        hint={t('khuyenMai.khongChonLaTatCa')}
      >
        <div className="max-h-48 space-y-1 overflow-auto rounded-control border border-line p-2">
          {sanPhams.map((sp) => (
            /* checkbox KHÔNG dùng class `.field` — `w-full` sẽ kéo dài thành khung */
            <label key={sp.id} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line accent-brand"
                checked={v.sanPhamIds?.includes(sp.id) ?? false}
                onChange={() => toggleSanPham(sp.id)}
              />
              <span className="flex-1">{sp.ten}</span>
              <span className="tabular-nums text-muted">{money(sp.giaNiemYet)}</span>
            </label>
          ))}
        </div>
      </FormField>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-line accent-brand"
          checked={v.kichHoat}
          onChange={(e) => set('kichHoat', e.target.checked)}
        />
        {t('khuyenMai.kichHoatNgay')}
      </label>

      {viPham.length > 0 ? (
        <div className="space-y-1 rounded-control bg-pill-warn-bg px-3 py-2 text-xs text-pill-warn-fg">
          <p className="flex items-center gap-1 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t('khuyenMai.sePhaGiaSan', { so: viPham.length })}
          </p>
          <ul className="space-y-0.5">
            {viPham.slice(0, 5).map((sp) => (
              <li key={sp.id}>
                {t('khuyenMai.dongViPham', {
                  ten: sp.ten,
                  gia: money(giaSauGiam(sp.giaNiemYet, v)),
                  giaSan: money(sp.giaSan),
                })}
              </li>
            ))}
            {viPham.length > 5 ? (
              <li>{t('khuyenMai.vaConNua', { so: viPham.length - 5 })}</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('action.huy')}
        </Button>
        <Button type="submit" disabled={submitting || loiGiaTri !== null || loiNgay !== null}>
          {submitting ? t('state.dangLuu') : (submitLabel ?? t('action.luu'))}
        </Button>
      </div>
    </form>
  );
}
