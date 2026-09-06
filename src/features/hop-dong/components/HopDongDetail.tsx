'use client';

import { Ban, Pencil } from 'lucide-react';
import { Button, Table, Td, Th } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { PHUONG_THUC_KHOA } from '@/features/ban-hang-quay/types';
import type { UserProfile } from '@/lib/auth/types';
import type { TaiKhoanNhanTien } from '@/lib/api/types';
import { fmtDate, fmtDateTime, money } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  buocKeTiep,
  suaDuocNoiDung,
  thanhTienDong,
  tienDaThu,
  trangThaiHienThi,
  viSaoKhongChuyenDuoc,
} from '../hop-dong';
import { lyDoThanhChu } from '../lyDo';
import {
  HANH_DONG_KHOA,
  TRANG_THAI_HOP_DONG_KHOA,
  type HopDong,
  type ThanhToanInput,
  type TrangThaiHopDong,
} from '../types';
import { BangTongTien } from './BangTongTien';
import { KyHopDongForm } from './KyHopDongForm';
import { StepHopDong } from './StepHopDong';
import { ThuTienForm } from './ThuTienForm';
import { TrangThaiPill } from './TrangThaiPill';

/* Chi tiết hợp đồng + nút đi tiếp trong máy trạng thái.

   Mọi quyết định "được đi tiếp hay không" lấy từ viSaoKhongChuyenDuoc(), đừng
   viết lại điều kiện ở đây. Nút bị chặn thì hiện luôn câu lý do bên dưới. */

interface Props {
  hopDong: HopDong;
  actor: Pick<UserProfile, 'id' | 'role'>;
  /** Tài khoản của CLB BÁN hợp đồng — xem ghi chú ở `ThuTienForm`. */
  taiKhoanNhanTien?: TaiKhoanNhanTien;
  chuyenPending?: boolean;
  thuPending?: boolean;
  thuFieldErrors?: Record<string, string>;
  onEdit: () => void;
  /** `chuKy` chỉ đi kèm ở bước ký; các bước khác bỏ trống. */
  onChuyen: (den: TrangThaiHopDong, chuKy?: string | null) => void;
  onThanhToan: (input: ThanhToanInput) => void;
}

function Muc({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="truncate text-sm text-ink">{children}</dd>
    </div>
  );
}

