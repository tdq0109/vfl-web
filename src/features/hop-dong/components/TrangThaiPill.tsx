import { Pill } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { TRANG_THAI_HIEN_THI_KHOA, type TrangThaiHienThi } from '../types';

/* Nhận TRẠNG THÁI HIỂN THỊ (đã suy ra `het-han`), không nhận trạng thái lưu —
   gọi `trangThaiHienThi()` trước khi truyền vào. */

const TONE: Record<TrangThaiHienThi, 'ok' | 'warn' | 'bad' | 'default'> = {
  'bao-gia': 'default',
  'cho-thu-tien': 'warn',
  'cho-xac-minh': 'warn',
  'da-phat-hanh': 'default',
  'da-ky': 'default',
  'dang-hieu-luc': 'ok',
  'het-han': 'bad',
  'da-huy': 'bad',
  'tam-dung': 'warn',
};

export function TrangThaiPill({ status }: { status: TrangThaiHienThi }) {
  const t = useT();
  return <Pill tone={TONE[status]}>{t(TRANG_THAI_HIEN_THI_KHOA[status])}</Pill>;
}
