import { useEffect, useState } from 'react';

/** Trả bản trễ của `value` sau `delayMs` không đổi. Dùng cho ô tìm kiếm để
    không gọi API mỗi lần gõ phím. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
