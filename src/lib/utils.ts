import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/* Gộp class có điều kiện rồi để tailwind-merge xử lý xung đột (ví dụ `p-4` bị
   `p-0` ghi đè). shadcn/ui đòi đúng hàm tên `cn` ở đúng đường dẫn `@/lib/utils`
   nên đừng đổi tên hay chuyển chỗ. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
