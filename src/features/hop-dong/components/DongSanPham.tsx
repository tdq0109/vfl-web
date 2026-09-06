'use client';

import { useId, useState } from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Button, MoneyInput, Table, Td, Th } from '@/components/ui';
import type { SanPham } from '@/features/san-pham';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useT } from '@/components/shell/NgonNguProvider';
import { canhBaoGiaSan, dongViPhamGiaSan, thanhTienDong } from '../hop-dong';
import { lyDoThanhChu } from '../lyDo';
import type { DongHopDong, KhuyenMaiApDung } from '../types';

/* Chọn sản phẩm + số lượng + đơn giá cho hợp đồng.

   Thuần trình bày: danh sách sản phẩm do màn truyền vào, không tự gọi API.

   Giá niêm yết và giá sàn được CHỤP LẠI vào dòng ngay lúc thêm — bảng giá đổi
   sau đó không được làm hợp đồng cũ đọc ra con số khác.

   Cảnh báo phá giá sàn hiện NGAY KHI GÕ, trước khi lưu — giống Bước 9. */

interface Props {
  dong: DongHopDong[];
  sanPham: SanPham[];
  khuyenMai?: KhuyenMaiApDung;
  onChange: (dong: DongHopDong[]) => void;
}

export function DongSanPham({ dong, sanPham, khuyenMai, onChange }: Props) {
  const t = useT();
  const uid = useId();
  const [chon, setChon] = useState('');

  const pham = new Set(dongViPhamGiaSan(dong, khuyenMai).map((d) => d.sanPhamId));
  const canhBao = canhBaoGiaSan(dong, khuyenMai);

  function them() {
    const sp = sanPham.find((s) => s.id === chon);
    if (!sp) return;
    const daCo = dong.find((d) => d.sanPhamId === sp.id);
    if (daCo) {
      onChange(dong.map((d) => (d.sanPhamId === sp.id ? { ...d, soLuong: d.soLuong + 1 } : d)));
    } else {
      onChange([
        ...dong,
        {
          sanPhamId: sp.id,
          ten: sp.ten,
          giaNiemYet: sp.giaNiemYet,
          giaSan: sp.giaSan,
          donGia: sp.giaNiemYet,
          soLuong: 1,
        },
      ]);
    }
    setChon('');
  }

  function sua(sanPhamId: string, thayDoi: Partial<DongHopDong>) {
    onChange(dong.map((d) => (d.sanPhamId === sanPhamId ? { ...d, ...thayDoi } : d)));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${uid}-chon`} className="text-sm font-medium text-ink">
            {t('chung.sanPham')}
          </label>
          <select
            id={`${uid}-chon`}
            className="field mt-1"
            value={chon}
            onChange={(e) => setChon(e.target.value)}
          >
            <option value="">{t('hopDong.chonSanPham')}</option>
            {sanPham.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.ten} — {money(sp.giaNiemYet)}
              </option>
            ))}
          </select>
        </div>
        <Button variant="ghost" onClick={them} disabled={chon === ''}>
          <Plus className="h-4 w-4" />
          {t('hopDong.themDong')}
        </Button>
      </div>

      {dong.length === 0 ? (
        <p className="rounded-control border border-dashed border-line px-3 py-6 text-center text-sm text-muted">
          {t('hopDong.chuaCoDongNao')}
        </p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t('chung.sanPham')}</Th>
              <Th align="right">{t('hopDong.niemYet')}</Th>
              <Th align="right">{t('hopDong.donGiaBan')}</Th>
              <Th align="right">{t('chung.soLuongTat')}</Th>
              <Th align="right">{t('hopDong.thanhTien')}</Th>
              <Th align="right" className="w-10">
                <span className="sr-only">{t('chung.xoa')}</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {dong.map((d) => (
              <tr key={d.sanPhamId} className={cn(pham.has(d.sanPhamId) && 'bg-pill-bad-bg')}>
                <Td>
                  <div className="font-medium text-ink">{d.ten}</div>
                  <div className="text-xs text-muted">
                    {t('hopDong.san')} {money(d.giaSan)}
                  </div>
                </Td>
                <Td align="right" className="text-muted">
                  {money(d.giaNiemYet)}
                </Td>
                <Td align="right">
                  <MoneyInput
                    aria-label={t('hopDong.donGiaCua', { ten: d.ten })}
                    className="w-32"
                    value={d.donGia}
                    onValueChange={(v) => sua(d.sanPhamId, { donGia: v })}
                  />
                </Td>
                <Td align="right">
                  <input
                    type="number"
                    min={1}
                    aria-label={t('hopDong.soLuongCua', { ten: d.ten })}
                    className="field w-16 text-right tabular-nums"
                    value={d.soLuong}
                    onChange={(e) => sua(d.sanPhamId, { soLuong: Number(e.target.value) })}
                  />
                </Td>
                <Td align="right" className="font-semibold">
                  {money(thanhTienDong(d))}
                </Td>
                <Td align="right">
                  <button
                    type="button"
                    aria-label={t('hopDong.xoaDong', { ten: d.ten })}
                    className="rounded-control p-1 text-muted hover:bg-pill-bad-bg hover:text-bad"
                    onClick={() => onChange(dong.filter((x) => x.sanPhamId !== d.sanPhamId))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {canhBao ? (
        <div className="flex items-start gap-2 rounded-control bg-pill-bad-bg px-3 py-2 text-sm text-pill-bad-fg">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {/* `canhBao` là LÝ DO (khoá + tham số + dòng vi phạm) — ghép ở đây. */}
          <span className="font-semibold">{lyDoThanhChu(t, canhBao)}</span>
        </div>
      ) : null}
    </div>
  );
}
