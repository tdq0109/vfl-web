'use client';

import { useMemo, useState } from 'react';
import { Card, Drawer, QueryState } from '@/components/ui';
import { useSession } from '@/components/auth/SessionProvider';
import { ALL_LOCATIONS, useLocationScope } from '@/components/shell/LocationProvider';
import { useT } from '@/components/shell/NgonNguProvider';
import { toIsoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { BoLocGiamSatCa } from './components/BoLocGiamSatCa';
import { BangCa } from './components/BangCa';
import { ChiTietCa } from './components/ChiTietCa';
import { ChuoiCaNgay } from './components/ChuoiCaNgay';
import { SoGiaoDichBang } from './components/SoGiaoDichBang';
import { TongHopGiamSatCards } from './components/TongHopGiamSatCards';
import { doiSoatTheoChuoi, ngayCanChuY, soGiaoDich, tongHopGiamSat } from './giamSat';
import { KHUNG_THEO_KIEU, type KieuKhung } from './khungCa';
import { useDanhSachCa } from './hooks/useGiamSatCa';
import type { BoLocGiamSat } from './types';

/* Màn GIÁM SÁT CA — câu hỏi của người quản lý, không phải của thu ngân.

   `BanHangQuayScreen` phục vụ người đang đứng bán: ca của TÔI, giỏ hàng của TÔI.
   Màn này nhìn ngược lại: mọi ca của mọi thu ngân, cả ca đã đóng, để trả lời ba
   câu mà trước đây không chỗ nào trong hệ thống trả lời được:

     · ca nào lệch két, lệch bao nhiêu, có ai giải thích không;
     · ca nào còn mở quá lâu — tiền đang nằm trong két mà chưa ai đối soát;
     · phiếu nào đã bị huỷ, ai huỷ, vì sao.

   ⚠ Quyền: mục menu chỉ hiện từ cấp `leader`, nhưng ĐÓ CHỈ LÀ ẨN NÚT. Backend
   .NET phải tự chặn — mock đã trả 403 cho `staff` đúng như vậy, xem
   `tools/mock-dotnet.mjs`.

   ⚠ Lọc hai tầng, cố ý: ngày/CLB/trạng thái do server lọc; riêng "chỉ ca cần
   chú ý" lọc ở client vì đó là kết luận của hàm thuần `chuYCuaCa()` — luật ấy
   thuộc về frontend và không được có hai định nghĩa khác nhau ở hai nơi. */

type Tab = 'theo-ngay' | 'ca' | 'so-giao-dich';

/** Mặc định: 7 ngày gần nhất, tính cả hôm nay. */
function macDinh(): { tuNgay: string; denNgay: string } {
  const nay = new Date();
  const truoc = new Date(nay.getFullYear(), nay.getMonth(), nay.getDate() - 6);
  return { tuNgay: toIsoDate(truoc), denNgay: toIsoDate(nay) };
}

export function GiamSatCaScreen() {
  const t = useT();
  const user = useSession();
  const { current: phamVi, options: clbOptions } = useLocationScope();

  /* Mặc định là "theo ngày": lễ tân chia 2–3 ca nối nhau trên cùng một két, nên
     câu hỏi đầu tiên của người giám sát là mạch tiền của CẢ NGÀY, không phải một
     ca đứng riêng. Bảng phẳng vẫn còn ở tab thứ hai để lọc và so nhanh. */
  const [tab, setTab] = useState<Tab>('theo-ngay');
  /* ⚠ GIẢ ĐỊNH: CLB chạy 2 ca/ngày. Có nơi 3 ca nên cho chuyển ngay trên màn —
     khung giờ chuẩn nằm ở `khungCa.ts`, chờ vận hành chốt rồi cố định lại. */
  const [kieuKhung, setKieuKhung] = useState<KieuKhung>('2-ca');
  const [boLoc, setBoLoc] = useState<BoLocGiamSat>(() => macDinh());
  const [caDangXem, setCaDangXem] = useState<string | null>(null);

  /* CLB đang chọn trên thanh trên là bộ lọc MẶC ĐỊNH, nhưng ô CLB trong bộ lọc
     riêng của màn được phép ghi đè — người giám sát hay cần so hai CLB với nhau.
     "Tất cả CLB" thì không gửi `locationId`, để backend trả theo quyền. */
  const locationId =
    boLoc.locationId ?? (phamVi === ALL_LOCATIONS ? undefined : phamVi);

  const locGuiLenServer: BoLocGiamSat = {
    ...boLoc,
    ...(locationId === undefined ? {} : { locationId }),
  };

  const caQuery = useDanhSachCa(locGuiLenServer);
  const dsCa = useMemo(() => caQuery.data ?? [], [caQuery.data]);

  /* CHUỖI CA dựng TRƯỚC, lọc SAU — thứ tự này quan trọng.

     🐞 Bản đầu lọc "chỉ ca cần chú ý" trước rồi mới nối chuỗi, và nó GIẤU MẤT
     đúng ca lệch bàn giao: ca ấy tự nó khớp két hoàn hảo, dấu hiệu chỉ xuất
     hiện khi đặt cạnh ca trước. Lọc trước là cắt mất ca trước, và cùng với nó
     là cả dấu hiệu. Test tương tác lôi ra lỗi này.

     `bayGio` cũng chốt MỘT LẦN: gọi `new Date()` rải rác trong lúc vẽ là mỗi
     dòng so với một mốc hơi khác nhau, và một ca đúng ngưỡng sẽ nhấp nháy giữa
     hai lần render. */
  const chuoiDayDu = useMemo(() => {
    const bayGio = new Date();
    return doiSoatTheoChuoi(dsCa, KHUNG_THEO_KIEU[kieuKhung], bayGio);
  }, [dsCa, kieuKhung]);

  const chiCanChuY = boLoc.chiCanChuY ?? false;

  /* Ngày nào cũng giữ NGUYÊN chuỗi ca của nó — lọc bỏ một mắt xích ở giữa là
     mạch bàn giao đứt và con số lệch mất nghĩa. Lọc theo NGÀY, không theo ca. */
  const theoNgay = useMemo(
    () => (chiCanChuY ? chuoiDayDu.filter(ngayCanChuY) : chuoiDayDu),
    [chuoiDayDu, chiCanChuY],
  );

  /* Bảng phẳng thì ngược lại: nó không kể mạch nào nên lọc thẳng từng ca được. */
  const dong = useMemo(() => {
    const tatCa = chuoiDayDu.flatMap((n) => n.dong);
    return chiCanChuY ? tatCa.filter((d) => d.chuYGop.length > 0) : tatCa;
  }, [chuoiDayDu, chiCanChuY]);

  const tongHop = useMemo(() => tongHopGiamSat(dong), [dong]);
  const so = useMemo(() => soGiaoDich(dong.map((d) => d.ca)), [dong]);

  const dangXem = dong.find((d) => d.ca.id === caDangXem) ?? null;

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <BoLocGiamSatCa
          value={boLoc}
          onChange={setBoLoc}
          clbOptions={user.allLocations ? clbOptions : user.locations}
        />

        <div className="flex items-center gap-2 border-t border-line pt-3 text-sm">
          <span className="text-muted">{t('quay.giamSat.caTrongNgay')}</span>
          {(['2-ca', '3-ca'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKieuKhung(k)}
              className={cn(
                'rounded-control border px-2.5 py-1 text-xs font-semibold',
                kieuKhung === k
                  ? 'border-brand bg-brand-soft text-brand-ink'
                  : 'border-line text-muted hover:text-ink',
              )}
            >
              {t(k === '2-ca' ? 'quay.giamSat.haiCa' : 'quay.giamSat.baCa')}
            </button>
          ))}
          <span className="text-xs text-muted">
            {KHUNG_THEO_KIEU[kieuKhung]
              .map((x) => `${t(x.nhanKhoa)} ${x.batDau}–${x.ketThuc}`)
              .join(' · ')}
          </span>
        </div>
      </Card>

      <QueryState
        isLoading={caQuery.isLoading}
        isError={caQuery.isError}
        error={caQuery.error}
        isEmpty={dsCa.length === 0}
        emptyText={t('quay.giamSat.khongCoCa')}
        onRetry={() => caQuery.refetch()}
      >
        <div className="space-y-4">
          <TongHopGiamSatCards tongHop={tongHop} />

          <div className="flex gap-1 border-b border-line">
            {(['theo-ngay', 'ca', 'so-giao-dich'] as const).map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setTab(x)}
                className={cn(
                  '-mb-px border-b-2 px-3 py-2 text-sm font-semibold',
                  tab === x
                    ? 'border-brand text-brand-ink'
                    : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {x === 'theo-ngay'
                  ? t('quay.giamSat.tabTheoNgay', { so: theoNgay.length })
                  : x === 'ca'
                    ? t('quay.giamSat.tabCa', { so: dong.length })
                    : t('quay.giamSat.tabSoGiaoDich', { so: so.length })}
              </button>
            ))}
          </div>

          {tab === 'theo-ngay' ? (
            <div className="space-y-3">
              {theoNgay.map((n) => (
                <ChuoiCaNgay
                  key={`${n.ngay}|${n.locationId}`}
                  ngay={n}
                  onChonCa={setCaDangXem}
                />
              ))}
            </div>
          ) : (
            <Card className="overflow-x-auto p-0">
              {tab === 'ca' ? (
                <BangCa dong={dong} onChonCa={setCaDangXem} />
              ) : (
                <SoGiaoDichBang dong={so} />
              )}
            </Card>
          )}
        </div>
      </QueryState>

      <Drawer
        open={dangXem !== null}
        onOpenChange={(mo) => {
          if (!mo) setCaDangXem(null);
        }}
        title={dangXem ? t('quay.caLa', { maCa: dangXem.ca.maCa }) : ''}
        description={t('quay.giamSat.chiTietMoTa')}
        className="max-w-2xl"
      >
        {dangXem ? <ChiTietCa dong={dangXem} /> : null}
      </Drawer>
    </div>
  );
}
