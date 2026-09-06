'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, ConfirmDialog, Drawer, QueryState } from '@/components/ui';
import { useSession } from '@/components/auth/SessionProvider';
import { ALL_LOCATIONS, useLocationScope } from '@/components/shell/LocationProvider';
import { useT } from '@/components/shell/NgonNguProvider';
import { ApiError } from '@/lib/api';
import { hasMinRole } from '@/lib/auth/permissions';
import { mondayOf, toIsoDate } from '@/lib/format';
import { BuoiDetail } from './components/BuoiDetail';
import { BuoiForm } from './components/BuoiForm';
import { LichTuan } from './components/LichTuan';
import { TuanNav } from './components/TuanNav';
import { useBuoiDetail, useDanhSachHlv, useLichTuan } from './hooks/useLich';
import {
  useBoCho,
  useChotCho,
  useCreateBuoi,
  useGiuCho,
  useHuyBuoi,
  useRoiHangCho,
  useUpdateBuoi,
  useVaoHangCho,
} from './hooks/useDatLichMutations';
import { LOAI_BUOI_KHOA, LOAI_BUOI_ORDER, type BuoiInput, type LoaiBuoi } from './types';

type Panel =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'detail'; id: string }
  | { mode: 'edit'; id: string };

function fieldErrorsOf(err: unknown): Record<string, string> | undefined {
  return err instanceof ApiError ? err.fieldErrors : undefined;
}

export function DatLichScreen() {
  const t = useT();
  const actor = useSession();
  const { current: locationScope, options: locationOptions } = useLocationScope();

  const [thuHai, setThuHai] = useState(() => mondayOf(new Date()));
  const [loai, setLoai] = useState<LoaiBuoi | undefined>();
  const [panel, setPanel] = useState<Panel>({ mode: 'closed' });
  const [xacNhanHuy, setXacNhanHuy] = useState(false);

  const locationId = locationScope === ALL_LOCATIONS ? undefined : locationScope;

  const params = useMemo(
    () => ({ tuNgay: toIsoDate(thuHai), locationId, loai }),
    [thuHai, locationId, loai],
  );

  const lich = useLichTuan(params);
  const hlvs = useDanhSachHlv(locationId);

  const activeId = panel.mode === 'detail' || panel.mode === 'edit' ? panel.id : null;
  const detail = useBuoiDetail(activeId);

  const createMut = useCreateBuoi();
  const updateMut = useUpdateBuoi();
  const huyMut = useHuyBuoi();
  const giuChoMut = useGiuCho();
  const chotChoMut = useChotCho();
  const boChoMut = useBoCho();
  const vaoHangChoMut = useVaoHangCho();
  const roiHangChoMut = useRoiHangCho();

  const duocSua = hasMinRole(actor, 'leader');
  const dangGhiCho =
    giuChoMut.isPending ||
    chotChoMut.isPending ||
    boChoMut.isPending ||
    vaoHangChoMut.isPending ||
    roiHangChoMut.isPending ||
    huyMut.isPending;

  const close = () => setPanel({ mode: 'closed' });

  function submitCreate(input: BuoiInput) {
    createMut.reset();
    createMut.mutate(input, { onSuccess: close });
  }

  function submitEdit(input: BuoiInput) {
    if (panel.mode !== 'edit') return;
    const { id } = panel;
    updateMut.reset();
    updateMut.mutate({ id, input }, { onSuccess: () => setPanel({ mode: 'detail', id }) });
  }

  const buoi = detail.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <TuanNav thuHai={thuHai} onDoiTuan={setThuHai} />
          <select
            aria-label={t('datLich.loaiBuoi')}
            className="field w-40"
            value={loai ?? ''}
            onChange={(e) => setLoai(e.target.value ? (e.target.value as LoaiBuoi) : undefined)}
          >
            <option value="">{t('chung.moiLoai')}</option>
            {LOAI_BUOI_ORDER.map((l) => (
              <option key={l} value={l}>
                {t(LOAI_BUOI_KHOA[l])}
              </option>
            ))}
          </select>
        </div>

        {duocSua ? (
          <Button onClick={() => setPanel({ mode: 'create' })}>
            <Plus className="h-4 w-4" />
            {t('datLich.taoBuoi')}
          </Button>
        ) : null}
      </div>

      <QueryState
        isLoading={lich.isLoading}
        isError={lich.isError}
        error={lich.error}
        onRetry={() => lich.refetch()}
      >
        <LichTuan
          thuHai={thuHai}
          buois={lich.data ?? []}
          onChonBuoi={(id) => setPanel({ mode: 'detail', id })}
        />
      </QueryState>

      {/* Tạo buổi */}
      <Drawer
        open={panel.mode === 'create'}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={t('datLich.taoBuoi')}
        description={t('datLich.baoTrungLich')}
      >
        <BuoiForm
          hlvs={hlvs.data ?? []}
          locations={locationOptions}
          fieldErrors={fieldErrorsOf(createMut.error)}
          submitting={createMut.isPending}
          submitLabel={t('action.tao')}
          onSubmit={submitCreate}
          onCancel={close}
        />
      </Drawer>

      {/* Chi tiết / sửa buổi */}
      <Drawer
        open={panel.mode === 'detail' || panel.mode === 'edit'}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={panel.mode === 'edit' ? t('datLich.suaBuoi') : t('datLich.chiTietBuoi')}
      >
        <QueryState
          isLoading={detail.isLoading}
          isError={detail.isError}
          error={detail.error}
          onRetry={() => detail.refetch()}
        >
          {buoi && panel.mode === 'edit' ? (
            <BuoiForm
              defaultValue={buoi}
              buoiId={buoi.id}
              hlvs={hlvs.data ?? []}
              locations={locationOptions}
              fieldErrors={fieldErrorsOf(updateMut.error)}
              submitting={updateMut.isPending}
              onSubmit={submitEdit}
              onCancel={() => setPanel({ mode: 'detail', id: buoi.id })}
            />
          ) : null}

          {buoi && panel.mode === 'detail' ? (
            <BuoiDetail
              buoi={buoi}
              canEdit={duocSua}
              pending={dangGhiCho}
              onGiuCho={(hoiVienId) => giuChoMut.mutate({ buoiId: buoi.id, hoiVienId })}
              onChotCho={(choId) => chotChoMut.mutate({ buoiId: buoi.id, choId })}
              onBoCho={(choId) => boChoMut.mutate({ buoiId: buoi.id, choId })}
              onVaoHangCho={(hoiVienId) => vaoHangChoMut.mutate({ buoiId: buoi.id, hoiVienId })}
              onRoiHangCho={(choDoiId) => roiHangChoMut.mutate({ buoiId: buoi.id, choDoiId })}
              onHuyBuoi={() => setXacNhanHuy(true)}
              onEdit={() => setPanel({ mode: 'edit', id: buoi.id })}
            />
          ) : null}
        </QueryState>
      </Drawer>

      <ConfirmDialog
        open={xacNhanHuy}
        onOpenChange={setXacNhanHuy}
        title={t('datLich.huyBuoiNay')}
        description={t('datLich.huyBuoiCanhBao')}
        confirmLabel={t('datLich.huyBuoi')}
        danger
        pending={huyMut.isPending}
        onConfirm={() => {
          if (buoi) {
            huyMut.mutate(buoi.id, { onSuccess: () => setXacNhanHuy(false) });
          }
        }}
      />
    </div>
  );
}
