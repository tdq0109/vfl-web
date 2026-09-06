import { ArrowDown, CircleAlert, CircleSlash } from 'lucide-react';
import { Card, Pill } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { fmtDate, money } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DongDoiSoatTrongChuoi } from '../giamSat';
import type { KhungTrong, NgayCuaClb } from '../khungCa';
import { ChuYPill } from './ChuYPill';

/* Một ngày của một CLB, dựng theo chuỗi ca nối tiếp nhau.

   Lễ tân chia 2–3 ca một ngày trên cùng một két, nên thứ cần nhìn không phải ca
   nào lệch mà là mạch tiền đi từ đầu ngày tới cuối ngày: ca sáng đầu 500.000 →
   cuối 800.000, bàn giao khớp hay lệch bao nhiêu, rồi ca chiều đầu 800.000 →
   cuối 1.000.000.

   Khung không ai mở ca thì hiện thành ô gạch chéo đúng vị trí của nó trong
   ngày. Thuần trình bày: mọi con số do giamSat.ts và khungCa.ts tính sẵn. */

interface Props {
  ngay: NgayCuaClb & { dong: DongDoiSoatTrongChuoi[] };
  onChonCa: (caId: string) => void;
}

function OKhungTrong({ trong }: { trong: KhungTrong }) {
  const t = useT();
  return (
    <div className="flex items-center gap-2 rounded-control border border-dashed border-bad/40 bg-pill-bad-bg/20 px-3 py-2 text-sm">
      <CircleSlash className="h-4 w-4 shrink-0 text-bad" />
      <span className="font-semibold text-bad">{t(trong.khung.nhanKhoa)}</span>
      <span className="text-muted">
        {trong.khung.batDau}–{trong.khung.ketThuc}
      </span>
      <span className="ml-auto font-semibold text-bad">
        {t('quay.giamSat.khongAiTruc')}
      </span>
    </div>
  );
}

function BanGiao({ lech }: { lech: number | null }) {
  const t = useT();
  const khop = lech === 0;

  return (
    <div className="flex items-center gap-2 pl-3 text-xs">
      <ArrowDown className={cn('h-4 w-4 shrink-0', khop ? 'text-muted' : 'text-bad')} />
      {lech === null ? (
        <span className="text-muted">{t('quay.giamSat.banGiaoChuaBiet')}</span>
      ) : khop ? (
        <span className="text-muted">{t('quay.giamSat.banGiaoKhop')}</span>
      ) : (
        <span className="font-semibold text-bad">
          {t(lech > 0 ? 'quay.giamSat.banGiaoThua' : 'quay.giamSat.banGiaoThieu', {
            soTien: money(Math.abs(lech)),
          })}
        </span>
      )}
    </div>
  );
}

export function ChuoiCaNgay({ ngay, onChonCa }: Props) {
  const t = useT();

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">
          {fmtDate(ngay.ngay)} · {ngay.locationName ?? ngay.locationId}
        </h3>
        {ngay.khungTrong.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-bad">
            <CircleAlert className="h-3.5 w-3.5" />
            {t('quay.giamSat.thieuKhungSo', { so: ngay.khungTrong.length })}
          </span>
        ) : null}
      </div>

      <div className="space-y-1">
        {ngay.dong.map((d, i) => (
          <div key={d.ca.id} className="space-y-1">
            {/* Mũi tên bàn giao nằm GIỮA hai ca, nên chỉ vẽ từ ca thứ hai. */}
            {i > 0 ? <BanGiao lech={d.matXich.lechBanGiao} /> : null}

            <button
              type="button"
              onClick={() => onChonCa(d.ca.id)}
              className="w-full rounded-control border border-line px-3 py-2 text-left hover:bg-brand-tint"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold text-ink">
                  {d.matXich.khung ? t(d.matXich.khung.nhanKhoa) : t('quay.giamSat.ngoaiKhung')}
                </span>
                {/* Mã ca vẫn phải hiện: đối soát với kế toán thì người ta gọi
                    nhau bằng mã, không bằng "ca chiều hôm kia". */}
                <span className="text-xs font-medium text-muted">{d.ca.maCa}</span>
                <span className="text-xs text-muted">
                  {d.ca.moLuc.slice(11, 16)}
                  {' – '}
                  {d.ca.dongLuc ? d.ca.dongLuc.slice(11, 16) : t('quay.giamSat.chuaDong')}
                </span>
                <span className="text-muted">·</span>
                <span className="text-ink">{d.ca.thuNganTen}</span>
                {d.ca.trangThai === 'dang-mo' ? (
                  <Pill tone="warn">{t('quay.trangThaiCa.dang-mo')}</Pill>
                ) : null}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums text-muted">
                <span>
                  {t('quay.tienDauCa')}: <span className="text-ink">{money(d.ca.tienDauCa)}</span>
                </span>
                <span>
                  {t('quay.tongDoanhThu')}:{' '}
                  <span className="text-ink">{money(d.tomTat.tongDoanhThu)}</span>
                </span>
                <span>
                  {t('quay.giamSat.kyVong')}:{' '}
                  <span className="text-ink">{money(d.tomTat.tienMatKyVong)}</span>
                </span>
                <span>
                  {t('quay.tienMatDemDuoc')}:{' '}
                  <span className="text-ink">
                    {d.tienDem === null ? '—' : money(d.tienDem)}
                  </span>
                </span>
                {d.lech === null ? null : (
                  <span
                    className={cn(
                      'font-semibold',
                      d.cap === 'khop' ? 'text-ok' : d.cap === 'nang' ? 'text-bad' : 'text-warn',
                    )}
                  >
                    {t('quay.giamSat.lech')}: {d.lech > 0 ? '+' : ''}
                    {money(d.lech)}
                  </span>
                )}
              </div>

              {d.chuYGop.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {d.chuYGop.map((khoa) => (
                    <ChuYPill key={khoa} khoa={khoa} />
                  ))}
                </div>
              ) : null}
            </button>
          </div>
        ))}

        {ngay.khungTrong.map((kt) => (
          <OKhungTrong key={kt.khung.id} trong={kt} />
        ))}
      </div>
    </Card>
  );
}
