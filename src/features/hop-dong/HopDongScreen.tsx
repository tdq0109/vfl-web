'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, ConfirmDialog, Drawer, Pagination, QueryState, toast } from '@/components/ui';
import { Can } from '@/components/auth/Can';
import { useSession } from '@/components/auth/SessionProvider';
import { ALL_LOCATIONS, useLocationScope } from '@/components/shell/LocationProvider';
import { useT } from '@/components/shell/NgonNguProvider';
import { ApiError } from '@/lib/api';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { useTrangTheoPhamVi } from '@/lib/hooks/useTrangTheoPhamVi';
import { taiKhoanNhanTienCua } from '@/lib/locations';
import { HopDongDetail } from './components/HopDongDetail';
import { HopDongFilters, type HopDongFilterValue } from './components/HopDongFilters';
import { HopDongForm } from './components/HopDongForm';
import { HopDongTable } from './components/HopDongTable';
import { useHopDongDetail, useHopDongList } from './hooks/useHopDong';
import {
  useChuyenTrangThai,
  useCreateHopDong,
  useThanhToanHopDong,
  useUpdateHopDong,
} from './hooks/useHopDongMutations';
import { useHoiVienChon, useKhuyenMaiDangChay, useSanPhamBanDuoc } from './hooks/useNguonChon';
import { viSaoKhongChuyenDuoc } from './hop-dong';
import { lyDoThanhChu } from './lyDo';
import {
  HANH_DONG_KHOA,
  type HopDongInput,
  type HopDongListParams,
  type ThanhToanInput,
  type TrangThaiHopDong,
} from './types';

/* Container của nhóm Hợp đồng: nối hook ↔ component, giữ máy trạng thái của các
   panel. Không có quy tắc nghiệp vụ nào ở đây — mọi điều kiện đi tiếp nằm trong
   `hop-dong.ts` và đã có test. */

const PAGE_SIZE = 20;

type Panel =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'detail'; id: string }
  | { mode: 'edit'; id: string };

function fieldErrorsOf(err: unknown): Record<string, string> | undefined {
  return err instanceof ApiError ? err.fieldErrors : undefined;
}

