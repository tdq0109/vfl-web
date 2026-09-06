'use client';

import { useId, useState } from 'react';
import { Lock } from 'lucide-react';
import { Button, FormField, MoneyInput } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { hasMinRole } from '@/lib/auth/permissions';
import type { UserProfile } from '@/lib/auth/types';
import { money } from '@/lib/format';
import { kiemTraGiaSan } from '../gia';
import type { SanPham } from '../types';

/* Giá sàn — mức thấp nhất được phép bán. Chỉ Giám đốc trở lên đặt được (khớp
   quyền `san-pham.gia-san` trong ma trận phân quyền).

   Đây chỉ là lớp ẩn/hiện, backend .NET vẫn phải kiểm tra lại. */

interface Props {
  sanPham: SanPham;
  actor: UserProfile;
  fieldErrors?: Record<string, string>;
  submitting?: boolean;
  onSubmit: (giaSan: number) => void;
}

export function GiaSanPanel({ sanPham, actor, fieldErrors = {}, submitting, onSubmit }: Props) {
  const t = useT();
  const uid = useId();
  const [giaSan, setGiaSan] = useState(sanPham.giaSan);

  const duocDat = hasMinRole(actor, 'director');

  if (!duocDat) {
    return (
      <div className="space-y-1 rounded-control border border-line bg-brand-tint p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <Lock className="h-4 w-4 text-muted" />
          {t('sanPham.giaSanLa', { soTien: money(sanPham.giaSan) })}
        </div>
        <p className="text-xs text-muted">{t('sanPham.chiGiamDocDatGiaSan')}</p>
      </div>
    );
  }

  const loi = kiemTraGiaSan(sanPham.giaNiemYet, giaSan);
  const daDoi = giaSan !== sanPham.giaSan;

  return (
    <div className="space-y-3 rounded-control border border-line p-3">
      <FormField
        label={t('sanPham.giaSan')}
        htmlFor={`${uid}-gs`}
        /* `loi` là KHOÁ i18n do `kiemTraGiaSan()` trả về — dịch tại đây. */
        error={fieldErrors.giaSan ?? (loi ? t(loi) : undefined)}
        hint={t('sanPham.giaNiemYetLa', { soTien: money(sanPham.giaNiemYet) })}
      >
        <MoneyInput id={`${uid}-gs`} value={giaSan} onValueChange={setGiaSan} />
      </FormField>

      <Button
        size="sm"
        disabled={!daDoi || loi !== null || submitting}
        onClick={() => onSubmit(giaSan)}
      >
        {submitting ? t('state.dangLuu') : t('sanPham.datGiaSan')}
      </Button>
    </div>
  );
}
