'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Drawer, Pagination, QueryState } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { ALL_LOCATIONS, useLocationScope } from '@/components/shell/LocationProvider';
import { ApiError } from '@/lib/api';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { useTrangTheoPhamVi } from '@/lib/hooks/useTrangTheoPhamVi';
import { HoiVienDetail } from './components/HoiVienDetail';
import { HoiVienFilters, type HoiVienFilterValue } from './components/HoiVienFilters';
import { HoiVienForm } from './components/HoiVienForm';
import { HoiVienTable } from './components/HoiVienTable';
import { useHoiVienDetail } from './hooks/useHoiVienDetail';
import { useHoiVienList } from './hooks/useHoiVienList';
import {
  useCreateHoiVien,
  useDoiTrangThaiHoiVien,
  useUpdateHoiVien,
} from './hooks/useHoiVienMutations';
import type { HoiVienInput, HoiVienListParams } from './types';

const PAGE_SIZE = 20;

type Panel =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'detail'; id: string }
  | { mode: 'edit'; id: string };

function fieldErrorsOf(err: unknown): Record<string, string> | undefined {
  return err instanceof ApiError ? err.fieldErrors : undefined;
}

export function HoiVienScreen() {
  const { current: locationScope, options: locationOptions } = useLocationScope();

  const [filters, setFilters] = useState<HoiVienFilterValue>({ search: '' });
  /* Số trang tự về 1 khi ĐỔI CLB — xem `useTrangTheoPhamVi`. */
  const { trang: page, doiTrang: setPage, veTrangDau } = useTrangTheoPhamVi(locationScope);
  const [panel, setPanel] = useState<Panel>({ mode: 'closed' });

  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);

  const params: HoiVienListParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      trangThai: filters.trangThai,
      locationId: locationScope === ALL_LOCATIONS ? undefined : locationScope,
    }),
    [page, debouncedSearch, filters.trangThai, locationScope],
  );

  const list = useHoiVienList(params);

  const activeId = panel.mode === 'detail' || panel.mode === 'edit' ? panel.id : null;
  const detail = useHoiVienDetail(activeId);

  const t = useT();
  const createMut = useCreateHoiVien();
  const updateMut = useUpdateHoiVien();
  const statusMut = useDoiTrangThaiHoiVien();

  const close = () => setPanel({ mode: 'closed' });

  function changeFilters(next: HoiVienFilterValue) {
    setFilters(next);
    veTrangDau();
  }

  function submitCreate(input: HoiVienInput) {
    createMut.reset();
    createMut.mutate(input, { onSuccess: close });
  }

  function submitEdit(input: HoiVienInput) {
    if (panel.mode !== 'edit') return;
    const { id } = panel;
    updateMut.reset();
    updateMut.mutate({ id, input }, { onSuccess: () => setPanel({ mode: 'detail', id }) });
  }

  const result = list.data;
  const hv = detail.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <HoiVienFilters value={filters} onChange={changeFilters} />
        <Button onClick={() => setPanel({ mode: 'create' })}>
          <Plus className="h-4 w-4" />
          {t('hoiVien.them')}
        </Button>
      </div>

      <QueryState
        isLoading={list.isLoading}
        isError={list.isError}
        error={list.error}
        isEmpty={result !== undefined && result.items.length === 0}
        onRetry={() => list.refetch()}
        emptyText={t('hoiVien.khongKhopBoLoc')}
      >
        {result ? (
          <div className="space-y-3">
            <HoiVienTable
              rows={result.items}
              onRowClick={(id) => setPanel({ mode: 'detail', id })}
            />
            <Pagination
              page={result.page}
              pageCount={result.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </QueryState>

      <Drawer
        open={panel.mode === 'create'}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={t('hoiVien.them')}
      >
        <HoiVienForm
          locations={locationOptions}
          fieldErrors={fieldErrorsOf(createMut.error)}
          submitting={createMut.isPending}
          submitLabelKhoa="action.them"
          onSubmit={submitCreate}
          onCancel={close}
        />
      </Drawer>

      <Drawer
        open={panel.mode === 'detail' || panel.mode === 'edit'}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={panel.mode === 'edit' ? t('hoiVien.sua') : t('hoiVien.chiTiet')}
      >
        <QueryState
          isLoading={detail.isLoading}
          isError={detail.isError}
          error={detail.error}
          onRetry={() => detail.refetch()}
        >
          {hv && panel.mode === 'edit' ? (
            <HoiVienForm
              defaultValue={hv}
              locations={locationOptions}
              fieldErrors={fieldErrorsOf(updateMut.error)}
              submitting={updateMut.isPending}
              onSubmit={submitEdit}
              onCancel={() => setPanel({ mode: 'detail', id: hv.id })}
            />
          ) : null}

          {hv && panel.mode === 'detail' ? (
            <HoiVienDetail
              hoiVien={hv}
              changingStatus={statusMut.isPending}
              onDoiTrangThai={(trangThai) => statusMut.mutate({ id: hv.id, trangThai })}
              onEdit={() => setPanel({ mode: 'edit', id: hv.id })}
            />
          ) : null}
        </QueryState>
      </Drawer>
    </div>
  );
}
