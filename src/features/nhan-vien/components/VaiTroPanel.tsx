'use client';

import { useId, useState } from 'react';
import { Lock } from 'lucide-react';
import { Button, FormField } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import {
  ROLE_KHOA,
  assignableRoles,
  canGrantAllLocations,
  canManageStaff,
  roleKhoa,
  type Role,
} from '@/lib/auth/permissions';
import type { UserProfile } from '@/lib/auth/types';
import type { DoiVaiTroInput, NhanVien } from '../types';

/* Khối gán vai trò, nơi phân quyền 3 chiều hiện ra thành giao diện: danh sách
   chọn chỉ chứa vai trò thấp hơn hẳn người đang thao tác; không thao tác được
   người ở CLB ngoài phạm vi mình; ô tích "toàn hệ thống" chỉ bật cho Giám đốc.

   Đây chỉ là lớp ẩn/hiện, backend .NET vẫn phải tự kiểm tra đủ ba chiều. */

interface Props {
  nhanVien: NhanVien;
  actor: UserProfile;
  fieldErrors?: Record<string, string>;
  submitting?: boolean;
  onSubmit: (input: DoiVaiTroInput) => void;
}

export function VaiTroPanel({ nhanVien, actor, fieldErrors = {}, submitting, onSubmit }: Props) {
  const t = useT();
  const uid = useId();
  const [vaiTro, setVaiTro] = useState<Role>(nhanVien.vaiTro as Role);
  const [allLocations, setAllLocations] = useState(nhanVien.allLocations);

  const laChinhMinh = actor.id === nhanVien.id;
  const duocSua =
    !laChinhMinh &&
    canManageStaff(actor, { role: nhanVien.vaiTro, locationId: nhanVien.locationId });
  const roles = assignableRoles(actor);
  const duocGanAllClub = canGrantAllLocations(actor);

  if (!duocSua) {
    return (
      <div className="space-y-2 rounded-control border border-line bg-brand-tint p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <Lock className="h-4 w-4 text-muted" />
          {t('nhanVien.vaiTroHienTai', { vaiTro: t(roleKhoa(nhanVien.vaiTro)) })}
          {nhanVien.allLocations ? ` · ${t('chung.toanHeThong')}` : ''}
        </div>
        <p className="text-xs text-muted">
          {laChinhMinh ? t('nhanVien.khongTuDoiVaiTro') : t('nhanVien.khongDuThamQuyen')}
        </p>
      </div>
    );
  }

  const daDoi = vaiTro !== nhanVien.vaiTro || allLocations !== nhanVien.allLocations;

  return (
    <div className="space-y-3 rounded-control border border-line p-3">
      <FormField label={t('chung.vaiTro')} htmlFor={`${uid}-vt`} error={fieldErrors.vaiTro}>
        <select
          id={`${uid}-vt`}
          className="field"
          value={vaiTro}
          onChange={(e) => setVaiTro(e.target.value as Role)}
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {t(ROLE_KHOA[r])}
            </option>
          ))}
        </select>
      </FormField>

      <label
        className={`flex items-center gap-2 text-sm ${duocGanAllClub ? 'text-ink' : 'text-muted'}`}
      >
        {/* `.field` có w-full nên KHÔNG dùng cho checkbox — bản cũ đã phải vá tay 20 chỗ vì lỗi này */}
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-line accent-brand"
          checked={allLocations}
          disabled={!duocGanAllClub}
          onChange={(e) => setAllLocations(e.target.checked)}
        />
        {t('nhanVien.toanHeThongMoiClb')}
      </label>
      {!duocGanAllClub ? (
        <p className="text-xs text-muted">{t('nhanVien.chiGiamDocGanCo')}</p>
      ) : null}
      {fieldErrors.allLocations ? (
        <p className="text-xs text-bad">{fieldErrors.allLocations}</p>
      ) : null}

      <Button
        size="sm"
        disabled={!daDoi || submitting}
        onClick={() => onSubmit({ vaiTro, allLocations })}
      >
        {submitting ? t('state.dangLuu') : t('nhanVien.luuVaiTro')}
      </Button>
    </div>
  );
}
