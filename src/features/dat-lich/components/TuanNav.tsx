import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { addDays, fmtDate, mondayOf, toIsoDate } from '@/lib/format';

interface Props {
  thuHai: Date;
  onDoiTuan: (thuHaiMoi: Date) => void;
}

export function TuanNav({ thuHai, onDoiTuan }: Props) {
  const t = useT();
  const chuNhat = addDays(thuHai, 6);
  const tuanNay = toIsoDate(mondayOf(new Date())) === toIsoDate(thuHai);

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => onDoiTuan(addDays(thuHai, -7))}>
        <ChevronLeft className="h-4 w-4" />
        {t('datLich.tuanTruoc')}
      </Button>

      <span className="whitespace-nowrap text-sm font-medium tabular-nums text-ink">
        {fmtDate(thuHai)} – {fmtDate(chuNhat)}
      </span>

      <Button variant="ghost" size="sm" onClick={() => onDoiTuan(addDays(thuHai, 7))}>
        {t('datLich.tuanSau')}
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!tuanNay ? (
        <Button variant="subtle" size="sm" onClick={() => onDoiTuan(mondayOf(new Date()))}>
          {t('datLich.veTuanNay')}
        </Button>
      ) : null}
    </div>
  );
}
