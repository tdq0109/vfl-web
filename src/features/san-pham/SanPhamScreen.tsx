'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Drawer, Pagination, QueryState } from '@/components/ui';
import { useSession } from '@/components/auth/SessionProvider';
import { ALL_LOCATIONS, useLocationScope } from '@/components/shell/LocationProvider';
import { useT } from '@/components/shell/NgonNguProvider';
import { ApiError } from '@/lib/api';
import { hasMinRole } from '@/lib/auth/permissions';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { useTrangTheoPhamVi } from '@/lib/hooks/useTrangTheoPhamVi';
import { cn } from '@/lib/utils';
import { KhuyenMaiForm } from './components/KhuyenMaiForm';
import { KhuyenMaiTable } from './components/KhuyenMaiTable';
import { SanPhamDetail } from './components/SanPhamDetail';
import { SanPhamFilters, type SanPhamFilterValue } from './components/SanPhamFilters';
import { SanPhamForm } from './components/SanPhamForm';
import { SanPhamTable } from './components/SanPhamTable';
import { useKhuyenMaiList, useSanPhamDetail, useSanPhamList } from './hooks/useSanPham';
import {
  useCreateKhuyenMai,
  useCreateSanPham,
  useDatGiaSan,
  useDoiKichHoatKhuyenMai,
  useDoiTrangThaiSanPham,
  useUpdateKhuyenMai,
  useUpdateSanPham,
} from './hooks/useSanPhamMutations';
import type { KhuyenMai, KhuyenMaiInput, SanPhamInput, SanPhamListParams } from './types';

const PAGE_SIZE = 20;

type Tab = 'danh-muc' | 'khuyen-mai';

type Panel =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'detail'; id: string }
  | { mode: 'edit'; id: string }
  | { mode: 'km-create' }
  | { mode: 'km-edit'; km: KhuyenMai };

function fieldErrorsOf(err: unknown): Record<string, string> | undefined {
  return err instanceof ApiError ? err.fieldErrors : undefined;
}

