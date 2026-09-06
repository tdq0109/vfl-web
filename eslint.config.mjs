import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/* Cấu hình ESLint dạng "flat" — bắt buộc từ ESLint 9, mà `eslint-config-next@16`
   thì yêu cầu ESLint >= 9.

   Thay cho `.eslintrc.json` cũ (`extends: next/core-web-vitals, next/typescript`).
   Next 16 đã BỎ HẲN lệnh `next lint`, nên `npm run lint` giờ gọi thẳng ESLint —
   xem `package.json`. */

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
  ...coreWebVitals,
  ...typescript,
];

export default config;
