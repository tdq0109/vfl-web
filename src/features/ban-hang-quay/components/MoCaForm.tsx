'use client';

import { useId, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Button, Card, FormField, MoneyInput } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';

/* Mở ca: đếm tiền có sẵn trong két rồi ghi lại. Con số này là gốc của phép đối
   soát cuối ca, nhập sai ở đây thì cuối ca lệch đúng bằng ngần ấy. Giờ mở ca do
   server đóng dấu, màn không gửi giờ lên.

   Tới muộn vẫn cho mở, chỉ cảnh báo và ghi lại — chặn là đẩy lễ tân vào chỗ bán
   chui không có ca. */
interface Props {
  locationName: string;
  /** Ca hiện tại theo khung chuẩn, và mở muộn bao nhiêu phút tính tới lúc
      này. Bỏ trống nghĩa là giờ này không thuộc khung ca nào. */
  khungHienTai?: { ten: string; batDau: string; soPhutMuon: number } | null;
  /** Từ mức này trở lên mới coi là muộn — để câu cảnh báo khớp với luật. */
  dungSaiMuon?: number;
  fieldErrors?: Record<string, string>;
  submitting?: boolean;
  onSubmit: (tienDauCa: number) => void;
}

export function MoCaForm({
  locationName,
  khungHienTai,
  dungSaiMuon = 15,
  fieldErrors = {},
  submitting,
  onSubmit,
}: Props) {
  const t = useT();
  const uid = useId();
  const [tienDauCa, setTienDauCa] = useState(0);
  const muon = khungHienTai != null && khungHienTai.soPhutMuon > dungSaiMuon;

  return (
    <Card className="mx-auto max-w-md space-y-4">
      <div>
        <h2 className="text-base font-bold text-ink">{t('quay.moCaThuNgan')}</h2>
        <p className="mt-0.5 text-sm text-muted">{locationName}</p>
      </div>

      {khungHienTai ? (
        <div
          className={cn(
            'flex items-start gap-2 rounded-control px-3 py-2 text-sm',
            muon ? 'bg-pill-warn-bg text-pill-warn-fg' : 'bg-brand-tint text-ink',
          )}
        >
          {muon ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div>
            <div className="font-semibold">
              {t('quay.moCa.khungHienTai', {
                ca: khungHienTai.ten,
                gio: khungHienTai.batDau,
              })}
            </div>
            {muon ? (
              <div className="mt-0.5">
                {t('quay.moCa.canhBaoMuon', { soPhut: khungHienTai.soPhutMuon })}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-control bg-pill-warn-bg px-3 py-2 text-sm text-pill-warn-fg">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {t('quay.moCa.ngoaiKhung')}
        </div>
      )}

      <FormField
        label={t('quay.tienCoSanTrongKet')}
        htmlFor={`${uid}-tien`}
        error={fieldErrors.tienDauCa}
        hint={t('quay.demTienTruocKhiBan')}
        required
      >
        <MoneyInput id={`${uid}-tien`} value={tienDauCa} onValueChange={setTienDauCa} autoFocus />
      </FormField>

      <p className="text-xs text-muted">
        {t('quay.cuoiCaSeDoiChieu', { soTien: money(tienDauCa) })}
      </p>

      <Button className="w-full" disabled={submitting} onClick={() => onSubmit(tienDauCa)}>
        {submitting ? t('quay.dangMoCa') : t('quay.moCa')}
      </Button>
    </Card>
  );
}
