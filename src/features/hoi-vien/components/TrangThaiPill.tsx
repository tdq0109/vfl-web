import { Pill } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { HOI_VIEN_STATUS_KHOA, type HoiVienStatus } from '../types';

const TONE: Record<HoiVienStatus, 'ok' | 'warn' | 'bad' | 'default'> = {
  'dang-hoat-dong': 'ok',
  'tam-dung': 'warn',
  'het-han': 'bad',
  huy: 'default',
};

export function TrangThaiPill({ status }: { status: HoiVienStatus }) {
  const t = useT();
  return <Pill tone={TONE[status]}>{t(HOI_VIEN_STATUS_KHOA[status])}</Pill>;
}
