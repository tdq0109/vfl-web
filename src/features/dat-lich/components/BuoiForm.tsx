'use client';

import { useId, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, FormField } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import type { Location } from '@/lib/api/types';
import { fmtDate } from '@/lib/format';
import { useLichHlv } from '../hooks/useLich';
import {
  khungGio,
  kiemTraKhoangGio,
  kiemTraSucChua,
  moTaTrungLich,
  ngayCua,
  timTrungLichHlv,
} from '../lich';
import {
  LOAI_BUOI_KHOA,
  LOAI_BUOI_ORDER,
  SUC_CHUA_MAC_DINH,
  type BuoiInput,
  type HuanLuyenVien,
  type LoaiBuoi,
} from '../types';

/* Form tạo / sửa buổi.

   Điểm quan trọng: dò trùng lịch HLV ngay khi nhập, trước khi bấm lưu. Người
   xếp lịch thấy luôn buổi nào đang chặn và ở CLB nào, thay vì bấm lưu rồi mới
   ăn lỗi 400 và phải đoán.

   Dò ở đây chỉ để báo sớm; backend vẫn phải kiểm tra lại, vì giữa lúc mở form
   và lúc bấm lưu thì người khác có thể đã xếp mất chỗ đó. */

interface Props {
  defaultValue?: Partial<BuoiInput>;
  /** Id buổi đang sửa — để loại chính nó khỏi phép dò trùng. */
  buoiId?: string;
  hlvs: HuanLuyenVien[];
  locations: Location[];
  fieldErrors?: Record<string, string>;
  submitting?: boolean;
  /** Bỏ trống thì dùng "Lưu". */
  submitLabel?: string;
  onSubmit: (input: BuoiInput) => void;
  onCancel: () => void;
}

export function BuoiForm({
  defaultValue,
  buoiId,
  hlvs,
  locations,
  fieldErrors = {},
  submitting = false,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const t = useT();
  const uid = useId();
  const [v, setV] = useState<BuoiInput>({
    loai: defaultValue?.loai ?? 'lop',
    ten: defaultValue?.ten ?? '',
    hlvId: defaultValue?.hlvId,
    locationId: defaultValue?.locationId ?? locations[0]?.id ?? '',
    batDau: defaultValue?.batDau ?? '',
    ketThuc: defaultValue?.ketThuc ?? '',
    sucChua: defaultValue?.sucChua ?? SUC_CHUA_MAC_DINH[defaultValue?.loai ?? 'lop'],
  });

  function set<K extends keyof BuoiInput>(key: K, value: BuoiInput[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  /** Đổi loại thì kéo sức chứa về mặc định của loại đó. */
  function doiLoai(loai: LoaiBuoi) {
    setV((prev) => ({ ...prev, loai, sucChua: SUC_CHUA_MAC_DINH[loai] }));
  }

  const loiGio = kiemTraKhoangGio(v.batDau, v.ketThuc);
  const loiSucChua = kiemTraSucChua(v.loai, v.sucChua);

  /* Lịch HLV cả tuần chứa ngày đang xếp, mọi CLB. */
  const ngay = v.batDau ? ngayCua(v.batDau) : '';
  const lichHlv = useLichHlv(v.hlvId, ngay);

  const trung = useMemo(
    () =>
      timTrungLichHlv(
        { hlvId: v.hlvId, batDau: v.batDau, ketThuc: v.ketThuc, boQuaId: buoiId },
        lichHlv.data ?? [],
      ),
    [v.hlvId, v.batDau, v.ketThuc, buoiId, lichHlv.data],
  );
  const loiTrung = moTaTrungLich(trung);

  const coLoi = Boolean(loiGio || loiSucChua || loiTrung);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (coLoi) return;
    onSubmit({ ...v, ten: v.ten.trim(), hlvId: v.hlvId || undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField label={t('datLich.loaiBuoi')} htmlFor={`${uid}-loai`} error={fieldErrors.loai} required>
        <select
          id={`${uid}-loai`}
          className="field"
          value={v.loai}
          onChange={(e) => doiLoai(e.target.value as LoaiBuoi)}
        >
          {LOAI_BUOI_ORDER.map((l) => (
            <option key={l} value={l}>
              {t(LOAI_BUOI_KHOA[l])}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label={t('datLich.tenBuoi')} htmlFor={`${uid}-ten`} error={fieldErrors.ten} required>
        <input
          id={`${uid}-ten`}
          className="field"
          value={v.ten}
          onChange={(e) => set('ten', e.target.value)}
          required
        />
      </FormField>

      <FormField
        label={t('datLich.huanLuyenVien')}
        htmlFor={`${uid}-hlv`}
        error={fieldErrors.hlvId}
        hint={t('datLich.boTrongChuaPhanCong')}
      >
        <select
          id={`${uid}-hlv`}
          className="field"
          value={v.hlvId ?? ''}
          onChange={(e) => set('hlvId', e.target.value || undefined)}
        >
          <option value="">{t('datLich.chuaPhan')}</option>
          {hlvs.map((h) => (
            <option key={h.id} value={h.id}>
              {h.hoTen}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('datLich.batDau')} htmlFor={`${uid}-bd`} error={fieldErrors.batDau} required>
          <input
            id={`${uid}-bd`}
            type="datetime-local"
            className="field"
            value={v.batDau}
            onChange={(e) => set('batDau', e.target.value)}
            required
          />
        </FormField>

        <FormField
          label={t('datLich.ketThuc')}
          htmlFor={`${uid}-kt`}
          /* loiGio là khoá i18n do kiemTraKhoangGio() trả về. */
          error={fieldErrors.ketThuc ?? (loiGio ? t(loiGio) : undefined)}
          required
        >
          <input
            id={`${uid}-kt`}
            type="datetime-local"
            className="field"
            value={v.ketThuc}
            onChange={(e) => set('ketThuc', e.target.value)}
            required
          />
        </FormField>
      </div>

      {/* Cảnh báo trùng lịch HLV — hiện ngay khi vừa đủ dữ liệu */}
      {loiTrung ? (
        <div className="space-y-1 rounded-control bg-pill-bad-bg px-3 py-2 text-xs text-pill-bad-fg">
          <p className="flex items-center gap-1 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" />
            {/* `loiTrung` là KHOÁ; số buổi trùng do màn truyền vào. */}
            {t(loiTrung, { so: trung.length })}
          </p>
          <ul className="space-y-0.5">
            {trung.slice(0, 4).map((b) => (
              <li key={b.id}>
                {fmtDate(ngayCua(b.batDau))} · {khungGio(b.batDau, b.ketThuc)}
              </li>
            ))}
          </ul>
          <p className="pt-0.5">{t('datLich.doiGioHoacHlv')}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label={t('chung.cauLacBo')}
          htmlFor={`${uid}-clb`}
          error={fieldErrors.locationId}
          required
        >
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

        <FormField
          label={t('datLich.sucChua')}
          htmlFor={`${uid}-sc`}
          error={fieldErrors.sucChua ?? (loiSucChua ? t(loiSucChua) : undefined)}
          required
        >
          <input
            id={`${uid}-sc`}
            type="number"
            min={1}
            className="field text-right tabular-nums"
            value={v.sucChua}
            disabled={v.loai === 'pt'}
            onChange={(e) => set('sucChua', Number(e.target.value))}
            required
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('action.huy')}
        </Button>
        <Button type="submit" disabled={submitting || coLoi}>
          {submitting ? t('state.dangLuu') : (submitLabel ?? t('action.luu'))}
        </Button>
      </div>
    </form>
  );
}
