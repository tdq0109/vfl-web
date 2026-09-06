'use client';

import { useMemo, useState } from 'react';
import { Card, QueryState } from '@/components/ui';
import { useSession } from '@/components/auth/SessionProvider';
import { ALL_LOCATIONS, useLocationScope } from '@/components/shell/LocationProvider';
import { useT } from '@/components/shell/NgonNguProvider';
import { hasMinRole, ROLE_KHOA } from '@/lib/auth/permissions';
import { money } from '@/lib/format';
import { BangTop } from './components/BangTop';
import { BieuDoCot } from './components/BieuDoCot';
import { ChiSoCard } from './components/ChiSoCard';
import { ChonKy } from './components/ChonKy';
import { HomNayPanel } from './components/HomNayPanel';
import {
  useDoanhThuTheoNgay,
  useHomNay,
  useTomTat,
  useTomTatKyTruoc,
  useTopSanPham,
} from './hooks/useTongQuan';
import { dienDayChuoiNgay, khoangKy, soNgay } from './tong-quan';
import type { Ky, MaKy } from './types';

/* Container của Dashboard.

   Hai tầng hiển thị:
     · khối “hôm nay” — ai đăng nhập cũng thấy, đó là việc phải làm trong ngày;
     · khối báo cáo (doanh thu, hợp đồng, công nợ) — từ Trưởng nhóm trở lên,
       khớp với `bao-cao.clb` trong `lib/auth/capabilities.ts`.

   Ẩn ở đây CHỈ để đỡ chật màn; backend vẫn phải từ chối nếu người không đủ
   quyền gọi thẳng endpoint. */

export function TongQuanScreen() {
  const t = useT();
  const user = useSession();
  const { current: locationScope, options: locationOptions } = useLocationScope();
  const locationId = locationScope === ALL_LOCATIONS ? undefined : locationScope;

  const [maKy, setMaKy] = useState<MaKy>('7-ngay');
  const [ky, setKy] = useState<Ky>(() => khoangKy('7-ngay'));

  const xemBaoCao = hasMinRole(user, 'leader');

  const tomTat = useTomTat(ky, locationId, xemBaoCao);
  const truoc = useTomTatKyTruoc(ky, locationId, xemBaoCao);
  const doanhThu = useDoanhThuTheoNgay(ky, locationId, xemBaoCao);
  const top = useTopSanPham(ky, locationId, xemBaoCao);
  const homNay = useHomNay(locationId);

  /* Điền 0 cho ngày không phát sinh TRƯỚC KHI vẽ — biểu đồ không tự vá dữ liệu. */
  const diem = useMemo(
    () => dienDayChuoiNgay(doanhThu.data ?? [], ky),
    [doanhThu.data, ky],
  );

  function chonNhanh(ma: MaKy) {
    setMaKy(ma);
    setKy(khoangKy(ma));
  }

  function doiKy(next: Ky) {
    setMaKy('tuy-chon');
    setKy(next);
  }

  const nay = tomTat.data;
  const cu = truoc.data;
  const phamVi =
    locationId === undefined
      ? t('tongQuan.phamViToanHeThong')
      : (locationOptions.find((l) => l.id === locationId)?.name ??
        t('tongQuan.phamViClbDangChon'));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ChonKy ma={maKy} ky={ky} onChonNhanh={chonNhanh} onDoiKy={doiKy} />
        <p className="text-xs text-muted">
          {t('tongQuan.phamVi', { soNgay: soNgay(ky), phamVi })}
        </p>
      </div>

      <QueryState
        isLoading={homNay.isLoading}
        isError={homNay.isError}
        error={homNay.error}
        onRetry={() => homNay.refetch()}
      >
        {homNay.data ? <HomNayPanel data={homNay.data} /> : null}
      </QueryState>

      {!xemBaoCao ? (
        <Card className="text-center text-sm text-muted">
          {/* Vai trò trong câu lấy từ cùng bảng nhãn mà `hasMinRole(user, 'leader')`
              ở trên dùng — đổi tên vai trò thì câu này đi theo, không lệch. */}
          {t('tongQuan.canQuyenBaoCao', { vaiTro: t(ROLE_KHOA.leader) })}
        </Card>
      ) : (
        <QueryState
          isLoading={tomTat.isLoading}
          isError={tomTat.isError}
          error={tomTat.error}
          onRetry={() => tomTat.refetch()}
        >
          {nay ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <ChiSoCard
                  nhan={t('chung.doanhThu')}
                  giaTri={money(nay.doanhThu)}
                  nay={nay.doanhThu}
                  truoc={cu?.doanhThu}
                  phu={t('tongQuan.trongDoQuay', { soTien: money(nay.doanhThuQuay) })}
                />
                <ChiSoCard
                  nhan={t('tongQuan.hopDongPhatHanh')}
                  giaTri={nay.soHopDong}
                  nay={nay.soHopDong}
                  truoc={cu?.soHopDong}
                />
                <ChiSoCard
                  nhan={t('tongQuan.hoiVienMoi')}
                  giaTri={nay.hoiVienMoi}
                  nay={nay.hoiVienMoi}
                  truoc={cu?.hoiVienMoi}
                />
                <ChiSoCard
                  nhan={t('tongQuan.buoiTap')}
                  giaTri={nay.soBuoiTap}
                  nay={nay.soBuoiTap}
                  truoc={cu?.soBuoiTap}
                />
                {/* Công nợ là số CHỐT TẠI THỜI ĐIỂM XEM, không thuộc kỳ nào —
                    nên không so sánh kỳ trước. Tăng là xấu. */}
                <ChiSoCard
                  nhan={t('tongQuan.conPhaiThu')}
                  giaTri={money(nay.congNo)}
                  tangLaTot={false}
                  phu={t('tongQuan.taiThoiDiemXem')}
                />
              </div>

              <Card className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-sm font-bold text-ink">{t('tongQuan.doanhThuTheoNgay')}</h2>
                  <span className="text-xs text-muted">{t('tongQuan.reChuotXemNgay')}</span>
                </div>
                <QueryState
                  isLoading={doanhThu.isLoading}
                  isError={doanhThu.isError}
                  error={doanhThu.error}
                  onRetry={() => doanhThu.refetch()}
                >
                  <BieuDoCot diem={diem} />
                </QueryState>
              </Card>

              <Card className="space-y-3">
                <h2 className="text-sm font-bold text-ink">{t('tongQuan.banChayTrongKy')}</h2>
                <QueryState
                  isLoading={top.isLoading}
                  isError={top.isError}
                  error={top.error}
                  onRetry={() => top.refetch()}
                >
                  <BangTop rows={top.data ?? []} />
                </QueryState>
              </Card>
            </div>
          ) : null}
        </QueryState>
      )}
    </div>
  );
}
