import { AlertTriangle } from 'lucide-react';
import { Button, Pill, Table, Td, Th } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { fmtDate, money } from '@/lib/format';
import { trangThaiKhuyenMai, viPhamGiaSan } from '../gia';
import {
  KHUYEN_MAI_STATUS_KHOA,
  type KhuyenMai,
  type KhuyenMaiStatus,
  type SanPham,
} from '../types';

const TONE: Record<KhuyenMaiStatus, 'ok' | 'warn' | 'bad' | 'default'> = {
  'dang-chay': 'ok',
  'sap-toi': 'default',
  'het-han': 'bad',
  'tam-dung': 'warn',
};

interface Props {
  rows: KhuyenMai[];
  /** Để tính cảnh báo phá giá sàn. */
  sanPhams: SanPham[];
  canEdit: boolean;
  togglingId?: string;
  onEdit: (km: KhuyenMai) => void;
  onToggle: (km: KhuyenMai) => void;
}

/** Các sản phẩm mà khuyến mãi này kéo xuống dưới giá sàn. */
function sanPhamViPham(km: KhuyenMai, sanPhams: SanPham[]): SanPham[] {
  const phamVi =
    km.sanPhamIds && km.sanPhamIds.length > 0
      ? sanPhams.filter((sp) => km.sanPhamIds?.includes(sp.id))
      : sanPhams;
  return phamVi.filter((sp) => viPhamGiaSan(sp, km));
}

export function KhuyenMaiTable({
  rows,
  sanPhams,
  canEdit,
  togglingId,
  onEdit,
  onToggle,
}: Props) {
  const t = useT();
  return (
    <Table>
      <thead>
        <tr>
          <Th>{t('chung.ma')}</Th>
          <Th>{t('khuyenMai.tenChuongTrinh')}</Th>
          <Th align="right">{t('khuyenMai.giam')}</Th>
          <Th>{t('khuyenMai.thoiGian')}</Th>
          <Th>{t('khuyenMai.phamVi')}</Th>
          <Th>{t('chung.trangThai')}</Th>
          <Th />
        </tr>
      </thead>
      <tbody>
        {rows.map((km) => {
          const status = trangThaiKhuyenMai(km);
          const viPham = sanPhamViPham(km, sanPhams);
          return (
            <tr key={km.id}>
              <Td className="font-medium text-ink">{km.ma}</Td>
              <Td>
                {km.ten}
                {viPham.length > 0 ? (
                  <span
                    className="ml-2 inline-flex items-center gap-1 text-xs text-warn"
                    title={viPham.map((sp) => sp.ten).join(', ')}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('khuyenMai.duoiGiaSan', { so: viPham.length })}
                  </span>
                ) : null}
              </Td>
              <Td align="right">
                {km.loaiGiam === 'phan-tram' ? `${km.giaTri}%` : money(km.giaTri)}
              </Td>
              <Td className="whitespace-nowrap">
                {fmtDate(km.tuNgay)} – {fmtDate(km.denNgay)}
              </Td>
              <Td>
                {km.sanPhamIds && km.sanPhamIds.length > 0
                  ? t('khuyenMai.soSanPham', { so: km.sanPhamIds.length })
                  : t('khuyenMai.moiSanPham')}
              </Td>
              <Td>
                <Pill tone={TONE[status]}>{t(KHUYEN_MAI_STATUS_KHOA[status])}</Pill>
              </Td>
              <Td align="right">
                {canEdit ? (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(km)}>
                      {t('action.sua')}
                    </Button>
                    <Button
                      size="sm"
                      variant="subtle"
                      disabled={togglingId === km.id}
                      onClick={() => onToggle(km)}
                    >
                      {/* NÚT, không phải trạng thái — "Pause" chứ không "Paused". */}
                      {km.kichHoat ? t('khuyenMai.tamDungNut') : t('khuyenMai.batNut')}
                    </Button>
                  </div>
                ) : null}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
