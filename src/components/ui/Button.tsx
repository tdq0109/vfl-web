import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* Ánh xạ từ bản cũ: `.btn-primary` → variant="primary", `.btn-ghost` →
   variant="ghost", `.btn-sm` → size="sm". Không dùng cva — thêm sau rẻ hơn gỡ. */

type Variant = 'primary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md';

const base =
  'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap ' +
  'rounded-control font-semibold transition-colors ' +
  'disabled:pointer-events-none disabled:opacity-50';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-ink',
  ghost: 'border border-line bg-surface text-ink hover:bg-brand-soft',
  danger: 'bg-bad text-white hover:brightness-95',
  subtle: 'bg-brand-tint text-brand-ink hover:bg-brand-soft',
};

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, VARIANT[variant], SIZE[size], className)}
      {...props}
    />
  );
});
