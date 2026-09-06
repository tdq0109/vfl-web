'use client';

import { useState } from 'react';
import { Card, ConfirmDialog, Pill, QueryState, toast } from '@/components/ui';
import { useSession } from '@/components/auth/SessionProvider';
import { ALL_LOCATIONS, useLocationScope } from '@/components/shell/LocationProvider';
import { useT } from '@/components/shell/NgonNguProvider';
import { ApiError } from '@/lib/api';
import { fmtDateTime, money } from '@/lib/format';
import { taiKhoanNhanTienCua } from '@/lib/locations';
import { cn } from '@/lib/utils';
import { BangHang } from './components/BangHang';
import { ChotNgayPanel } from './components/ChotNgayPanel';
import { DoiSoatCa } from './components/DoiSoatCa';
import { GioHang } from './components/GioHang';
import { LichSuGiaoDich } from './components/LichSuGiaoDich';
import { MoCaForm } from './components/MoCaForm';
import { useCaDangMo, useHangQuay } from './hooks/useQuay';
import { useNgayLamViec } from './hooks/useGiamSatCa';
import {
  useBanHang,
  useChotNgay,
  useChuyenCa,
  useDongCa,
  useHuyGiaoDich,
  useMoCa,
} from './hooks/useQuayMutations';
import { DUNG_SAI_MO_MUON, soPhutMoMuon } from './chuyenCa';
import { KHUNG_2_CA, gomTheoNgayVaClb, khungCuaThoiDiem, ngayLamViec } from './khungCa';
import { doiSoLuong, themVaoGio, tienMatKyVong, viSaoKhongBanDuoc } from './quay';
import type { DongHang, GiaoDich, HangQuay, PhuongThuc } from './types';

type Tab = 'ban-hang' | 'giao-dich' | 'doi-soat' | 'chot-ngay';

/* ⚠ GIẢ ĐỊNH: CLB chạy 2 ca/ngày (sáng 06:00–14:00 · chiều 14:00–22:00). Khung
   nằm ở `khungCa.ts`; nếu mỗi CLB một khung riêng thì nó phải theo `Location`
   từ backend — câu hỏi đã ghi vào mục 5 tài liệu bàn giao. */
const KHUNG = KHUNG_2_CA;

function fieldErrorsOf(err: unknown): Record<string, string> | undefined {
  return err instanceof ApiError ? err.fieldErrors : undefined;
}

