# VFL Alpha Management — Frontend

Frontend Next.js của hệ thống quản lý VFL Alpha, viết lại từ 4 web app tĩnh cũ.
Backend là dịch vụ .NET riêng do đội khác dựng; **kho này chỉ có frontend** —
không có schema, không thiết kế API, không di trú dữ liệu.

| | |
|---|---|
| **Nền tảng** | Next.js 16 (App Router, Turbopack) · React 18 · TypeScript `strict` · Tailwind · TanStack Query v5 |
| **Nghiệp vụ** | Hội viên · Nhân viên · Sản phẩm · Đặt lịch · Bán vé quầy · Hợp đồng · Tổng quan |
| **Phiên đăng nhập** | BFF — token nằm trong cookie `httpOnly`, JavaScript không chạm tới |
| **Ngôn ngữ giao diện** | Việt / Anh, nhớ trong cookie nên server dựng HTML đúng ngôn ngữ ngay từ byte đầu |

> 📘 **Nguồn sự thật về trạng thái dự án là [`BAN-GIAO-LO-TRINH-FRONTEND-v3.md`](BAN-GIAO-LO-TRINH-FRONTEND-v3.md)** —
> đã dựng gì, quy ước bắt buộc, việc còn lại. Sổ tay ngày mở nằm ở
> [`TRIEN-KHAI.md`](TRIEN-KHAI.md).

> 📦 **Bản bàn giao.** Kho này đã được dọn để chuyển cho đội triển khai: không
> còn bộ test, không còn trang thử component nội bộ, không còn tệp dựng tạm.
> Thứ **được giữ lại có chủ ý** là `tools/mock-dotnet.mjs` — backend .NET giả
> chạy trong RAM, đủ dữ liệu mẫu và đủ endpoint để bấm thử mọi màn khi backend
> thật chưa sẵn sàng.

## Chạy thử

Cần Node 20 trở lên (máy phát triển đang dùng Node 24).

```bash
npm install
cp .env.example .env.local     # điền DOTNET_API_URL
npm run mock                   # cửa sổ 1 — backend .NET giả, cổng 5099
npm run dev                    # cửa sổ 2 — http://localhost:3000
```

Đăng nhập bằng một trong ba tài khoản của mock (mật khẩu bất kỳ), mỗi tài khoản
thấy một bộ màn khác nhau:

| Tài khoản | Vai trò |
|---|---|
| `sale@vfl.vn` | `staff` — lập hợp đồng |
| `ketoan@vfl.vn` | `accountant` — xác minh & phát hành |
| `gd@vfl.vn` | `director` — toàn hệ thống, xem báo cáo |

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Máy chủ phát triển |
| `npm run mock` | Backend .NET giả (`tools/mock-dotnet.mjs`), phủ đủ mọi màn và tự kiểm các quy tắc quan trọng |
| `npm run kiem-tra` | **Cổng chất lượng**: `tsc --noEmit` → `eslint .` → `next build` |
| `npm run i18n-con-lai` | Đếm chuỗi chưa dịch trong `src` |
| `npm run build` / `npm start` | Dựng và chạy bản thật |

## Quy ước bắt buộc

Chi tiết và lý do nằm trong tài liệu bàn giao; ba điều hay quên nhất:

1. **Quy tắc nghiệp vụ mới = hàm thuần, giao diện chỉ gọi vào hàm đó.** Hàm
   thuần không import React và nằm cạnh nhóm nghiệp vụ (ví dụ
   `features/hop-dong/hop-dong.ts`) — đừng nhét điều kiện tiền bạc vào
   component. Bản bàn giao này **không kèm bộ test**; đội tiếp nhận tự chọn
   khung test, nhưng code đã ở đúng hình dạng để test.
2. **Không `fetch` ngoài `lib/api/client.ts` (client) và `lib/server/dotnet.ts`
   (server).** Component trong `components/` không gọi API — nhận props và vẽ.
3. **Kiểm tra quyền ở frontend chỉ để ẨN NÚT.** Backend .NET mới là nơi thực thi
   luật; đừng trình bày kiểm tra ở frontend như một biện pháp bảo mật.

## Cấu trúc

```
src/app/          route App Router + route handler /api/* (proxy sang .NET)
src/components/   bộ component nền (ui) + khung app (shell) + auth
src/features/     bảy nhóm nghiệp vụ — mỗi nhóm có api / hooks / components / hàm thuần
src/lib/          format · api · auth · i18n · query · storage
src/packages/     gói tự port: signature-pad · vietqr · xlsx-writer
tools/            mock backend .NET · công cụ quét chuỗi chưa dịch
```