export function HopDongScreen() {
  const t = useT();
  const user = useSession();
  const { current: locationScope, options: locationOptions } = useLocationScope();
  const locationId = locationScope === ALL_LOCATIONS ? undefined : locationScope;

  const [filters, setFilters] = useState<HopDongFilterValue>({ search: '' });
  /* Số trang tự về 1 khi ĐỔI CLB — xem `useTrangTheoPhamVi`. */
  const { trang: page, doiTrang: setPage, veTrangDau } = useTrangTheoPhamVi(locationScope);
  const [panel, setPanel] = useState<Panel>({ mode: 'closed' });
  const [hvSearch, setHvSearch] = useState('');
  /* Mọi bước của máy trạng thái đều đi qua hộp xác nhận — hợp đồng là chứng từ,
     không có bước nào bấm nhầm mà lùi lại được ở 12a. */
  const [xacNhan, setXacNhan] = useState<TrangThaiHopDong | null>(null);
  const [ghiChu, setGhiChu] = useState('');
  /* Ảnh chữ ký giữ tạm từ lúc bấm ở khung ký tới lúc bấm xác nhận. `null` =
     ký giấy, hệ chỉ ghi nhận trạng thái như trước khi có gói `signature-pad`. */
  const [chuKy, setChuKy] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);
  const debouncedHvSearch = useDebouncedValue(hvSearch.trim(), 300);

  const params: HopDongListParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      trangThai: filters.trangThai,
      locationId,
    }),
    [page, debouncedSearch, filters.trangThai, locationId],
  );

  const list = useHopDongList(params);

  const activeId = panel.mode === 'detail' || panel.mode === 'edit' ? panel.id : null;
  const detail = useHopDongDetail(activeId);

  const dangSoanThao = panel.mode === 'create' || panel.mode === 'edit';
  const hoiVienChon = useHoiVienChon(debouncedHvSearch, locationId, dangSoanThao);
  const sanPhamChon = useSanPhamBanDuoc(locationId, dangSoanThao);
  const khuyenMaiChon = useKhuyenMaiDangChay(dangSoanThao);

  const createMut = useCreateHopDong();
  const updateMut = useUpdateHopDong();
  const chuyenMut = useChuyenTrangThai();
  const thuMut = useThanhToanHopDong();

  const close = () => setPanel({ mode: 'closed' });

  function changeFilters(next: HopDongFilterValue) {
    setFilters(next);
    veTrangDau();
  }

  function submitCreate(input: HopDongInput) {
    createMut.reset();
    createMut.mutate(input, {
      onSuccess: (hd) => setPanel({ mode: 'detail', id: hd.id }),
    });
  }

  function submitEdit(input: HopDongInput) {
    if (panel.mode !== 'edit') return;
    const { id } = panel;
    updateMut.reset();
    updateMut.mutate({ id, input }, { onSuccess: () => setPanel({ mode: 'detail', id }) });
  }

  function submitThanhToan(input: ThanhToanInput) {
    if (!hd) return;
    thuMut.reset();
    thuMut.mutate({ id: hd.id, input });
  }

  function moXacNhan(den: TrangThaiHopDong, ky?: string | null) {
    setGhiChu('');
    setChuKy(ky ?? null);
    setXacNhan(den);
  }

  function chuyen() {
    if (!hd || !xacNhan) return;
    /* Chặn lần cuối trước khi gọi API — dữ liệu có thể đã đổi từ lúc mở hộp
       thoại. Backend vẫn kiểm lại và trả 409 nếu trễ hơn nữa. */
    const lyDo = viSaoKhongChuyenDuoc(hd, xacNhan, user);
    if (lyDo) {
      toast.error(lyDoThanhChu(t, lyDo));
      return;
    }
    if (xacNhan === 'da-huy' && ghiChu.trim() === '') {
      toast.error(t('hopDong.nhapLyDoHuy'));
      return;
    }
    chuyenMut.reset();
    chuyenMut.mutate(
      {
        id: hd.id,
        input: {
          den: xacNhan,
          ghiChu: ghiChu.trim() || undefined,
          /* Chỉ gửi kèm ở đúng bước ký — các bước khác mang theo ảnh là rác. */
          chuKy: xacNhan === 'da-ky' ? chuKy ?? undefined : undefined,
        },
      },
      {
        onSuccess: () => {
          setXacNhan(null);
          setChuKy(null);
        },
      },
    );
  }

  const result = list.data;
  const hd = detail.data;

  /* Tài khoản nhận chuyển khoản tra theo CLB của hợp đồng, không theo CLB đang
     chọn trên thanh trên: Giám đốc xem ở chế độ "Tất cả CLB" mà mở hợp đồng của
     Quận 7 thì hai thứ đó khác nhau, lấy nhầm là khách chuyển tiền về CLB khác.

     Dữ liệu đi kèm hồ sơ người dùng nên không cần gọi API. Không tìm thấy CLB
     thì để trống, KhoiChuyenKhoan tự nói lý do. */
  const taiKhoanCuaHopDong = hd
    ? taiKhoanNhanTienCua(hd.locationId, user.locations)
    : undefined;

  const formProps = {
    hoiVienSearch: hvSearch,
    onHoiVienSearchChange: setHvSearch,
    hoiVienOptions: hoiVienChon.data?.items ?? [],
    sanPham: sanPhamChon.data?.items ?? [],
    khuyenMai: khuyenMaiChon.data ?? [],
    /* Hợp đồng thuộc đúng CLB đang làm việc; ở chế độ "Tất cả CLB" thì phải chọn. */
    locations: locationId
      ? locationOptions.filter((l) => l.id === locationId)
      : locationOptions,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <HopDongFilters value={filters} onChange={changeFilters} />
        <Can minRole="staff">
          <Button onClick={() => setPanel({ mode: 'create' })}>
            <Plus className="h-4 w-4" />
            {t('hopDong.lap')}
          </Button>
        </Can>
      </div>

      <QueryState
        isLoading={list.isLoading}
        isError={list.isError}
        error={list.error}
        isEmpty={result !== undefined && result.items.length === 0}
        onRetry={() => list.refetch()}
        emptyText={t('hopDong.khongKhopBoLoc')}
      >
        {result ? (
          <div className="space-y-3">
            <HopDongTable
              rows={result.items}
              onRowClick={(id) => setPanel({ mode: 'detail', id })}
            />
            <Pagination page={result.page} pageCount={result.totalPages} onPageChange={setPage} />
          </div>
        ) : null}
      </QueryState>

      <Drawer
        open={panel.mode === 'create'}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={t('hopDong.lap')}
        description={t('hopDong.buoc1BaoGia')}
        className="max-w-2xl"
      >
        {dangSoanThao ? (
          <HopDongForm
            {...formProps}
            fieldErrors={fieldErrorsOf(createMut.error)}
            submitting={createMut.isPending}
            onSubmit={submitCreate}
            onCancel={close}
          />
        ) : null}
      </Drawer>

      <Drawer
        open={panel.mode === 'detail' || panel.mode === 'edit'}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={panel.mode === 'edit' ? t('hopDong.suaBaoGia') : t('hopDong.chiTiet')}
        className="max-w-2xl"
      >
        <QueryState
          isLoading={detail.isLoading}
          isError={detail.isError}
          error={detail.error}
          onRetry={() => detail.refetch()}
        >
          {hd && panel.mode === 'edit' ? (
            <HopDongForm
              {...formProps}
              defaultValue={hd}
              locations={locationOptions}
              fieldErrors={fieldErrorsOf(updateMut.error)}
              submitting={updateMut.isPending}
              submitLabel={t('hopDong.luuThayDoi')}
              onSubmit={submitEdit}
              onCancel={() => setPanel({ mode: 'detail', id: hd.id })}
            />
          ) : null}

          {hd && panel.mode === 'detail' ? (
            <HopDongDetail
              hopDong={hd}
              actor={user}
              taiKhoanNhanTien={taiKhoanCuaHopDong}
              chuyenPending={chuyenMut.isPending}
              thuPending={thuMut.isPending}
              thuFieldErrors={fieldErrorsOf(thuMut.error)}
              onEdit={() => setPanel({ mode: 'edit', id: hd.id })}
              onChuyen={moXacNhan}
              onThanhToan={submitThanhToan}
            />
          ) : null}
        </QueryState>
      </Drawer>

      <ConfirmDialog
        open={xacNhan !== null}
        onOpenChange={(open) => {
          if (!open) setXacNhan(null);
        }}
        title={xacNhan ? t(HANH_DONG_KHOA[xacNhan]) : ''}
        description={
          hd && xacNhan
            ? xacNhan === 'da-huy'
              ? t('hopDong.xacNhanHuy', { ma: hd.maHopDong })
              : xacNhan === 'da-ky'
                ? t('hopDong.xacNhanKy', {
                    ma: hd.maHopDong,
                    ten: hd.hoiVienTen,
                    chuKy: chuKy ? t('hopDong.seLuuChuKy') : t('hopDong.khongKemChuKy'),
                  })
                : t('hopDong.xacNhanChuyen', { ma: hd.maHopDong, ten: hd.hoiVienTen })
            : undefined
        }
        confirmLabel={xacNhan ? t(HANH_DONG_KHOA[xacNhan]) : t('chung.xacNhan')}
        danger={xacNhan === 'da-huy'}
        pending={chuyenMut.isPending}
        onConfirm={chuyen}
      >
        <label htmlFor="hd-ghi-chu" className="text-sm font-medium text-ink">
          {xacNhan === 'da-huy' ? t('hopDong.lyDoHuy') : t('chung.ghiChu')}
          {xacNhan === 'da-huy' ? <span className="text-bad"> *</span> : null}
        </label>
        <input
          id="hd-ghi-chu"
          className="field mt-1"
          value={ghiChu}
          onChange={(e) => setGhiChu(e.target.value)}
          placeholder={
            xacNhan === 'da-huy' ? t('hopDong.viDuLyDoHuy') : t('hopDong.viDuGhiChuChuyen')
          }
        />
      </ConfirmDialog>
    </div>
  );
}
