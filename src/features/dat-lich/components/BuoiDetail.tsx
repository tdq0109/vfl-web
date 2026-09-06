'use client';

import { useState, type ReactNode } from 'react';
import { Clock, UserPlus, X } from 'lucide-react';
import { Button, Pill } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { fmtDate, fmtDateTime } from '@/lib/format';
import {
  choDatConHieuLuc,
  conCho,
  khungGio,
  ngayCua,
  soChoConLai,
  trangThaiBuoi,
  viSaoKhongDatDuoc,
} from '../lich';
import {
  LOAI_BUOI_KHOA,
  TRANG_THAI_BUOI_KHOA,
  type Buoi,
  type TrangThaiBuoi,
} from '../types';

const TONE: Record<TrangThaiBuoi, 'ok' | 'warn' | 'bad' | 'default'> = {
  mo: 'ok',
  day: 'warn',
  'da-huy': 'bad',
  'da-xong': 'default',
};

interface Props {
  buoi: Buoi;
  canEdit: boolean;
  pending?: boolean;
  onGiuCho: (hoiVienId: string) => void;
  onChotCho: (choId: string) => void;
  onBoCho: (choId: string) => void;
  onVaoHangCho: (hoiVienId: string) => void;
  onRoiHangCho: (choDoiId: string) => void;
  onHuyBuoi: () => void;
  onEdit: () => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-2 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{children}</span>
    </div>
  );
}

export function BuoiDetail({
  buoi,
  canEdit,
  pending,
  onGiuCho,
  onChotCho,
  onBoCho,
  onVaoHangCho,
  onRoiHangCho,
  onHuyBuoi,
  onEdit,
}: Props) {
  const t = useT();
  const [hoiVienId, setHoiVienId] = useState('');

  const trangThai = trangThaiBuoi(buoi);
  const conLai = soChoConLai(buoi);
  const cho = choDatConHieuLuc(buoi.daDat);
  const lyDo = hoiVienId ? viSaoKhongDatDuoc(buoi, hoiVienId) : null;
  const datDuoc = hoiVienId !== '' && lyDo === null;
  /* Đầy chỗ mà buổi chưa huỷ / chưa xong thì mới cho vào hàng chờ. */
  const vaoHangChoDuoc =
    hoiVienId !== '' && !conCho(buoi) && trangThai !== 'da-huy' && trangThai !== 'da-xong';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Pill tone={TONE[trangThai]}>{t(TRANG_THAI_BUOI_KHOA[trangThai])}</Pill>
        {canEdit && trangThai !== 'da-huy' ? (
          <Button size="sm" variant="ghost" onClick={onEdit}>
            {t('action.sua')}
          </Button>
        ) : null}
      </div>

      <div className="divide-y divide-line">
        <Row label={t('datLich.tenBuoi')}>{buoi.ten}</Row>
        <Row label={t('chung.loai')}>{t(LOAI_BUOI_KHOA[buoi.loai])}</Row>
        <Row label={t('datLich.thoiGian')}>
          {fmtDate(ngayCua(buoi.batDau))} · {khungGio(buoi.batDau, buoi.ketThuc)}
        </Row>
        <Row label={t('datLich.hlv')}>{buoi.hlvTen ?? t('datLich.chuaPhanCong')}</Row>
        <Row label={t('chung.cauLacBo')}>{buoi.locationName ?? buoi.locationId}</Row>
        <Row label={t('datLich.cho')}>
          <span className="tabular-nums">
            {t('datLich.choConLai', { daDat: cho.length, sucChua: buoi.sucChua, conLai })}
          </span>
        </Row>
      </div>

      {/* Thêm người vào buổi */}
      {canEdit && trangThai !== 'da-huy' && trangThai !== 'da-xong' ? (
        <div className="space-y-2 rounded-control border border-line p-3">
          <label htmlFor="hv-id" className="text-sm font-medium text-ink">
            {t('datLich.themHoiVien')}
          </label>
          <input
            id="hv-id"
            className="field"
            placeholder={t('datLich.maHoiVien')}
            value={hoiVienId}
            onChange={(e) => setHoiVienId(e.target.value.trim())}
          />
          {/* `lyDo` là KHOÁ i18n do `viSaoKhongDatDuoc()` trả về — dịch tại đây. */}
          {lyDo ? <p className="text-xs text-warn">{t(lyDo)}</p> : null}

          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!datDuoc || pending}
              onClick={() => {
                onGiuCho(hoiVienId);
                setHoiVienId('');
              }}
            >
              <UserPlus className="h-4 w-4" />
              {t('datLich.giuCho')}
            </Button>
            <Button
              size="sm"
              variant="subtle"
              disabled={!vaoHangChoDuoc || pending}
              onClick={() => {
                onVaoHangCho(hoiVienId);
                setHoiVienId('');
              }}
            >
              <Clock className="h-4 w-4" />
              {t('datLich.vaoHangCho')}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Danh sách chỗ */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted">
          {t('datLich.daDatSo', { so: cho.length })}
        </h3>
        {cho.length === 0 ? (
          <p className="text-sm text-muted">{t('datLich.chuaCoAiDat')}</p>
        ) : (
          <ul className="divide-y divide-line">
            {cho.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-ink">{c.hoiVienTen}</span>
                {c.giuCho ? (
                  <span
                    className="shrink-0 text-xs text-warn"
                    title={
                      c.giuChoDenLuc
                        ? t('datLich.giuDenLuc', { luc: fmtDateTime(c.giuChoDenLuc) })
                        : undefined
                    }
                  >
                    {t('datLich.dangGiu')}
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-ok">{t('datLich.daChot')}</span>
                )}
                {canEdit ? (
                  <span className="flex shrink-0 gap-1">
                    {c.giuCho ? (
                      <Button size="sm" variant="subtle" disabled={pending} onClick={() => onChotCho(c.id)}>
                        {t('datLich.chot')}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={t('datLich.boChoCua', { ten: c.hoiVienTen })}
                      disabled={pending}
                      onClick={() => onBoCho(c.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Hàng chờ */}
      {buoi.hangCho.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted">
            {t('datLich.hangChoSoNguoi', { so: buoi.hangCho.length })}
          </h3>
          <ul className="divide-y divide-line">
            {buoi.hangCho.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="w-6 shrink-0 tabular-nums text-muted">{c.thuTu}.</span>
                <span className="min-w-0 flex-1 truncate text-ink">{c.hoiVienTen}</span>
                {canEdit ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t('datLich.roiHangChoCua', { ten: c.hoiVienTen })}
                    disabled={pending}
                    onClick={() => onRoiHangCho(c.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {canEdit && trangThai !== 'da-huy' ? (
        <Button variant="danger" size="sm" disabled={pending} onClick={onHuyBuoi}>
          {t('datLich.huyBuoi')}
        </Button>
      ) : null}
    </div>
  );
}
