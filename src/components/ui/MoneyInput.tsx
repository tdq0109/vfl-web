'use client';

import { useLayoutEffect, useRef, type InputHTMLAttributes } from 'react';
import { moneyInput, parseVnd } from '@/lib/format';
import { cn } from '@/lib/utils';

/* Ô nhập tiền VND: hiển thị nhóm hàng nghìn ngay khi gõ, trả về số nguyên
   đồng.

   Định dạng lại khi gõ sẽ làm con trỏ nhảy về cuối, mà người vận hành sửa số ở
   giữa cả ngày nên phải giữ đúng chỗ. Cách làm: đếm số chữ số đứng trước con
   trỏ, định dạng lại, rồi đặt con trỏ sau đúng ngần ấy chữ số. */

interface MoneyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number | null;
  onValueChange: (value: number) => void;
}

/** Số chữ số nằm trước vị trí `pos` trong chuỗi đã định dạng. */
function digitsBefore(text: string, pos: number): number {
  let n = 0;
  for (let i = 0; i < pos && i < text.length; i += 1) {
    if (text.charCodeAt(i) >= 48 && text.charCodeAt(i) <= 57) n += 1;
  }
  return n;
}

/** Vị trí ngay sau chữ số thứ `n` (đếm từ 1). */
function posAfterDigit(text: string, n: number): number {
  if (n <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) >= 48 && text.charCodeAt(i) <= 57) {
      seen += 1;
      if (seen === n) return i + 1;
    }
  }
  return text.length;
}

export function MoneyInput({ value, onValueChange, className, ...props }: MoneyInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  /* Số chữ số đứng trước con trỏ tại lần gõ vừa rồi; null = không cần chỉnh. */
  const caretDigits = useRef<number | null>(null);

  const text = moneyInput(value);

  useLayoutEffect(() => {
    const el = ref.current;
    const n = caretDigits.current;
    if (!el || n === null) return;
    caretDigits.current = null;
    const pos = posAfterDigit(el.value, n);
    el.setSelectionRange(pos, pos);
  });

  return (
    <input
      ref={ref}
      inputMode="numeric"
      className={cn('field text-right tabular-nums', className)}
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        caretDigits.current = digitsBefore(raw, e.target.selectionStart ?? raw.length);
        onValueChange(parseVnd(raw));
      }}
      {...props}
    />
  );
}