export function HopDongDetail({
  hopDong,
  actor,
  taiKhoanNhanTien,
  chuyenPending,
  thuPending,
  thuFieldErrors,
  onEdit,
  onChuyen,
  onThanhToan,
}: Props) {
  /* Nhóm Hợp đồng chưa chuyển i18n; `t` ở đây chỉ để đọc bảng nhãn phương
     thức thanh toán, vốn đã thành khoá cùng nhóm Quầy. */
  const t = useT();
  const ke = buocKeTiep(hopDong.trangThai);
  const lyDoChan = ke ? viSaoKhongChuyenDuoc(hopDong, ke, actor) : null;
  const huyDuoc = viSaoKhongChuyenDuoc(hopDong, 'da-huy', actor) === null;
  const daThu = tienDaThu(hopDong);
  /* Bước ký có khung ký tay riêng, nút của nó thay cho nút đi tiếp chung —
     nếu không thì cùng một hành động có hai nút, một cái nuốt mất chữ ký. */
  const dangKy = ke === 'da-ky' && lyDoChan === null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-bold text-ink">{hopDong.maHopDong}</div>
          <div className="text-sm text-muted">
            {hopDong.hoiVienTen}
            {hopDong.hoiVienSdt ? ` · ${hopDong.hoiVienSdt}` : ''}
          </div>
        </div>
        <TrangThaiPill status={trangThaiHienThi(hopDong)} />
      </div>

      <StepHopDong trangThai={hopDong.trangThai} />

      <dl className="grid grid-cols-2 gap-3">
        <Muc label={t('chung.cauLacBo')}>{hopDong.locationName ?? '—'}</Muc>
        <Muc label={t('hopDong.nguoiLap')}>{hopDong.nguoiLapTen}</Muc>
        <Muc label={t('hopDong.ngayLap')}>{fmtDate(hopDong.ngayLap)}</Muc>
        <Muc label={t('hopDong.hieuLuc')}>
          {hopDong.ngayBatDau
            ? `${fmtDate(hopDong.ngayBatDau)} → ${hopDong.ngayKetThuc ? fmtDate(hopDong.ngayKetThuc) : '—'}`
            : '—'}
        </Muc>
        {hopDong.nguoiXacMinhTen ? (
          <Muc label={t('hopDong.keToanXacMinh')}>{hopDong.nguoiXacMinhTen}</Muc>
        ) : null}
        {hopDong.ngayKy ? (
          <Muc label={t('hopDong.ngayKy')}>{fmtDate(hopDong.ngayKy)}</Muc>
        ) : null}
      </dl>

      <Table>
        <thead>
          <tr>
            <Th>{t('chung.sanPham')}</Th>
            <Th align="right">{t('hopDong.donGia')}</Th>
            <Th align="right">{t('chung.soLuongTat')}</Th>
            <Th align="right">{t('hopDong.thanhTien')}</Th>
          </tr>
        </thead>
        <tbody>
          {hopDong.dong.map((d) => (
            <tr key={d.sanPhamId}>
              <Td>{d.ten}</Td>
              <Td align="right">{money(d.donGia)}</Td>
              <Td align="right">{d.soLuong}</Td>
              <Td align="right" className="font-semibold">
                {money(thanhTienDong(d))}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <BangTongTien dong={hopDong.dong} khuyenMai={hopDong.khuyenMai} daThu={daThu} />

      {hopDong.thanhToan.length > 0 ? (
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-ink">{t('hopDong.phieuThu')}</h3>
          <ul className="divide-y divide-line text-sm">
            {/* Biến vòng lặp KHÔNG đặt tên `t` — `t` nay là hàm dịch của `useT()`. */}
            {hopDong.thanhToan.map((tt) => (
              <li key={tt.id} className="flex items-baseline justify-between gap-2 py-1.5">
                <span className={cn('text-muted', tt.daHuy && 'line-through')}>
                  {fmtDateTime(tt.luc)} · {t(PHUONG_THUC_KHOA[tt.phuongThuc])} · {tt.nguoiThuTen}
                  {tt.daHuy
                    ? tt.lyDoHuy
                      ? t('hopDong.daHuyPhieuCoLyDo', { lyDo: tt.lyDoHuy })
                      : t('hopDong.daHuyPhieu')
                    : ''}
                </span>
                <span
                  className={cn(
                    'shrink-0 font-semibold tabular-nums',
                    tt.daHuy ? 'text-muted line-through' : 'text-ink',
                  )}
                >
                  {money(tt.soTien)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hopDong.trangThai === 'cho-thu-tien' ? (
        <ThuTienForm
          hopDong={hopDong}
          taiKhoanNhanTien={taiKhoanNhanTien}
          submitting={thuPending}
          fieldErrors={thuFieldErrors}
          onSubmit={onThanhToan}
        />
      ) : null}

      {dangKy ? (
        <KyHopDongForm
          hopDong={hopDong}
          submitting={chuyenPending}
          onKy={(chuKy) => onChuyen('da-ky', chuKy)}
        />
      ) : null}

      {hopDong.chuKy ? (
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-ink">{t('hopDong.chuKyHoiVien')}</h3>
          {/* Ảnh là data URL PNG nền trong do chính khung ký sinh ra —
              `next/image` không thêm được gì cho ảnh nhúng, chỉ thêm cấu hình. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hopDong.chuKy.anh}
            alt={t('hopDong.chuKyCua', {
              ten: hopDong.chuKy.nguoiKyTen ?? hopDong.hoiVienTen,
            })}
            className="h-24 w-full max-w-xs rounded-control border border-line bg-surface object-contain"
          />
          <p className="text-xs text-muted">
            {hopDong.chuKy.nguoiKyTen ?? hopDong.hoiVienTen} · {fmtDateTime(hopDong.chuKy.luc)}
          </p>
        </div>
      ) : null}

      {hopDong.ghiChu ? (
        <p className="rounded-control bg-brand-tint px-3 py-2 text-sm text-ink">{hopDong.ghiChu}</p>
      ) : null}

      {hopDong.lichSu.length > 0 ? (
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-ink">{t('hopDong.nhatKy')}</h3>
          <ul className="space-y-1 text-sm text-muted">
            {hopDong.lichSu.map((m, i) => (
              <li key={`${m.luc}-${i}`}>
                {fmtDateTime(m.luc)} · {t(TRANG_THAI_HOP_DONG_KHOA[m.trangThai])} · {m.nguoiTen}
                {m.ghiChu ? ` — ${m.ghiChu}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2 border-t border-line pt-3">
        <div className="flex flex-wrap justify-end gap-2">
          {suaDuocNoiDung(hopDong) ? (
            <Button variant="ghost" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              {t('hopDong.suaBaoGia')}
            </Button>
          ) : null}
          {huyDuoc ? (
            <Button variant="ghost" onClick={() => onChuyen('da-huy')}>
              <Ban className="h-4 w-4" />
              {t(HANH_DONG_KHOA['da-huy'])}
            </Button>
          ) : null}
          {ke && !dangKy ? (
            <Button
              disabled={lyDoChan !== null || chuyenPending}
              onClick={() => onChuyen(ke)}
            >
              {chuyenPending ? t('hopDong.dangXuLy') : t(HANH_DONG_KHOA[ke])}
            </Button>
          ) : null}
        </div>
        {ke && lyDoChan ? (
          <p className="text-right text-xs text-warn">{lyDoThanhChu(t, lyDoChan)}</p>
        ) : null}
      </div>
    </div>
  );
}
