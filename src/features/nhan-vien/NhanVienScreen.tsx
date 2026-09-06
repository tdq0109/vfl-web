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
import { MaTranPhanQuyen } from './components/MaTranPhanQuyen';
import { NhanVienDetail } from './components/NhanVienDetail';
import { NhanVienFilters, type NhanVienFilterValue } from './components/NhanVienFilters';
import { NhanVienForm } from './components/NhanVienForm';
import { NhanVienTable } from './components/NhanVienTable';
import { useNhanVienDetail } from './hooks/useNhanVienDetail';
import { useNhanVienList } from './hooks/useNhanVienList';
import {
  useCreateNhanVien,
  useDoiTrangThaiNhanVien,
  useDoiVaiTro,
  useUpdateNhanVien,
} from './hooks/useNhanVienMutations';
import type { NhanVienInput, NhanVienListParams } from './types';

const PAGE_SIZE = 20;

type Tab = 'danh-ba' | 'phan-quyen';

type Panel =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'detail'; id: string }
  | { mode: 'edit'; id: string };

function fieldErrorsOf(err: unknown): Record<string, string> | undefined {
  return err instanceof ApiError ? err.fieldErrors : undefined;
}

export function NhanVienScreen() {
  const t = useT();
  const actor = useSession();
  const { current: locationScope, options: locationOptions } = useLocationScope();

  const [tab, setTab] = useState<Tab>('danh-ba');
  const [filters, setFilters] = useState<NhanVienFilterValue>({ search: '' });
  /* Số trang tự về 1 khi ĐỔI CLB — xem `useTrangTheoPhamVi`. */
  const { trang: page, doiTrang: setPage, veTrangDau } = useTrangTheoPhamVi(locationScope);
  const [panel, setPanel] = useState<Panel>({ mode: 'closed' });

  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);

  const params: NhanVienListParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      vaiTro: filters.vaiTro,
      trangThai: filters.trangThai,
      locationId: locationScope === ALL_LOCATIONS ? undefined : locationScope,
    }),
    [page, debouncedSearch, filters.vaiTro, filters.trangThai, locationScope],
  );

  const list = useNhanVienList(params);

  const activeId = panel.mode === 'detail' || panel.mode === 'edit' ? panel.id : null;
  const detail = useNhanVienDetail(activeId);

  const createMut = useCreateNhanVien();
  const updateMut = useUpdateNhanVien();
  const roleMut = useDoiVaiTro();
  const statusMut = useDoiTrangThaiNhanVien();

  /* Chỉ Quản lý CLB trở lên mới thêm được người mới — khớp ma trận phân quyền.
     Backend vẫn kiểm tra lại. */
  const duocThem = hasMinRole(actor, 'manager');

  const close = () => setPanel({ mode: 'closed' });

  function changeFilters(next: NhanVienFilterValue) {
    setFilters(next);
    veTrangDau();
  }

  function submitCreate(input: NhanVienInput) {
    createMut.reset();
    createMut.mutate(input, { onSuccess: close });
  }

  function submitEdit(input: NhanVienInput) {
    if (panel.mode !== 'edit') return;
    const { id } = panel;
    updateMut.reset();
    updateMut.mutate({ id, input }, { onSuccess: () => setPanel({ mode: 'detail', id }) });
  }

  const result = list.data;
  const nv = detail.data;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'danh-ba', label: t('nhanVien.danhBa') },
    { id: 'phan-quyen', label: t('nhanVien.maTranPhanQuyen') },
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

      {tab === 'phan-quyen' ? <MaTranPhanQuyen /> : null}

      {tab === 'danh-ba' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <NhanVienFilters value={filters} onChange={changeFilters} />
            {duocThem ? (
              <Button onClick={() => setPanel({ mode: 'create' })}>
                <Plus className="h-4 w-4" />
                {t('nhanVien.them')}
              </Button>
            ) : null}
          </div>

          <QueryState
            isLoading={list.isLoading}
            isError={list.isError}
            error={list.error}
            isEmpty={result !== undefined && result.items.length === 0}
            onRetry={() => list.refetch()}
            emptyText={t('nhanVien.khongKhopBoLoc')}
          >
            {result ? (
              <div className="space-y-3">
                <NhanVienTable
                  rows={result.items}
                  onRowClick={(id) => setPanel({ mode: 'detail', id })}
                />
                <Pagination page={result.page} pageCount={result.totalPages} onPageChange={setPage} />
              </div>
            ) : null}
          </QueryState>
        </>
      ) : null}

      <Drawer
        open={panel.mode === 'create'}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={t('nhanVien.them')}
        description={t('nhanVien.vaiTroGanSau')}
      >
        <NhanVienForm
          locations={locationOptions}
          fieldErrors={fieldErrorsOf(createMut.error)}
          submitting={createMut.isPending}
          submitLabel={t('action.them')}
          onSubmit={submitCreate}
          onCancel={close}
        />
      </Drawer>

      <Drawer
        open={panel.mode === 'detail' || panel.mode === 'edit'}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={panel.mode === 'edit' ? t('nhanVien.suaHoSo') : t('nhanVien.hoSo')}
      >
        <QueryState
          isLoading={detail.isLoading}
          isError={detail.isError}
          error={detail.error}
          onRetry={() => detail.refetch()}
        >
          {nv && panel.mode === 'edit' ? (
            <NhanVienForm
              defaultValue={nv}
              locations={locationOptions}
              fieldErrors={fieldErrorsOf(updateMut.error)}
              submitting={updateMut.isPending}
              onSubmit={submitEdit}
              onCancel={() => setPanel({ mode: 'detail', id: nv.id })}
            />
          ) : null}

          {nv && panel.mode === 'detail' ? (
            <NhanVienDetail
              nhanVien={nv}
              actor={actor}
              changingStatus={statusMut.isPending}
              changingRole={roleMut.isPending}
              roleFieldErrors={fieldErrorsOf(roleMut.error)}
              onDoiTrangThai={(trangThai) => statusMut.mutate({ id: nv.id, trangThai })}
              onDoiVaiTro={(input) => {
                roleMut.reset();
                roleMut.mutate({ id: nv.id, input });
              }}
              onEdit={() => setPanel({ mode: 'edit', id: nv.id })}
            />
          ) : null}
        </QueryState>
      </Drawer>
    </div>
  );
}
