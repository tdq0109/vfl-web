import type { ReactNode } from 'react';

/* Bọc một ô nhập: nhãn + gợi ý + lỗi. Dùng chung cho mọi form. Không nhầm với
   class `.field` trong globals.css (kiểu dáng của chính ô input). */
interface FormFieldProps {
  label: ReactNode;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}

export function FormField({ label, htmlFor, error, required, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-bad"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? <p className="text-xs text-bad">{error}</p> : null}
    </div>
  );
}
