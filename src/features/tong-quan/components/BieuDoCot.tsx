import { useT } from '@/components/shell/NgonNguProvider';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import { buocThuaNhan, nhanNgayNgan, phanTramCot, thangCot } from '../tong-quan';
import type { DiemDoanhThu } from './../types';

/* Biểu đồ cột doanh thu theo ngày, vẽ bằng div và token, không dùng thư viện.

   Mọi thư viện biểu đồ đều mang theo hệ màu và hệ kích thước riêng, tức là một
   hệ style thứ hai bên cạnh bộ token. Một biểu đồ cột là mấy chục dòng CSS, rẻ
   hơn nhiều so với việc đồng bộ hai hệ style ở mỗi lần đổi layout. Khi nào cần
   biểu đồ thật sự phức tạp thì hẵng bàn lại.

   Dữ liệu vào phải đã điền đủ ngày (dienDayChuoiNgay); component không tự vá dữ
   liệu thưa, để lỗi lộ ra ở tầng tính chứ không im lặng ở tầng vẽ. */

interface Props {
  diem: DiemDoanhThu[];
  className?: string;
}

export function BieuDoCot({ diem, className }: Props) {
  const t = useT();
  const thang = thangCot(diem.map((d) => d.doanhThu));
  const buoc = buocThuaNhan(diem.length);

  if (diem.length === 0) {
    return (
      <p className={cn('py-12 text-center text-sm text-muted', className)}>
        {t('tongQuan.chuaCoSoLieu')}
      </p>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        {/* Trục tung: ba mốc, đọc từ trên xuống. */}
        <div className="flex h-48 w-20 shrink-0 flex-col justify-between py-0.5 text-right text-[11px] tabular-nums text-muted">
          {thang.moc.length > 0 ? (
            thang.moc.map((m) => <span key={m}>{money(m)}</span>)
          ) : (
            <>
              <span>&nbsp;</span>
              <span>0 ₫</span>
            </>
          )}
        </div>

        <div
          className="relative flex h-48 min-w-0 flex-1 items-end gap-px border-b border-l border-line"
          role="img"
          aria-label={t('tongQuan.bieuDoMoTa', { soNgay: diem.length, dinh: money(thang.dinh) })}
        >
          {/* Kẻ ngang mốc giữa — chỉ để mắt ước lượng, không phải dữ liệu. */}
          {thang.dinh > 0 ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line"
            />
          ) : null}

          {diem.map((d) => (
            <div key={d.ngay} className="group relative flex h-full flex-1 items-end">
              <div
                className={cn(
                  'w-full rounded-t-sm transition-colors',
                  d.doanhThu > 0 ? 'bg-brand group-hover:bg-brand-ink' : 'bg-line',
                )}
                style={{ height: `${Math.max(phanTramCot(d.doanhThu, thang.dinh), d.doanhThu > 0 ? 2 : 1)}%` }}
              />
              <span className="sr-only">
                {t('tongQuan.cotMoTa', {
                  ngay: nhanNgayNgan(d.ngay),
                  tien: money(d.doanhThu),
                  soGiaoDich: d.soGiaoDich,
                })}
              </span>
              {/* Chú thích khi rê chuột — người vận hành hay hỏi "ngày nào tụt". */}
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-control bg-ink px-2 py-1 text-[11px] font-semibold text-white shadow-menu group-hover:block">
                {nhanNgayNgan(d.ngay)} · {money(d.doanhThu)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trục hoành: thưa nhãn để không chồng chữ. */}
      <div className="flex gap-px pl-[5.5rem]">
        {diem.map((d, i) => (
          <span
            key={d.ngay}
            className="min-w-0 flex-1 text-center text-[11px] tabular-nums text-muted"
          >
            {i % buoc === 0 ? nhanNgayNgan(d.ngay) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