export function BanHangQuayScreen() {
  const t = useT();
  const user = useSession();
  const { current: locationScope, options: locationOptions } = useLocationScope();

  /* Quầy luôn thuộc MỘT CLB cụ thể — không bán được ở chế độ "Tất cả CLB". */
  const locationId = locationScope === ALL_LOCATIONS ? undefined : locationScope;
  const locationName = locationOptions.find((l) => l.id === locationId)?.name ?? t('quay.clbNay');

  const [tab, setTab] = useState<Tab>('ban-hang');
  const [gio, setGio] = useState<DongHang[]>([]);
  const [phuongThuc, setPhuongThuc] = useState<PhuongThuc>('tien-mat');
  const [khachTen, setKhachTen] = useState('');
  const [khachSdt, setKhachSdt] = useState('');
  const [huyGd, setHuyGd] = useState<GiaoDich | null>(null);
  const [lyDoHuy, setLyDoHuy] = useState('');

  const caQuery = useCaDangMo(locationId);
  const hangQuery = useHangQuay(locationId);

  const moCaMut = useMoCa();
  const dongCaMut = useDongCa();
  const chuyenCaMut = useChuyenCa();
  const chotNgayMut = useChotNgay();
  const banHangMut = useBanHang(locationId ?? '');
  const huyMut = useHuyGiaoDich(locationId ?? '');

  const ca = caQuery.data ?? null;

  /* NGÀY LÀM VIỆC hiện tại — tính theo khung ca, không phải theo lịch: ca đêm
     mở 22h hôm trước vẫn thuộc ngày hôm trước. Xem `khungCa.ts::ngayLamViec`. */
  const bayGio = new Date();
  const hai = (n: number) => String(n).padStart(2, '0');
  const mocBayGio = `${bayGio.getFullYear()}-${hai(bayGio.getMonth() + 1)}-${hai(
    bayGio.getDate(),
  )}T${hai(bayGio.getHours())}:${hai(bayGio.getMinutes())}`;
  const ngayHomNay = ngayLamViec(mocBayGio, KHUNG);

  const ngayQuery = useNgayLamViec(ngayHomNay, locationId);

  /* Cảnh báo mở ca muộn tính cho CHÍNH THỜI ĐIỂM NÀY, trước khi bấm nút — nói
     sau khi đã mở thì người ta không còn lựa chọn nào để đổi. */
  const khungBayGio = khungCuaThoiDiem(mocBayGio, KHUNG);
  const muonBayGio = soPhutMoMuon({ moLuc: mocBayGio }, KHUNG);
  const canhBaoMoCa =
    khungBayGio && muonBayGio !== null
      ? { ten: t(khungBayGio.nhanKhoa), batDau: khungBayGio.batDau, soPhutMuon: muonBayGio }
      : null;

  /* Ca đang mở có bị mở muộn không — hiện ngay trên thanh trạng thái. */
  const caMoMuonSoPhut = ca ? soPhutMoMuon(ca, KHUNG) : null;
  const caBiMoMuon = caMoMuonSoPhut !== null && caMoMuonSoPhut > DUNG_SAI_MO_MUON;

  const chuoiNgay =
    ngayQuery.data && ngayQuery.data.ca.length > 0
      ? (gomTheoNgayVaClb(ngayQuery.data.ca, KHUNG, bayGio)[0] ?? null)
      : null;

  /* Tài khoản nhận chuyển khoản tra theo CLB CỦA CA đang mở, không theo CLB
     đang chọn trên thanh trên — cùng một luật với hợp đồng, xem
     `taiKhoanNhanTienCua()`. */
  const taiKhoanCuaCa = ca ? taiKhoanNhanTienCua(ca.locationId, user.locations) : undefined;

  function dongGio() {
    setGio([]);
    setKhachTen('');
    setKhachSdt('');
    setPhuongThuc('tien-mat');
  }

  function themMon(mon: HangQuay) {
    setGio((g) => themVaoGio(g, { sanPhamId: mon.id, ten: mon.ten, donGia: mon.gia }));
  }

  function thuTien() {
    if (!ca) return;
    banHangMut.reset();
    banHangMut.mutate(
      {
        caId: ca.id,
        input: {
          dong: gio,
          phuongThuc,
          khachTen: khachTen.trim() || undefined,
          khachSdt: khachSdt.trim() || undefined,
        },
      },
      { onSuccess: dongGio },
    );
  }

  if (!locationId) {
    return (
      <Card className="text-center text-sm text-muted">{t('quay.chonClbCuThe')}</Card>
    );
  }

  const lyDoKhongBan = viSaoKhongBanDuoc(ca, gio);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'ban-hang', label: t('quay.tabBanHang') },
    { id: 'giao-dich', label: t('quay.tabGiaoDich', { so: ca?.giaoDich.length ?? 0 }) },
    { id: 'doi-soat', label: t('quay.tabDoiSoat') },
    { id: 'chot-ngay', label: t('quay.chotNgay.tab') },
  ];

  return (
    <QueryState
      isLoading={caQuery.isLoading}
      isError={caQuery.isError}
      error={caQuery.error}
      onRetry={() => caQuery.refetch()}
    >
      {!ca ? (
        <div className="space-y-4">
          <MoCaForm
            locationName={locationName}
            khungHienTai={canhBaoMoCa}
            dungSaiMuon={DUNG_SAI_MO_MUON}
            fieldErrors={fieldErrorsOf(moCaMut.error)}
            submitting={moCaMut.isPending}
            onSubmit={(tienDauCa) => {
              moCaMut.reset();
              moCaMut.mutate({ locationId, tienDauCa });
            }}
          />

          {/* Chưa mở ca vẫn phải chốt được ngày: ca cuối đóng xong là màn quay
              về đây, mà ngày thì vẫn còn chờ người xác nhận. */}
          <ChotNgayPanel
            ngay={ngayHomNay}
            locationName={locationName}
            chuoi={chuoiNgay}
            khung={KHUNG}
            daChot={ngayQuery.data?.chotNgay ?? null}
            submitting={chotNgayMut.isPending}
            onChotNgay={(ghiChu) => {
              chotNgayMut.reset();
              chotNgayMut.mutate({ ngay: ngayHomNay, locationId, ghiChu });
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Thanh trạng thái ca — luôn thấy tiền mặt đang phải có trong két */}
          <Card className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-ink">{t('quay.caLa', { maCa: ca.maCa })}</span>
              <span className="text-muted">
                {' · '}
                {ca.thuNganTen}
                {' · '}
                {t('quay.moLuc', { luc: fmtDateTime(ca.moLuc) })}
              </span>
              {/* Mở muộn thì nhãn đi theo ca suốt phiên, không chỉ hiện lúc mở:
                  người nhận ca sau và người giám sát đều cần thấy. */}
              {caBiMoMuon ? (
                <Pill tone="warn">
                  {t('quay.moCa.nhanMuon', { soPhut: caMoMuonSoPhut ?? 0 })}
                </Pill>
              ) : null}
            </div>
            <div className="text-sm">
              <span className="text-muted">{t('quay.tienMatTrongKet')} </span>
              <span className="font-bold tabular-nums text-brand-ink">
                {money(tienMatKyVong(ca))}
              </span>
            </div>
          </Card>

          <div className="flex gap-1 border-b border-line">
            {/* Biến vòng lặp KHÔNG đặt tên `t` — `t` nay là hàm dịch của `useT()`. */}
            {tabs.map((muc) => (
              <button
                key={muc.id}
                type="button"
                onClick={() => setTab(muc.id)}
                className={cn(
                  '-mb-px border-b-2 px-3 py-2 text-sm',
                  tab === muc.id
                    ? 'border-brand font-semibold text-brand-ink'
                    : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {muc.label}
              </button>
            ))}
          </div>

          {tab === 'ban-hang' ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
              <QueryState
                isLoading={hangQuery.isLoading}
                isError={hangQuery.isError}
                error={hangQuery.error}
                onRetry={() => hangQuery.refetch()}
              >
                <BangHang hang={hangQuery.data ?? []} onChon={themMon} />
              </QueryState>

              <GioHang
                taiKhoanNhanTien={taiKhoanCuaCa}
                noiDungChuyenKhoan={ca.maCa}
                gio={gio}
                phuongThuc={phuongThuc}
                khachTen={khachTen}
                khachSdt={khachSdt}
                lyDoKhongBan={lyDoKhongBan}
                submitting={banHangMut.isPending}
                fieldErrors={fieldErrorsOf(banHangMut.error)}
                onDoiSoLuong={(id, sl) => setGio((g) => doiSoLuong(g, id, sl))}
                onDoiPhuongThuc={setPhuongThuc}
                onDoiKhachTen={setKhachTen}
                onDoiKhachSdt={setKhachSdt}
                onXoaGio={dongGio}
                onThuTien={thuTien}
              />
            </div>
          ) : null}

          {tab === 'giao-dich' ? (
            <Card className="p-0">
              <LichSuGiaoDich
                giaoDich={ca.giaoDich}
                canHuy={ca.trangThai === 'dang-mo'}
                onHuy={(gd) => {
                  setLyDoHuy('');
                  setHuyGd(gd);
                }}
              />
            </Card>
          ) : null}

          {tab === 'chot-ngay' ? (
            <ChotNgayPanel
              ngay={ngayHomNay}
              locationName={locationName}
              chuoi={chuoiNgay}
              khung={KHUNG}
              daChot={ngayQuery.data?.chotNgay ?? null}
              submitting={chotNgayMut.isPending}
              onChotNgay={(ghiChu) => {
                chotNgayMut.reset();
                chotNgayMut.mutate({ ngay: ngayHomNay, locationId, ghiChu });
              }}
            />
          ) : null}

          {tab === 'doi-soat' ? (
            <div className="mx-auto max-w-lg">
              <DoiSoatCa
                ca={ca}
                khung={KHUNG}
                fieldErrors={fieldErrorsOf(dongCaMut.error ?? chuyenCaMut.error)}
                submitting={dongCaMut.isPending}
                submittingChuyen={chuyenCaMut.isPending}
                onDongCa={(tienDemCuoiCa, ghiChu) => {
                  dongCaMut.reset();
                  dongCaMut.mutate(
                    { caId: ca.id, input: { tienDemCuoiCa, ghiChu } },
                    { onSuccess: () => setTab('ban-hang') },
                  );
                }}
                onChuyenCa={(tienDemCuoiCa, ghiChu) => {
                  chuyenCaMut.reset();
                  chuyenCaMut.mutate(
                    { caId: ca.id, input: { tienDemCuoiCa, ghiChu } },
                    /* Về thẳng màn bán hàng: ca mới đã mở, người nhận ca bán
                       được ngay mà không phải bấm thêm bước nào. */
                    { onSuccess: () => setTab('ban-hang') },
                  );
                }}
              />
            </div>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={huyGd !== null}
        onOpenChange={(open) => {
          if (!open) setHuyGd(null);
        }}
        title={t('quay.huyGiaoDichNay')}
        description={
          huyGd
            ? t('quay.huyGdCanhBao', {
                ma: huyGd.maGiaoDich,
                soTien: money(huyGd.tongTien),
              })
            : undefined
        }
        confirmLabel={t('quay.huyGiaoDich')}
        danger
        pending={huyMut.isPending}
        onConfirm={() => {
          if (!ca || !huyGd) return;
          if (lyDoHuy.trim() === '') {
            toast.error(t('quay.nhapLyDoHuy'));
            return;
          }
          huyMut.mutate(
            { caId: ca.id, giaoDichId: huyGd.id, lyDo: lyDoHuy.trim() },
            { onSuccess: () => setHuyGd(null) },
          );
        }}
      >
        <label htmlFor="ly-do-huy" className="text-sm font-medium text-ink">
          {t('quay.lyDoHuy')} <span className="text-bad">*</span>
        </label>
        <input
          id="ly-do-huy"
          className="field mt-1"
          value={lyDoHuy}
          onChange={(e) => setLyDoHuy(e.target.value)}
          placeholder={t('quay.viDuLyDoHuy')}
        />
      </ConfirmDialog>
    </QueryState>
  );
}
