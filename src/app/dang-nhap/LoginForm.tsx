'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { internalPath } from '@/lib/auth/paths';
import { Button } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { useDonPhienKhiVaoManDangNhap } from '@/lib/query/donPhien';

/* Form đăng nhập tối giản — placeholder. Designer sẽ giao bản chính thức sau.
   Gọi `/api/auth/login`; nếu thành công, Next đã đặt cookie httpOnly nên chỉ cần
   điều hướng và `router.refresh()` để server đọc lại phiên. */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const t = useT();
  const donPhien = useDonPhienKhiVaoManDangNhap();

  /* CLB không bao giờ được sống sót qua trang đăng nhập.

     Nút Đăng xuất đã dọn kho nhưng nó không phải đường ra duy nhất: hết phiên
     thì server chuyển hướng qua GET /api/auth/thoat, và đường đó không chạy
     được mã client nên sessionStorage giữ nguyên CLB của người trước. Quầy dùng
     chung máy, người sau đăng nhập ngay trên cùng tab là thừa hưởng — bán vé và
     đặt lịch vào nhầm cơ sở, mà màn vẫn trông đúng.

     Đặt ở đây thì phủ mọi đường tới màn đăng nhập. Không tốn gì: middleware đá
     người còn phiên hiệu lực ra khỏi /dang-nhap.

     Dọn cả cache truy vấn vì hồ sơ người trước sống trong đó và nuôi cả lớp ẩn
     nút — xem lib/query/donPhien.ts. Chỉ CLB, không dọn ngôn ngữ. */
  useEffect(() => {
    donPhien();
    /* Chỉ chạy lúc gắn: `donPhien` đổi mỗi lần render nên KHÔNG đưa vào phụ
       thuộc — đưa vào là xoá cache sau mỗi lần gõ phím. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    setFieldErrors({});

    const data = new FormData(e.currentTarget);
    const body = {
      email: String(data.get('email') ?? '').trim(),
      password: String(data.get('password') ?? ''),
    };

    try {
      await api.post('/auth/login', body);
      router.replace(internalPath(params.get('tu')));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        if (err.isAuth) setFormError(t('dangNhap.saiThongTin'));
        /* Lỗi không có `detail`/`title` chỉ mang KHOÁ — `err.message` là chữ cho
           lập trình viên ("HTTP 503"), không phải câu để đưa lên màn. */
        else if (!err.isValidation) {
          setFormError(
            err.khoaThongDiep ? t(err.khoaThongDiep, { ma: err.status }) : err.message,
          );
        }
      } else {
        setFormError(t('dangNhap.khongKetNoi'));
      }
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError ? (
        <p className="rounded-control bg-pill-bad-bg px-3 py-2 text-sm text-pill-bad-fg">
          {formError}
        </p>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          {t('chung.email')}
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" />
        {fieldErrors.email ? <p className="text-xs text-bad">{fieldErrors.email}</p> : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          {t('chung.matKhau')}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field"
        />
        {fieldErrors.password ? <p className="text-xs text-bad">{fieldErrors.password}</p> : null}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t('state.dangDangNhap') : t('action.dangNhap')}
      </Button>
    </form>
  );
}