export function SanPhamScreen() {
  const t = useT();
  const actor = useSession();
  const { current: locationScope, options: locationOptions } = useLocationScope();

  const [tab, setTab] = useState<Tab>('danh-muc');
  const [filters, setFilters] = useState<SanPhamFilterValue>({ search: '' });
  /* Số trang tự về 1 khi ĐỔI CLB — xem `useTrangTheoPhamVi`. */
  const { trang: page, doiTrang: setPage, veTrangDau } = useTrangTheoPhamVi(locationScope);
  const [panel, setPanel] = useState<Panel>({ mode: 'closed' });

  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);

  const params: SanPhamListParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      loai: filters.loai,
      trangThai: filters.trangThai,
      locationId: locationScope === ALL_LOCATIONS ? undefined : locationScope,
    }),
    [page, debouncedSearch, filters.loai, filters.trangThai, locationScope],
  );

  const list = useSanPhamList(params);
  const khuyenMai = useKhuyenMaiList();

  const activeId = panel.mode === 'detail' || panel.mode === 'edit' ? panel.id : null;
  const detail = useSanPhamDetail(activeId);

  const createMut = useCreateSanPham();
  const updateMut = useUpdateSanPham();
  const giaSanMut = useDatGiaSan();
  const statusMut = useDoiTrangThaiSanPham();
  const kmCreateMut = useCreateKhuyenMai();
  const kmUpdateMut = useUpdateKhuyenMai();
  const kmToggleMut = useDoiKichHoatKhuyenMai();

  const duocSua = hasMinRole(actor, 'manager');

  const close = () => setPanel({ mode: 'closed' });

  function changeFilters(next: SanPhamFilterValue) {
    setFilters(next);
    veTrangDau();
  }

  function submitCreate(input: SanPhamInput) {
    createMut.reset();
    createMut.mutate(input, { onSuccess: close });
  }

  function submitEdit(input: SanPhamInput) {
    if (panel.mode !== 'edit') return;
    const { id } = panel;
    updateMut.reset();
    updateMut.mutate({ id, input }, { onSuccess: () => setPanel({ mode: 'detail', id }) });
  }

  function submitKhuyenMai(input: KhuyenMaiInput) {
    if (panel.mode === 'km-create') {
      kmCreateMut.reset();
      kmCreateMut.mutate(input, { onSuccess: close });
    } else if (panel.mode === 'km-edit') {
      const { id } = panel.km;
      kmUpdateMut.reset();
      kmUpdateMut.mutate({ id, input }, { onSuccess: close });
    }
  }

  const result = list.data;
  const sp = detail.data;
  /* Bảng khuyến mãi cần giá sản phẩm để tính cảnh báo phá giá sàn. */
  const sanPhams = result?.items ?? [];

  const tabs: { id: Tab; label: string }[] = [
    { id: 'danh-muc', label: t('sanPham.danhMucBangGia') },
    { id: 'khuyen-mai', label: t('khuyenMai.nhom') },
  ];

  return (
    <div className="space-y-4">
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

      {tab === 'danh-muc' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SanPhamFilters value={filters} onChange={changeFilters} />
            {duocSua ? (
              <Button onClick={() => setPanel({ mode: 'create' })}>
                <Plus className="h-4 w-4" />
                {t('sanPham.them')}
              </Button>
            ) : null}
          </div>

          <QueryState
            isLoading={list.isLoading}
            isError={list.isError}
            error={list.error}
            isEmpty={result !== undefined && result.items.length === 0}
            onRetry={() => list.refetch()}
            emptyText={t('sanPham.khongKhopBoLoc')}
          >
            {result ? (
              <div className="space-y-3">
                <SanPhamTable
                  rows={result.items}
                  onRowClick={(id) => setPanel({ mode: 'detail', id })}
                />
                <Pagination page={result.page} pageCount={result.totalPages} onPageChange={setPage} />
              </div>
            ) : null}
          </QueryState>
        </>
      ) : null}

      {tab === 'khuyen-mai' ? (
        <>
          <div className="flex justify-end">
            {duocSua ? (
              <Button onClick={() => setPanel({ mode: 'km-create' })}>
                <Plus className="h-4 w-4" />
                {t('khuyenMai.them')}
              </Button>
            ) : null}
          </div>

          <QueryState
            isLoading={khuyenMai.isLoading}
            isError={khuyenMai.isError}
            error={khuyenMai.error}
            isEmpty={khuyenMai.data?.length === 0}
            onRetry={() => khuyenMai.refetch()}
            emptyText={t('khuyenMai.chuaCo')}
          >
            {khuyenMai.data ? (
              <KhuyenMaiTable
                rows={khuyenMai.data}
                sanPhams={sanPhams}
                canEdit={duocSua}
                togglingId={kmToggleMut.isPending ? kmToggleMut.variables?.id : undefined}
                onEdit={(km) => setPanel({ mode: 'km-edit', km })}
                onToggle={(km) => kmToggleMut.mutate({ id: km.id, kichHoat: !km.kichHoat })}
              />
            ) : null}
          </QueryState>
        </>
      ) : null}

      {/* Thêm sản phẩm */}
      <Drawer
        open={panel.mode === 'create'}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={t('sanPham.them')}
        description={t('sanPham.giaSanDatSau')}
      >
        <SanPhamForm
          locations={locationOptions}
          fieldErrors={fieldErrorsOf(createMut.error)}
          submitting={createMut.isPending}
          submitLabel={t('action.them')}
          onSubmit={submitCreate}
          onCancel={close}
        />
      </Drawer>

      {/* Chi tiết / sửa sản phẩm */}
      <Drawer
        open={panel.mode === 'detail' || panel.mode === 'edit'}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={panel.mode === 'edit' ? t('sanPham.sua') : t('sanPham.chiTiet')}
      >
        <QueryState
          isLoading={detail.isLoading}
          isError={detail.isError}
          error={detail.error}
          onRetry={() => detail.refetch()}
        >
          {sp && panel.mode === 'edit' ? (
            <SanPhamForm
              defaultValue={sp}
              giaSanHienTai={sp.giaSan}
              locations={locationOptions}
              fieldErrors={fieldErrorsOf(updateMut.error)}
              submitting={updateMut.isPending}
              onSubmit={submitEdit}
              onCancel={() => setPanel({ mode: 'detail', id: sp.id })}
            />
          ) : null}

          {sp && panel.mode === 'detail' ? (
            <SanPhamDetail
              sanPham={sp}
              actor={actor}
              changingStatus={statusMut.isPending}
              settingFloor={giaSanMut.isPending}
              floorFieldErrors={fieldErrorsOf(giaSanMut.error)}
              onDatGiaSan={(giaSan) => {
                giaSanMut.reset();
                giaSanMut.mutate({ id: sp.id, giaSan });
              }}
              onDoiTrangThai={(trangThai) => statusMut.mutate({ id: sp.id, trangThai })}
              onEdit={() => setPanel({ mode: 'edit', id: sp.id })}
            />
          ) : null}
        </QueryState>
      </Drawer>

      {/* Thêm / sửa khuyến mãi */}
      <Drawer
        open={panel.mode === 'km-create' || panel.mode === 'km-edit'}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={panel.mode === 'km-edit' ? t('khuyenMai.sua') : t('khuyenMai.them')}
        className="max-w-lg"
      >
        <KhuyenMaiForm
          defaultValue={panel.mode === 'km-edit' ? panel.km : undefined}
          sanPhams={sanPhams}
          fieldErrors={fieldErrorsOf(
            panel.mode === 'km-edit' ? kmUpdateMut.error : kmCreateMut.error,
          )}
          submitting={kmCreateMut.isPending || kmUpdateMut.isPending}
          submitLabel={panel.mode === 'km-edit' ? t('action.luu') : t('action.them')}
          onSubmit={submitKhuyenMai}
          onCancel={close}
        />
      </Drawer>
    </div>
  );
}
