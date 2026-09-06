'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Eraser, ImageUp, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useT } from '@/components/shell/NgonNguProvider';
import { cn } from '@/lib/utils';
import {
  daVe,
  khungVe,
  veVua,
  viSaoKhongNapDuocAnh,
  xoaNenTrang,
  type Diem,
  type Net,
} from './chu-ky';

/* Khung ký tay — phần CHẠM DOM của gói chữ ký. Mọi phép tính nằm ở `chu-ky.ts`
   và có test riêng; ở đây chỉ còn nối canvas với chuột/ngón tay.

   Ba chỗ CỐ Ý khác bản cũ (`commercial-console.html` ~11993–12022), vì bản cũ
   sai thật chứ không phải khác gu:

   1. BẢN CŨ MẤT NÉT KHI KHUNG ĐỔI CỠ. Nó vẽ thẳng lên canvas và không giữ lại
      gì; xoay ngang điện thoại là `cv.width = r.width` xoá sạch chữ ký vừa ký.
      Ở đây nét được giữ trong `netsRef` và vẽ lại sau mỗi lần đổi cỡ.
   2. BẢN CŨ MỜ TRÊN MÀN MẬT ĐỘ CAO. `cv.width = r.width` là 1 điểm ảnh CSS ăn
      1 điểm ảnh thật. Nay nhân theo `devicePixelRatio` (chặn trên ở 3) rồi
      `ctx.scale()`, nên vẫn vẽ bằng toạ độ CSS.
   3. BẢN CŨ ĐẶT `pointerup` TRÊN `window` VÀ KHÔNG BAO GIỜ GỠ. Mỗi lần mở lại
      khung ký là thêm một trình nghe nữa. Nay dùng `setPointerCapture`.

   Giữ nguyên của bản cũ: nét dày 2, đầu nét tròn, mực #0F2733 (token `ink`),
   nạp được ảnh chữ ký có sẵn, và một chấm không tính là đã ký. */

/** Mực ký — đúng màu `ink` của bộ token. Canvas không đọc được biến Tailwind
    nên phải viết số ở đây; đổi token thì đổi cả dòng này. */
const MAU_MUC = '#0F2733';
const DAY_NET = 2;

export interface ChuKyPadHandle {
  /** Ảnh PNG dạng data URL, hoặc `null` khi chưa ký. */
  layAnh: () => string | null;
  xoaHet: () => void;
}

interface Props {
  /** Nhãn đọc được cho trình đọc màn hình — ví dụ "Chữ ký hội viên". */
  label: string;
  disabled?: boolean;
  /** Báo lên trên mỗi khi có/không có chữ ký, để bật tắt nút Lưu. */
  onChange?: (coChuKy: boolean) => void;
  className?: string;
}

