import { Pill } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { NHAN_VIEN_STATUS_KHOA, type NhanVienStatus } from '../types';

const TONE: Record<NhanVienStatus, 'ok' | 'warn' | 'default'> = {
  'dang-lam': 'ok',
  'nghi-phep': 'warn',
  'da-nghi': 'default',
};

export function TrangThaiPill({ status }: { status: NhanVienStatus }) {
  const t = useT();
  return <Pill tone={TONE[status]}>{t(NHAN_VIEN_STATUS_KHOA[status])}</Pill>;
}