export const ChuKyPad = forwardRef<ChuKyPadHandle, Props>(function ChuKyPad(
  { label, disabled, onChange, className },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const netsRef = useRef<Diem[][]>([]);
  /* "Đang đặt bút" giữ ở đây, KHÔNG suy từ `hasPointerCapture()` — xem `datBut`. */
  const dangVeRef = useRef(false);
  /* Ảnh chữ ký nạp từ tệp — giữ nguyên đối tượng ảnh để vẽ lại được khi đổi cỡ
     khung, thay vì chụp một lần rồi thôi như bản cũ. */
  const anhRef = useRef<HTMLImageElement | null>(null);
  const [coChuKy, setCoChuKy] = useState(false);
  const [loiTep, setLoiTep] = useState<string | null>(null);
  const t = useT();

  const capNhat = useCallback(() => {
    const co = daVe(netsRef.current as readonly Net[]) || anhRef.current !== null;
    setCoChuKy(co);
    onChange?.(co);
  }, [onChange]);

  /** Vẽ lại toàn bộ: ảnh nền (nếu có) rồi các nét, theo toạ độ CSS. */
  const veLai = useCallback(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;

    const { rong, cao, ty } = khungVe(cv.clientWidth, cv.clientHeight, window.devicePixelRatio);
    if (cv.width !== rong || cv.height !== cao) {
      cv.width = rong;
      cv.height = cao;
    }
    ctx.setTransform(ty, 0, 0, ty, 0, 0);
    ctx.clearRect(0, 0, rong / ty, cao / ty);

    const anh = anhRef.current;
    if (anh) {
      const o = veVua(
        { rong: anh.naturalWidth, cao: anh.naturalHeight },
        { rong: rong / ty, cao: cao / ty },
      );
      if (o) ctx.drawImage(anh, o.x, o.y, o.rong, o.cao);
    }

    ctx.lineWidth = DAY_NET;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = MAU_MUC;
    for (const net of netsRef.current) {
      const dau = net[0];
      if (!dau || net.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(dau.x, dau.y);
      for (let i = 1; i < net.length; i += 1) {
        const d = net[i];
        if (d) ctx.lineTo(d.x, d.y);
      }
      ctx.stroke();
    }
  }, []);

  /* Đổi cỡ khung thì vẽ lại — KHÔNG đặt state ở đây, chỉ vẽ. */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    veLai();
    const ro = new ResizeObserver(() => veLai());
    ro.observe(cv);
    return () => ro.disconnect();
  }, [veLai]);

  const toaDo = (e: ReactPointerEvent<HTMLCanvasElement>): Diem => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const datBut = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    dangVeRef.current = true;
    netsRef.current.push([toaDo(e)]);
    /* Bắt con trỏ để nét không đứt khi tay đi ra ngoài khung. Chỉ là phần THÊM:
       `setPointerCapture` ném lỗi nếu con trỏ đã bị thành phần khác bắt, và lấy
       nó làm điều kiện "đang vẽ" thì một lần ném là khung ký chết hẳn — bấm gì
       cũng không ra nét, không báo gì. Trạng thái vẽ giữ ở `dangVeRef`. */
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* Không bắt được thì vẫn vẽ, chỉ là nét đứt khi ra khỏi khung. */
    }
  };

  const keoBut = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled || !dangVeRef.current) return;
    const net = netsRef.current[netsRef.current.length - 1];
    if (!net) return;
    net.push(toaDo(e));
    veLai();
  };

  const nhacBut = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dangVeRef.current) return;
    dangVeRef.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* Con trỏ đã tự nhả — không có gì phải làm. */
    }
    /* Một chấm không phải chữ ký — bỏ luôn nét 1 điểm cho `layAnh()` sạch. */
    const net = netsRef.current[netsRef.current.length - 1];
    if (net && net.length < 2) netsRef.current.pop();
    capNhat();
  };

  const xoaHet = useCallback(() => {
    netsRef.current = [];
    anhRef.current = null;
    setLoiTep(null);
    veLai();
    capNhat();
  }, [capNhat, veLai]);

  const hoanTac = () => {
    if (netsRef.current.length > 0) netsRef.current.pop();
    else anhRef.current = null;
    veLai();
    capNhat();
  };

  const napAnh = (e: ChangeEvent<HTMLInputElement>) => {
    const tep = e.target.files?.[0];
    e.target.value = '';
    if (!tep) return;

    const lyDo = viSaoKhongNapDuocAnh(tep);
    if (lyDo) {
      setLoiTep(t(lyDo.khoa, lyDo.thamSo));
      return;
    }
    setLoiTep(null);

    const doc = new FileReader();
    doc.onload = () => {
      const img = new Image();
      img.onload = () => {
        anhRef.current = docNenGiay(img);
        veLai();
        capNhat();
      };
      img.onerror = () => setLoiTep(t('chuKy.loi.khongDocDuocAnh'));
      img.src = String(doc.result);
    };
    doc.onerror = () => setLoiTep(t('chuKy.loi.khongDocDuocTep'));
    doc.readAsDataURL(tep);
  };

  useImperativeHandle(
    ref,
    () => ({
      layAnh: () => {
        const cv = canvasRef.current;
        if (!cv || !(daVe(netsRef.current as readonly Net[]) || anhRef.current)) return null;
        /* Canvas có thể bị "nhiễm" nếu ảnh nạp vào từ nguồn khác — bản cũ trả
           chuỗi 'sig:err' cho ca này; ở đây trả null để chỗ gọi coi như chưa ký. */
        try {
          return cv.toDataURL('image/png');
        } catch {
          return null;
        }
      },
      xoaHet,
    }),
    [xoaHet],
  );

  return (
    <div className={cn('space-y-2', className)}>
      <canvas
        ref={canvasRef}
        aria-label={label}
        role="img"
        className={cn(
          'h-40 w-full touch-none rounded-control border border-line bg-surface',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair',
        )}
        onPointerDown={datBut}
        onPointerMove={keoBut}
        onPointerUp={nhacBut}
        onPointerCancel={nhacBut}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" disabled={disabled || !coChuKy} onClick={hoanTac}>
          <Undo2 className="h-4 w-4" />
          {t('chuKy.hoanTac')}
        </Button>
        <Button variant="ghost" size="sm" disabled={disabled || !coChuKy} onClick={xoaHet}>
          <Eraser className="h-4 w-4" />
          {t('chuKy.xoa')}
        </Button>
        {/* Ô chọn tệp thật bị ẩn: `input type="file"` không tạo kiểu được, và
            đây đúng là ca `label` bọc input mà bản cũ cũng dùng. */}
        <label
          className={cn(
            'inline-flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-control',
            'border border-line bg-surface px-3 text-xs font-semibold text-ink hover:bg-brand-soft',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          <ImageUp className="h-4 w-4" />
          {t('chuKy.taiAnh')}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={disabled}
            onChange={napAnh}
          />
        </label>
        <span className="text-xs text-muted">
          {coChuKy ? t('chuKy.daCo') : t('chuKy.huongDan')}
        </span>
      </div>

      {loiTep ? <p className="text-xs text-bad">{loiTep}</p> : null}
    </div>
  );
});

/** Đục trong nền giấy của ảnh chữ ký chụp/scan, một lần lúc nạp.

    Bản cũ làm việc này muộn hơn — lúc dựng bản hợp đồng để in (`stripBg`) — nên
    ảnh lưu lại vẫn còn nguyên miếng giấy trắng đè lên khung ký. Làm ngay tại
    đây thì thứ gửi lên backend đã sạch. Phép tính ở `xoaNenTrang()`, có test. */
function docNenGiay(img: HTMLImageElement): HTMLImageElement {
  try {
    const cv = document.createElement('canvas');
    cv.width = img.naturalWidth;
    cv.height = img.naturalHeight;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx || cv.width === 0 || cv.height === 0) return img;
    ctx.drawImage(img, 0, 0);
    const anh = ctx.getImageData(0, 0, cv.width, cv.height);
    if (xoaNenTrang(anh.data) === 0) return img;
    ctx.putImageData(anh, 0, 0);
    const sach = new Image();
    sach.src = cv.toDataURL('image/png');
    return sach;
  } catch {
    /* Canvas bị nhiễm hoặc trình duyệt chặn đọc điểm ảnh — dùng ảnh gốc. */
    return img;
  }
}
