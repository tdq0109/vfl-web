# VFL Alpha Management — Bàn giao lộ trình Frontend (v3)

> Dán tài liệu này vào đầu đoạn chat mới để tiếp tục. Nó chứa đủ bối cảnh, những
> gì đã dựng xong, các quy ước phải tuân theo, và kế hoạch cho phần còn lại.
> Câu mở đầu soạn sẵn nằm ở **mục 11**.

**Lịch sử bản tài liệu:** v1 chốt Bước 1–2 · v2 chốt Bước 1–11 · **v3 (bản này)**
chốt tới Bước 13, hai mốc nâng Next và phần chuẩn bị Bước 14 — rồi được cập nhật
thêm: **`packages/signature-pad`**, **test tương tác (jsdom + RTL)**,
**`packages/vietqr`**, **hạ tầng i18n + bộ chuyển ngôn ngữ**, rồi lần lượt **cả
bảy nhóm nghiệp vụ** (Hội viên → Nhân viên → Tổng quan → Sản phẩm → Đặt lịch →
Bán vé ngày tại quầy → Hợp đồng), và **mock phủ đủ mọi màn**.

**Đọc phần i18n theo thứ tự đó.** Bảy mục ghi lại theo đúng trình tự đã làm, và
mỗi mục chỉ ghi CÁI MỚI của nhóm ấy — nhóm Hội viên dựng khuôn, Nhân viên thêm
bảng ngoài `features/`, Sản phẩm mở màn cho hàm thuần trả khoá, Đặt lịch tìm ra
hai lỗ hổng bằng cách phá code, Hợp đồng buộc đổi hình dạng hàm thuần. Đọc mỗi
mục Hợp đồng thì thiếu bốn phần năm lý do vì sao nó phải làm như vậy.

> ⚠ Tài liệu này là NGUỒN SỰ THẬT DUY NHẤT về trạng thái dự án. Mọi con số trong
> đây đều kiểm lại được: `npm run kiem-tra` (test), `npm run i18n-con-lai` (chuỗi
> chưa dịch). Làm xong việc gì thì cập nhật ngay vào đây, đừng để trong đầu.

## 0a. ⚠ Bản đã dọn để bàn giao — đọc trước

Kho này đã được dọn trước khi chuyển cho đội triển khai. Ba thứ **đã gỡ khỏi mã
nguồn**:

| Đã gỡ | Là gì |
|---|---|
| Toàn bộ bộ test | 84 tệp `*.test.ts(x)`, `src/test/jsdom.tsx`, `vitest.config.mts`, `vitest.setup.ts`, và các gói `vitest` · `@testing-library/*` · `jsdom` trong `package.json` |
| `app/thu-nghiem/` | Trang thử bộ component nền, chỉ có ở bản dev, có nút gây lỗi cố ý |
| Tệp dựng tạm | `.next/`, `tsconfig.tsbuildinfo` |

Thứ **giữ lại có chủ ý** là `tools/mock-dotnet.mjs` (`npm run mock`): backend
.NET giả chạy trong RAM, kèm dữ liệu mẫu và đủ endpoint để bấm thử mọi màn khi
backend thật chưa sẵn sàng. Đây là nguồn dữ liệu duy nhất để chạy thử.

Hệ quả cho người đọc tài liệu này:

- **Cổng chất lượng nay có ba bước**, không còn bước test:
  `npm run kiem-tra` = `tsc --noEmit` → `eslint .` → `next build`.
- `npm run i18n-con-lai` nay báo **11 chuỗi** (trước là 42 — 31 chuỗi kia thuộc
  trang `thu-nghiem` đã xoá). Cả 11 đều là câu cho lập trình viên hoặc mã định
  dạng, không lên màn.
- **Mọi đoạn bên dưới nhắc tới `*.test.ts`, `vitest`, `npm test`,
  `src/test/jsdom.tsx` hay `/thu-nghiem` đều là LỊCH SỬ.** Giữ lại vì chúng
  ghi *vì sao* mã có hình dạng hiện tại — mỗi cái bẫy nghiệp vụ từng được phát
  hiện bằng cách cố ý phá code — chứ không mô tả tệp đang có trong kho. Đội tiếp
  nhận tự chọn khung test; các hàm thuần (`features/*/*.ts`, `lib/format`,
  `packages/*`) không import React nên gắn test vào rất thẳng.

---

## 0. Đọc 30 giây

| | |
|---|---|
| **Nền tảng** | Next.js 16.3.4 · React 18 · TypeScript strict · Tailwind · TanStack Query v5 |
| **Sức khoẻ** | `npm run kiem-tra` = tsc · eslint · build — tất cả xanh. `npm audit`: **0 vulnerabilities**. Bộ test đã gỡ khi bàn giao — xem mục 0a |
| **Đã dựng** | 6 nhóm nghiệp vụ (Hội viên · Nhân viên · Sản phẩm · Đặt lịch · Bán vé quầy · **Hợp đồng luồng thuận**) + **Dashboard** + **Giám sát ca quầy** + **chuyển ca / chốt ngày** + khung app + phiên đăng nhập BFF |
| **Gói đã port** | **`signature-pad`** (chữ ký tay, bước "ký") · **`vietqr`** (mã QR chuyển khoản, hợp đồng + quầy) · **`xlsx-writer`** (xuất Excel, OOXML + ZIP tự viết — phần chart chưa port) |
| **i18n** | hạ tầng + **bộ chuyển ngôn ngữ lúc chạy** (nút EN/VI) + **XONG TOÀN BỘ** — bảy nhóm nghiệp vụ, bộ component nền, BA gói port, và nhóm `app` (nhớ ngôn ngữ trong **cookie** nên server dựng HTML đúng ngôn ngữ ngay từ byte đầu). 11 chuỗi còn lại là câu cho lập trình viên hoặc mã định dạng |
| **Chạy thử ngay** | `npm run mock` (backend .NET giả, cổng 5099 — **phủ đủ mọi màn**) rồi `npm run dev` — đăng nhập `sale@vfl.vn` · `ketoan@vfl.vn` · `gd@vfl.vn`, mật khẩu bất kỳ |
| **Việc tiếp theo** | xem **mục 7.0**. **Không còn việc nào làm được mà không chờ bên ngoài**: bảng A xong, `xlsx-writer` xong. Hai gói cuối chờ quyết định (thêm phụ thuộc Tesseract · Google client ID); còn lại chờ đội .NET (B), vận hành (C), thời gian (D) |
| **Chưa có** | in phiếu quầy · Bước 12b (ngoại lệ hợp đồng) · chữ ký Bên A · hai gói `cccd-scan` / `gsheets` · **xuất Excel cho sổ giao dịch** (gói `xlsx-writer` đã sẵn, chưa nối) |
| **Đang chờ bên ngoài** | đội .NET dựng endpoint (mục 5) và trả `taiKhoanNhanTien` theo CLB · vận hành cấp số tài khoản thật |

---

## 1. Bối cảnh

**Hệ thống cũ** là 4 web app tĩnh (HTML + JS thuần, không build tool), tổng
~20.400 dòng, dùng chung phiên Supabase qua `localStorage`. Toàn bộ nghiệp vụ nằm
ở ~190 RPC Postgres.

| Tệp | Dòng | Nội dung |
|---|---|---|
| `commercial-console.html` | 12.478 | Trung tâm: hợp đồng 5 bước, dashboard, hội viên, bán nhanh, bảng giá, 6 báo cáo, 8 màn nhân sự, đặt lịch, academy, chăm lead |
| `alpha-management-crm.html` | 2.743 | Lead & hội viên: 8 view, kanban kéo thả, gộp trùng, import Excel |
| `marketing-os.html` | 2.435 | React 18 UMD + Babel in-browser, 7 tab |
| `bod-sales-report.html` | 1.095 | 8 mục báo cáo cho BOD, chỉ đọc |
| `cccd-scanner.js` | 1.028 | Quét CCCD: jsQR + Tesseract MRZ + quét tiếp sức |
| `alpha-brand.js` | 330 | Favicon + màn welcome |

**Việc đang làm:** chuyển frontend sang React + Next.js. Backend do đội khác viết
lại bằng .NET với một project Supabase hoàn toàn mới.

**Phạm vi: CHỈ frontend.** Không bàn schema, không thiết kế API, không lo di trú
dữ liệu.

**Phase 1 phủ 6 nhóm:** Hội viên · Nhân viên · Sản phẩm · Đặt lịch · Bán hàng ·
Dashboard. **Lương/payroll KHÔNG thuộc Phase 1.**

---

## 2. Các quyết định đã chốt

| Hạng mục | Quyết định | Lý do |
|---|---|---|
| Framework | Next.js 16.3.4, App Router, React 18 | Có tầng server → token nằm trong cookie httpOnly. Nâng 14 → 15 → 16 ở hai mốc riêng — xem mục 3 |
| Ngôn ngữ | TypeScript `strict` + `noUncheckedIndexedAccess` + `target ES2022` | Hệ có nhiều dữ liệu tiền bạc |
| CSS | Tailwind, token đặt tên theo nghĩa | Giai đoạn 2 thay layout → chỉ sửa `tailwind.config.ts` |
| Dữ liệu | TanStack Query v5 | Xoá được phần lớn code `loadX()` / `renderX()` thủ công |
| Component phức tạp | **Radix primitives trực tiếp**, KHÔNG dùng shadcn | Xem mục 6.1 — đây là thay đổi so với v1 |
| Test | **Đã gỡ khi bàn giao** (mục 0a). Bản trước dùng Vitest — `node` env mặc định, render bằng `renderToStaticMarkup`; tệp cần click/gõ thì khai `// @vitest-environment jsdom` | Đội tiếp nhận tự chọn khung test. Hàm thuần không import React nên gắn lại rất thẳng |
| Layout | Giữ nguyên bản cũ | Designer sẽ giao bộ mới sau |

---

## 3. Đã hoàn thành — Bước 1 đến 13, nâng Next 16, chuẩn bị Bước 14, chữ ký tay

Trạng thái hiện tại: **`npm run kiem-tra` xanh — `tsc --noEmit` · 733/733 test
(84 tệp) · `eslint .` · `next build`.**

Quy mô: **~14.750 dòng code + ~8.950 dòng test** trong `src/` — và phần tiền bạc
(giá sàn, đặt lịch, quầy, hợp đồng, dashboard) là phần dày test nhất.

### Bước 1–2 · Dự án & cấu hình nền ✅

`npx create-next-app@14` + bộ token trích từ `commercial-console.html`:

```
bg #EEF5F8 · surface #FFFFFF · ink #0F2733 · muted #5B7280 · line #DBE7EE
brand #0E7490 · brand-ink #0B5566 · brand-soft #EAF3F6 · brand-tint #F1F7F9
accent #E0533D · ok #15803D · warn #B45309 · bad #B91C1C
pill-bg/fg, pill-ok-*, pill-warn-*, pill-bad-*
rounded-card 14px · rounded-control 10px · shadow-card · shadow-menu
text-base = 15px/1.45   (hệ cũ chạy 15px, không phải 16px)
```

`layout.tsx` dùng `Inter({ subsets: ['latin', 'vietnamese'] })`.
`globals.css` có `select { color-scheme: light }` và class `.field`.

> ⚠ **`tsconfig` đã thêm `"target": "ES2022"`** (v1 không có). Thiếu nó thì tsc
> chặn top-level await, iterate `Set`, và regex `\p{...}`.

### Bước 3 · Bộ component nền ✅ — `src/components/ui/`

`Button` (4 biến thể × 2 cỡ) · `Card` · `Table`/`Th`/`Td` (`align="right"` tự bật
`tabular-nums`) · `Pill` (4 tông) · `PageHeader` · `FormField` · `QueryState`
(gộp tải/lỗi/rỗng) · `Pagination` · `Drawer` · `ConfirmDialog` · `MoneyInput` ·
`Toast` (hàng đợi module-scope, gọi được ngoài React) · `ErrorBoundary`.

Kèm `src/lib/utils.ts` với `cn()` (clsx + tailwind-merge).

### Bước 4 · Hàm tiện ích & tầng API ✅ — `src/lib/`

- `format/money.ts` — `money()`, `moneyInput()`, `parseVnd()`, `roundVnd()`
- `format/date.ts` — `fmtDate`, `fmtDateTime`, `toIsoDate`, `vnDateToIso`,
  `mondayOf`, `monthBounds`, `addDays` — **toàn bộ theo giờ địa phương**
- `format/text.ts` — `normalize()` bỏ dấu tiếng Việt, `initials()`, `maskPhone()`
- `api/errors.ts` — `ApiError` theo ProblemDetails (RFC 7807), `fieldErrors`
  phẳng hoá có cả PascalCase lẫn camelCase
- `api/types.ts` — `Paged<T>`, `PageQuery`, `Vnd`, `IsoDate`, `Location`
- `api/client.ts` — `api.get/post/put/patch/delete`, **gộp mọi lần refresh 401
  đồng thời thành một** (`refreshInFlight`)

### Bước 5 · Phiên đăng nhập (BFF) ✅

- `lib/auth/session.ts` — cookie httpOnly `vfl_at` (15′) / `vfl_rt` (30 ngày)
- `lib/auth/cookies.ts` — tên cookie, edge-safe, dùng chung với middleware
- `lib/auth/paths.ts` — `internalPath()` chặn open-redirect (`//evil.com`, `/\evil.com`)
- `lib/server/dotnet.ts` — **nơi duy nhất** biết `DOTNET_API_URL`
- `lib/server/http.ts` — `relay()` chuyển nguyên phản hồi .NET về client
- Route handler: `login` · `refresh` · `logout` · `me` · **`lam-moi`** ·
  **`thoat`** · `[...path]` (proxy chung, gắn Bearer, lọc hop-by-hop)
- `proxy.ts` — gác cổng trước khi React chạy (Next 16 đổi tên từ `middleware.ts`)

> ⚠ **Lỗi lặp vòng đã sửa (có test hồi quy).** Bản đầu chỉ xét cookie refresh:
> sau 15 phút không thao tác, access hết hạn nhưng refresh còn → `/tong-quan` →
> `/dang-nhap` → `/` → `/tong-quan` lặp vô tận. Nay middleware xét **cả hai**:
> chỉ còn refresh thì sang `/api/auth/lam-moi?tu=...` lấy access mới rồi quay
> lại. Layout `(app)` gặp phiên hỏng thì `redirect('/api/auth/thoat')` để **xoá
> cookie trước** — server component không đặt được cookie.

### Bước 6 · Khung app ✅

- `lib/auth/permissions.ts` — phân quyền **3 chiều**: cấp bậc vai trò
  (`ctv 10 · staff/coach 20 · leader 30 · accountant 35 · manager 40 ·
  director 60 · ceo 100`), phạm vi CLB, cờ All Club. Kèm `ROLE_LABEL`,
  `ROLE_ORDER`, `assignableRoles()`, `canManageStaff()`
- `lib/auth/capabilities.ts` — ma trận phân quyền để **hiển thị** (17 mục)
- `components/auth/SessionProvider.tsx` + `Can.tsx`
- `components/shell/navigation.ts` — **menu là dữ liệu**, 7 mục, quyền tự lọc
- `components/shell/Topbar.tsx` + `AppShell.tsx` + `LocationProvider.tsx`
- `lib/query/queryClient.ts` + `keys.ts` + `app/providers.tsx`
- `lib/i18n/` — `t(key)`, `vi.json` / `en.json`

> ✅ **Hai bẫy trong v1 đều đã tránh, có chú thích tại chỗ:**
> 1. `QueryClient` tạo trong `useState`, không ở module scope (rò rỉ cache giữa
>    user trên server).
> 2. `LocationProvider` KHÔNG đọc `sessionStorage` lúc render (hydration
>    mismatch). Cách hiện tại là `useSyncExternalStore` — xem mục dưới.

### Bước 7 · Hội viên ✅ — **bước định khuôn**

`features/hoi-vien/` — 698 dòng. Danh sách lọc/phân trang, chi tiết, thêm, sửa,
đổi trạng thái. Trang là **server component mỏng**, tương tác nằm trong
`HoiVienScreen` (client).

### Bước 8 · Nhân viên ✅

`features/nhan-vien/` — 991 dòng. Danh bạ, hồ sơ, gán vai trò, **ma trận phân
quyền**. Không gồm lương.

### Bước 9 · Sản phẩm ✅

`features/san-pham/` — 1.507 dòng + **19 test**. Danh mục, bảng giá, **giá sàn**
(chỉ director+), khuyến mãi. `gia.ts` là module hàm thuần.

**Điểm đáng giá:** cảnh báo khuyến mãi phá giá sàn hiện **trước khi lưu** —
`7 sản phẩm sẽ xuống dưới giá sàn / Gói tập 1 tháng: 600.000 ₫ < sàn 950.000 ₫`.

### Bước 10 · Đặt lịch ✅

`features/dat-lich/` — 1.344 dòng + **36 test**. PT/Lớp/SGT, lịch tuần 7 cột,
giữ chỗ + hàng chờ, **chống trùng lịch HLV**. `lich.ts` là module hàm thuần.

**Ba bẫy, mỗi bẫy một test:**
1. **Xuyên CLB** — HLV không thể ở hai CLB cùng lúc. `timTrungLichHlv()` và
   `datLichApi.lichHlv()` **cố ý không nhận `locationId`**.
2. **Liền kề ≠ trùng** — 8–9h và 9–10h hợp lệ. Khoảng nửa mở `[batDau, ketThuc)`.
3. **Tự trùng chính mình** khi sửa — tham số `boQuaId`.

### Bước 11 · Bán vé ngày tại quầy ✅

`features/ban-hang-quay/` — 1.109 dòng + **20 test**. Ca thu ngân (mở/đóng),
bán vé + khách vãng lai, huỷ giao dịch, **đối soát cuối ca**. `quay.ts` là module
hàm thuần.

**Hai bẫy, mỗi bẫy một test:**
1. **Chỉ tiền mặt vào két** — bảng `VAO_KET`. Cộng nhầm chuyển khoản/thẻ thì ca
   nào cũng báo "thiếu" đúng bằng doanh thu không tiền mặt.
2. **Giao dịch huỷ không tính** vào bất kỳ tổng nào.

### Bước 12a · Hợp đồng — luồng thuận ✅

`features/hop-dong/` — ~1.900 dòng + **32 test** (26 cho máy trạng thái, 6 cho
endpoint). Luồng `báo giá → thu đủ → kế toán xác minh → phát hành → ký → kích
hoạt`, cộng huỷ TRƯỚC phát hành. `hop-dong.ts` là module hàm thuần.

**Sáu bẫy, mỗi bẫy một test — cả sáu đã kiểm chứng bằng cách cố tình phá code:**
1. **Không nhảy cóc trạng thái** — bảng `CHUYEN_TIEP` là nguồn sự thật duy nhất.
2. **Không đi tiếp khi chưa thu đủ** — chặn ở cả `cho-xac-minh` lẫn `da-phat-hanh`.
3. **Tách nhiệm** — người lập không tự xác minh được, kể cả Giám đốc.
4. **Không bán dưới giá sàn** — dùng lại `viPhamGiaSan()` của Bước 9, xét cả
   khuyến mãi toàn hợp đồng.
5. **Làm tròn tiền** — ĐÃ CHỐT: giảm giá tính trên tạm tính rồi làm tròn MỘT LẦN
   (làm tròn từng dòng rồi cộng lệch 1.000 ₫ mỗi hợp đồng).
6. **`het-han` suy từ ngày**, không lưu — `trangThaiHienThi()`.

**Component mới:** `<StepHopDong>` (thanh 5 bước, thay `.step`), `<BangTongTien>`
(thay `.totals`), `<DongSanPham>` (chọn sản phẩm + số lượng + giá, cảnh báo phá
sàn ngay khi gõ), `<ThuTienForm>`, `<HopDongDetail>` với nhật ký chuyển trạng thái.

**Ghi chú thiết kế:**
- Tổng hợp đồng **không lưu** trong kiểu `HopDong` — luôn tính từ `dong` +
  `khuyenMai` bằng `tinhTongHopDong()`.
- Giá niêm yết và giá sàn được **chụp vào từng dòng** lúc lập; đổi bảng giá sau
  đó không làm hợp đồng cũ đọc ra số khác.
- Mọi bước đi qua MỘT endpoint `chuyen-trang-thai` và MỘT hook
  `useChuyenTrangThai()` → thêm cạnh ở 12b không phải thêm hook.
- Nút bị chặn luôn hiện **câu lý do** lấy từ `viSaoKhongChuyenDuoc()`.

**Chưa làm trong 12a (thuộc 12b):** sửa/huỷ phiếu thu đã ghi, huỷ hoá đơn sau
phát hành, kế toán trả lại, trả góp/công nợ, tạm dừng. Các cạnh đó **cố ý chưa
có** trong `CHUYEN_TIEP`. Bước "ký" nay đã gắn `signature-pad` — xem mục dưới.

**Đã kiểm chứng end-to-end** với mock .NET dựng lại theo mục 6.3: chặn 400 khi
dưới sàn, 409 khi nhảy cóc / chưa thu đủ / thu thừa, 403 khi người lập tự xác
minh; đi trọn 6 mốc `bao-gia → dang-hieu-luc`.

### Bước 13 · Dashboard ✅

`features/tong-quan/` — ~1.180 dòng + **25 test** (16 hàm thuần, 5 endpoint, 4
render). Hai tầng: khối **“hôm nay”** ai cũng xem được (buổi tập, hợp đồng đang
treo, quầy đã mở ca chưa — mỗi ô dẫn thẳng tới màn xử lý), và khối **báo cáo**
từ Trưởng nhóm trở lên (5 chỉ số, biểu đồ doanh thu theo ngày, bán chạy trong kỳ).

**Sáu bẫy, mỗi bẫy một test — cả sáu đã kiểm chứng bằng cách cố tình phá code:**
1. **Kỳ so sánh phải cùng độ dài** — `kyTruoc()`. Tháng này mới qua 10 ngày mà
   đem so với trọn tháng trước thì tháng nào cũng “giảm 60%”.
2. **Chia cho 0** — kỳ trước bằng 0 trả `null`, hiện “Mới”, không `Infinity`.
3. **Ngày theo giờ địa phương** — `toIsoDate`, không `toISOString`.
4. **Chuỗi ngày thiếu điểm** — backend trả THƯA, `dienDayChuoiNgay()` điền 0.
   Component vẽ KHÔNG tự vá dữ liệu, để lỗi lộ ra ở tầng có test.
5. **Thang biểu đồ khi mọi giá trị bằng 0** — không chia 0, không `NaN`.
6. **Kỳ ngược** (từ ngày > đến ngày) — trả chuỗi rỗng, không lặp vô hạn.

**Đã chốt: KHÔNG dùng thư viện biểu đồ.** Biểu đồ cột vẽ bằng div + token
(`components/BieuDoCot.tsx`). Lý do giống mục 6.1: mọi thư viện biểu đồ mang theo
hệ màu và hệ kích thước riêng — một hệ style thứ hai. Trang `/tong-quan` nặng
**5,98 kB**. Cần biểu đồ phức tạp hơn (chồng lớp, trục thời gian co giãn) thì
hẵng bàn lại.

**Không có endpoint “so sánh hai kỳ”** — màn gọi `tom-tat` hai lần (kỳ này và
`kyTruoc()`), so ở frontend. Backend chỉ phải biết cộng theo khoảng ngày.

**Công nợ không so sánh theo kỳ** — nó là số chốt tại thời điểm xem, không thuộc
kỳ nào; thẻ chỉ số cho `tangLaTot={false}` nên tăng thì tô đỏ.

### Mốc bảo trì · Next 14.2.35 → 15.5.24 ✅

Làm thành **một mốc riêng, không kèm bước nghiệp vụ** đúng như mục 6.2 dặn: lúc
này 12a và 13 đã xong, 12b thì đang chờ 12a chạy thật, nên không có việc nghiệp
vụ nào dở dang để lẫn vào.

**Giữ React 18** — Next 15 vẫn nhận `react ^18.2.0`, nên không kéo theo React 19.
Diện thay đổi vì thế gói gọn trong hai điểm phá vỡ:

1. **`cookies()` trả Promise.** Cả bốn hàm trong `lib/auth/session.ts` thành
   `async`; thêm `await` ở 6 route handler và `lib/auth/server.ts`. Trong
   `lam-moi/route.ts`, hàm nội bộ `toLogin()` cũng phải thành `async`.
2. **`params` của route handler là Promise.** `app/api/[...path]/route.ts` await
   `ctx.params` (gộp chung `Promise.all` với việc đọc token).

Test phiên và test proxy sửa theo: `await` các hàm phiên, và `ctx()` trong test
proxy trả `params: Promise.resolve(...)`.

**Đã kiểm chứng lại toàn bộ đường phiên** — đây là chỗ dễ vỡ nhất khi cookie
thành async:
- đi trọn luồng hợp đồng qua proxy (login → chốt bán → thu tiền → xác minh → ký
  → kích hoạt, kèm các cửa chặn 400/403/409): y như trước khi nâng;
- **luồng hết hạn access token**: xoá cookie `vfl_at`, giữ `vfl_rt`, vào
  `/tong-quan` → 2 lần chuyển hướng qua `/api/auth/lam-moi` → 200, cookie access
  mới được cấp, **không lặp vòng** (đúng bẫy đã sửa ở Bước 5).

**Giá phải trả:** First Load JS chung tăng **87,3 kB → 103 kB** (runtime Next 15
nặng hơn). `next lint` chạy được nhưng đã cảnh báo sẽ bị bỏ ở Next 16.

### Mốc bảo trì · Next 15.5.24 → 16.3.3 ✅

Làm ngay sau mốc Next 15 để **đóng nốt advisory cuối** và dứt điểm `next lint`
trước khi nó biến mất. `npm audit` giờ: **0 vulnerabilities**.

**Vẫn giữ React 18** — Next 16 còn nhận `react ^18.2.0`, nên lần này cũng không
kéo theo React 19. Ba điểm phải sửa:

1. **`next lint` bị bỏ hẳn.** `npm run lint` giờ gọi thẳng `eslint .`.
   `eslint-config-next@16` đòi ESLint >= 9 → bỏ `.eslintrc.json`, thay bằng
   `eslint.config.mjs` dạng flat config.
2. **Quy ước `middleware` đổi thành `proxy`.** `src/middleware.ts` →
   `src/proxy.ts`, hàm `middleware()` → `proxy()` (Next đọc export tên `proxy`
   cho tệp `/src/proxy`; tên cũ vẫn chạy nhưng in cảnh báo mỗi lần build và sẽ bị
   bỏ). Hành vi không đổi — test đổi tên theo, vẫn 8 ca như cũ.
3. **Luật ESLint mới `react-hooks/set-state-in-effect`** bắt đúng
   `LocationProvider`: nó cố ý gọi `setState` trong `useEffect` để đọc
   `sessionStorage` SAU khi hydrate (bẫy hydration của Bước 6). Đã tắt luật ở
   đúng dòng đó kèm giải thích, và ghi việc chuyển sang `useSyncExternalStore`
   vào mục 6.2 — **không làm chung với mốc nâng framework**, vì đó là đổi hành vi
   của phạm vi CLB dùng chung cho mọi màn.

**Đã kiểm chứng lại toàn bộ đường phiên** như mốc trước, và lần này thêm phần
gác cổng vì `proxy.ts` chính là nơi bị đổi tên:
- chưa đăng nhập vào `/hoi-vien` → 307 về `/dang-nhap?tu=%2Fhoi-vien`;
- chỉ còn refresh token → 2 lần chuyển hướng qua `/api/auth/lam-moi` → 200, cấp
  access mới, không lặp vòng;
- đi trọn luồng hợp đồng qua proxy kèm các cửa chặn 400/403/409;
- `/api/suc-khoe` → `{"backend":"ok","backendStatus":401}`.

> Next 16 không còn in bảng kích thước bundle trong `next build` như 14/15, nên
> con số "First Load JS" ở mốc trước không so tiếp được.

---

### Dọn nợ · `LocationProvider` dùng `useSyncExternalStore` ✅

Trả nốt món nợ mà mốc Next 16 để lại. Bản cũ khởi tạo state rồi đọc
`sessionStorage` trong `useEffect`; nó chạy đúng nhưng phải tắt luật
`react-hooks/set-state-in-effect` và tốn một lần render thừa mỗi lần gắn.

Nay phần chạm kho nằm ở **`lib/storage/clbDangChon.ts`** — hàm thuần + kho ngoài
React, **9 test**:
- `docTrenServer()` LUÔN trả `null`. Server không biết người này đã chọn CLB
  nào; đoán bừa chính là nguồn gốc lệch hydration.
- `clbHieuLuc()` lọc lại giá trị đã lưu mỗi lần render, vì quyền có thể đổi giữa
  hai phiên: **bị rút quyền ở CLB đã lưu** → rơi về mặc định; **mất cờ toàn hệ
  thống nhưng kho vẫn nhớ 'all'** → rơi về CLB đầu. Hai ca này bản cũ cũng xử lý,
  nhưng giờ có test.
- Kho bị trình duyệt chặn (chế độ riêng tư) thì `docDaLuu()` trả `null` và
  `luu()` không ném — màn vẫn chạy, chỉ là không nhớ được.

`LocationProvider` còn 3 dòng logic, kèm **4 test render server** khẳng định
đúng thứ dễ vỡ nhất: ở server, provider không đoán CLB đã lưu (người thường thấy
CLB đầu, người có cờ thấy "mọi CLB").

**Kiểm chứng trên app đang chạy** (mock + dev): thanh chọn CLB của `sale@vfl.vn`
chỉ có Quận 1 và đang chọn sẵn Quận 1; của `gd@vfl.vn` có "Tất cả CLB" + hai CLB.
Dòng phạm vi ở Dashboard tương ứng là "VFL Quận 1" và "toàn hệ thống".

✅ **Phần "đổi CLB rồi F5" nay đã kiểm được** — cả bằng test tự động
(`LocationProvider.interaction.test.tsx`, 6 ca) lẫn bằng tay trên trình duyệt.
Chính lúc viết mấy ca đó mới lòi ra lỗi kho bị chặn ở chế độ riêng tư; xem mục
"Dọn nợ · Test tương tác" bên dưới.

---

### Dọn nợ · test render cho các màn có logic lúc vẽ ✅

Bù cho việc chưa có jsdom + React Testing Library: những component mà cái SAI chỉ
lộ ra lúc vẽ đều đã có test `renderToStaticMarkup`. **Cả bốn nhóm dưới đây đã
kiểm chứng bằng cách cố tình phá code**, mỗi lần đúng test tương ứng đỏ:

| Component | Bắt được gì |
|---|---|
| `BieuDoCot` (Dashboard) | kỳ 7 ngày phải ra 7 cột kể cả ngày trống; không `NaN` khi mọi giá trị bằng 0 |
| `ChiSoCard` (Dashboard) | **tăng ở công nợ phải tô ĐỎ** (màu theo ý nghĩa, không theo dấu); kỳ trước bằng 0 → "Mới", không `Infinity` |
| `StepHopDong` (Hợp đồng) | bước đang đứng chưa được tick; ra khỏi luồng thuận thì không vẽ 5 ô chết |
| `BangTongTien` (Hợp đồng) | còn phải thu đỏ/xanh đúng lúc; thu thừa vẫn hiện 0 |
| `DoiSoatCa` (Quầy) | **tiền phải có trong két KHÔNG cộng chuyển khoản/thẻ**; giao dịch huỷ đếm riêng |
| `LichTuan` (Đặt lịch) | buổi rơi đúng cột ngày, buổi ngoài tuần không hiện, đủ 7 cột |
| `LocationProvider` (khung) | server không đoán CLB đã lưu |

> **Bài học khi viết loại test này:** so class CSS là chưa đủ. Đổi `i < buoc`
> thành `i <= buoc` trong `StepHopDong` không làm class đổi — tailwind-merge gộp
> hai lớp `bg-*` lại. Chỗ thật sự đổi là biểu tượng tick. Test phải bám vào thứ
> người dùng NHÌN THẤY khác đi, không phải thứ tiện so nhất.

---

### `packages/signature-pad` · Chữ ký tay ✅ — gói port đầu tiên

Tệp gốc `commercial-console.html` đã tìm được, nên món chặn lâu nhất của mục 7.0
mở khoá. Port đúng thứ tự đã chốt ở mục 8: `signature-pad` trước.

Nguồn: `initPad` / `clearPad` / `loadSigImage` / `padData` (~11993–12022) và vòng
lặp điểm ảnh của `stripBg` (~12245–12252).

**Đặt ở `src/packages/`, không phải `packages/` ở gốc repo** — giữ nguyên một
alias `@/*` duy nhất, khỏi phải sửa `tsconfig` + `vitest.config.mts` +
`eslint.config.mjs` cùng lúc chỉ để chứa một gói.

| Tệp | Nội dung |
|---|---|
| `chu-ky.ts` | **hàm thuần**, **24 test** — không chạm DOM, không React |
| `ChuKyPad.tsx` | phần chạm canvas: chuột/ngón tay, nạp ảnh, hoàn tác, xoá |
| `index.ts` | cửa công khai — hàm thuần vẫn nhập thẳng, đúng quy tắc 4.3.5 |

**Sáu cái bẫy, mỗi cái một test — cả sáu đã kiểm chứng bằng cách cố tình phá
code (8 lần phá, lần nào cũng đúng test tương ứng đỏ):**

1. **Một chấm không phải chữ ký.** Bản cũ chỉ bật cờ `drawn` trong `pointermove`
   chứ không trong `pointerdown` — chạm nhầm một cái mà tính là đã ký thì hợp
   đồng đi tiếp với ô ký trắng trơn. Giữ nguyên ý đó: một nét phải từ 2 điểm.
2. **`devicePixelRatio` bằng 0 / không có.** Nhân bừa ra canvas 0×0 là canvas
   tàng hình, và `toDataURL()` trên canvas rỗng chiều là lỗi ở vài trình duyệt.
3. **Co ảnh phải dùng `min`, không phải `max`.** Ảnh chữ ký chụp điện thoại rất
   ngang; lấy `max` là phóng to rồi cắt mất đuôi chữ ký.
4. **Xoá nền trắng phải xét đủ ba kênh màu.** Bỏ kênh xanh lam thì mực vàng
   (250, 250, 10) cũng bị đục trong theo.
5. **Tệp tải lên không kiểm.** Ảnh 8 MB nhét vào payload hợp đồng dưới dạng
   base64 là phình gấp bốn và backend trả 413.
6. **Chữ ký phải là ảnh NHÚNG, không phải đường dẫn.** Một `https://…` trỏ tới
   ảnh chữ ký là chữ ký có thể chết hoặc bị thay tệp sau khi hợp đồng đã ký.
   Chỉ nhận `data:image/png;base64,` — SVG cũng chặn, vì SVG chạy được script mà
   bản hợp đồng thì đem in.

**Ba chỗ CỐ Ý khác bản cũ, vì bản cũ sai thật chứ không phải khác gu:**

1. **Bản cũ mất nét khi khung đổi cỡ** — nó vẽ thẳng lên canvas, không giữ lại
   gì; xoay ngang điện thoại là `cv.width = r.width` xoá sạch chữ ký vừa ký. Nay
   nét giữ trong `netsRef` và vẽ lại sau mỗi lần `ResizeObserver` báo.
2. **Bản cũ mờ trên màn mật độ cao** — 1 điểm ảnh CSS ăn 1 điểm ảnh thật. Nay
   nhân theo `devicePixelRatio` (chặn trên ở 3) rồi `ctx.scale()`.
3. **Bản cũ gắn `pointerup` lên `window` và không bao giờ gỡ** — mỗi lần mở lại
   khung ký là thêm một trình nghe. Nay `setPointerCapture`, và cờ "đang đặt
   bút" giữ ở `dangVeRef` chứ KHÔNG suy từ `hasPointerCapture()`: hàm bắt con
   trỏ ném lỗi được, mà lấy nó làm điều kiện vẽ thì một lần ném là khung ký chết
   hẳn — bấm gì cũng không ra nét, không báo gì.

Giữ nguyên của bản cũ: nét dày 2, đầu nét tròn, mực `#0F2733` (token `ink`), và
nạp được ảnh chữ ký có sẵn.

#### Gắn vào bước "ký" của Hợp đồng

`features/hop-dong/components/KyHopDongForm.tsx` + **5 test render** cho
`HopDongDetail` (đã kiểm chứng bằng 3 lần phá code).

- **Đi qua đúng MỘT cửa cũ.** Chữ ký gửi kèm trong payload của
  `chuyen-trang-thai` (`{ den: 'da-ky', chuKy }`), KHÔNG mở endpoint thứ hai —
  thêm một đường ghi vào chứng từ nằm ngoài bảng chuyển tiếp là đúng thứ 12a
  tránh. Có test khẳng định `post` chỉ được gọi một lần.
- **Khung ký THAY nút đi tiếp chung, không đứng cạnh.** Một hành động mà vẽ hai
  nút thì cái nút chung sẽ nuốt mất chữ ký: khách ký xong, hợp đồng vẫn trắng ô
  ký. Có test canh đúng chuyện đó.
- **Không đủ quyền thì không vẽ khung ký**, chỉ hiện nút xám + câu lý do. Mời ký
  một chữ ký chắc chắn bị backend trả 403 là cách tệ nhất để dùng thời gian của
  khách.
- ⚠ **Ký trên màn là TUỲ CHỌN.** `CHUYEN_TIEP` và `viSaoKhongChuyenDuoc()`
  **không đổi**; cạnh bên có nút "Ký giấy — chỉ ghi nhận" đi đúng đường cũ. Ép
  chữ ký điện tử là quyết định vận hành + pháp lý, không phải của frontend. Khi
  vận hành chốt bắt buộc thì thêm điều kiện vào `hop-dong.ts` kèm test.
- **Chữ ký Bên A (đại diện CLB / CEO) chưa có** — hệ cũ lấy sẵn từ cấu hình
  thương hiệu của CLB và gắn lúc phát hành; phần cấu hình đó chưa port.

**Đã kiểm chứng end-to-end** trên app đang chạy (mock + dev), đăng nhập
`ketoan@vfl.vn`:
- HD0004 ở `da-phat-hanh`: canvas nhân đúng theo `devicePixelRatio` 1.25
  (591×160 CSS → 738×198 thật); ba nút Hoàn tác/Xoá/Lưu **xám khi chưa ký**;
- ký lên khung → 1.711 điểm ảnh có nét, nhãn đổi thành "Đã có chữ ký", ba nút
  bật; hộp xác nhận ghi "Chữ ký sẽ được lưu vào hợp đồng";
- xác nhận → hợp đồng sang `da-ky`, `chuKy.anh` là PNG nhúng **11 KB**, màn hiện
  lại đúng ảnh đó và **khung ký biến mất**; không có lỗi console;
- HD0005 bấm "Ký giấy — chỉ ghi nhận" → `da-ky` + `ngayKy`, **không có** `chuKy`;
- gửi chữ ký dạng đường dẫn `https://…` qua proxy → **400** kèm `errors.chuKy`,
  và **trạng thái không đổi** (mock kiểm XONG HẾT rồi mới động vào bản ghi).

### `packages/vietqr` · Mã QR chuyển khoản ✅

Gói port thứ hai, đúng thứ tự mục 8. Nguồn: `commercial-console.html`
~12025–12070 (`_tlv`, `_crc16`, `vietQRString`, `BANKS`, `payQRSection`).

Chuẩn: EMVCo Merchant Presented QR + hồ sơ VietQR của NAPAS.

| Tệp | Nội dung |
|---|---|
| `vietqr.ts` | **hàm thuần** — TLV, CRC, dựng chuỗi, kiểm dữ liệu. **36 test** |
| `ma-tran.ts` | đổi chuỗi thành lưới ô đen/trắng. **9 test** |
| `MaQR.tsx` | vẽ lưới đó ra **SVG** |
| `KhoiChuyenKhoan.tsx` | mã QR + số tài khoản đọc được bằng chữ + nút sao chép nội dung |

> ⚠ **KHÁC MỌI CHỖ KHÁC TRONG DỰ ÁN: sai ở đây thì FRONTEND là nơi gây ra thiệt
> hại.** Màn khác chỉ chặn sớm rồi để .NET kiểm lại. Còn chuỗi này đi thẳng vào
> ứng dụng ngân hàng của khách qua ống kính camera — không ai kiểm lại sau lưng.
> Vì vậy module cố ý **ném hoặc trả câu lý do** khi dữ liệu mập mờ, tuyệt đối
> không "cố dựng ra một chuỗi gì đó".

**Bảy cái bẫy, mỗi cái một test — kiểm chứng bằng 10 lần phá code, lần nào cũng
đúng test tương ứng đỏ.** Ba cái đáng nhớ nhất:

- **CRC phải đúng BIẾN THỂ.** Có hàng chục biến thể CRC-16; VietQR dùng
  CCITT-FALSE. Dùng nhầm vẫn ra 4 ký tự hex trông rất hợp lệ, và ứng dụng ngân
  hàng từ chối với thông báo chung chung. **CRC cũng phải tính TRÊN CẢ `'6304'`**
  — bốn ký tự tiêu đề của chính trường CRC nằm trong phần dữ liệu được tính.
- **Có số tiền vs không có số tiền là HAI LOẠI MÃ KHÁC NHAU.** Trường 01 phải là
  `'12'` khi số tiền đã cố định và `'11'` khi để trống. Ghi nhầm `'11'` mà vẫn
  kèm số tiền thì nhiều ứng dụng cho khách **SỬA số tiền** — thu 12 triệu thành
  12 nghìn, mà phiếu thu vẫn ghi đủ.
- **Dấu tiếng Việt làm lệch độ dài.** Độ dài trong TLV tính theo **byte**, còn
  `chuoi.length` của JavaScript đếm đơn vị mã UTF-16. "Nguyễn" dài 6 theo JS
  nhưng 7 byte UTF-8 — lệch một byte là hỏng toàn bộ phần đuôi, gồm cả CRC. Bản
  cũ `substring(0,25)` thẳng vào nội dung có dấu nên dính đúng bẫy này; nay nội
  dung được bỏ dấu và ép ASCII, và `tlv()` tự chặn ký tự ngoài ASCII.

#### Kiểm bằng gì — có CHUỖI MẪU ĐÃ QUÉT ĐƯỢC THẬT

Tài liệu dặn "đối chiếu với chuỗi VietQR mẫu đã biết đúng, không phải chỉ chạy
không lỗi". So kết quả với chính hàm vừa viết thì chỉ chứng minh hàm bằng chính
nó, nên dùng **bốn mốc độc lập**:

1. **Giá trị kiểm chuẩn của CRC** — chuỗi `"123456789"` qua CCITT-FALSE ra
   `29B1`. Con số đến từ ngoài dự án.
2. **Bản CRC thứ hai viết khác hẳn** — test dựng lại CRC theo bảng tra 256 ô
   (từng byte), module chạy từng bit. Hai lối cài đặt cùng kết quả.
3. **Chuỗi mẫu đã quét được thật** — app đang chạy vẽ mã ra SVG → rasterise ra
   canvas → **`jsQR`** (bộ giải mã độc lập, cũng chính là thư viện hệ cũ dùng ở
   `cccd-scanner.js`) đọc ngược ảnh đó ra chuỗi. Chuỗi ấy nay nằm trong
   `vietqr.test.ts` làm mốc so từng ký tự. Nó chứng minh thứ mạnh nhất: **mã
   sinh ra QUÉT ĐƯỢC**.
4. **Đọc ngược TLV** — bóc từng trường đối chiếu với hằng của chuẩn
   (`A000000727`, `QRIBFTTA`, `704`, `VN`).

#### Thư viện vẽ mã QR — phụ thuộc runtime ĐẦU TIÊN của dự án

Bản cũ nạp `QRious` từ CDN (`commercial-console.html` dòng 320). **Không dùng
lại được:** bản thật chạy sau tường lửa CLB, mất đường ra Internet là quầy mất
luôn mã QR thu tiền. Không có bản cục bộ nào để port.

Dùng **`qrcode-generator`** — **0 phụ thuộc con**, và chính là bản gốc mà
`QRious` cùng phần lớn thư viện QR khác dẫn xuất ra. `npm audit` vẫn **0
vulnerabilities**.

> **Vì sao không mâu thuẫn với "KHÔNG dùng thư viện biểu đồ" ở Bước 13.** Lý do
> cấm thư viện biểu đồ là chúng mang theo hệ màu và hệ kích thước riêng — một hệ
> style thứ hai. Bộ mã hoá QR không mang theo style nào: nó trả về một lưới
> boolean, còn phần vẽ vẫn là SVG của dự án, màu của dự án. Và việc mã hoá QR
> (Reed-Solomon, chọn mặt nạ, bố trí ma trận) đúng loại thuật toán mà mục 8 dặn
> "port nguyên văn, đừng viết lại".

**Vẽ ra SVG chứ không phải canvas**, vì mã QR rồi sẽ phải IN (phiếu thu, hợp
đồng) và canvas in ra là bitmap răng cưa. SVG sắc ở mọi khổ giấy và không cần
`useEffect` nào.

> ⚠ **Màu mã QR cố định đen trên trắng, KHÔNG dùng token** — ngoại lệ có chủ ý
> với quy tắc 4.4.1. Máy quét cần tương phản thật và đúng chiều tối-trên-sáng;
> token có thể đổi khi designer giao bộ mới, và mã QR bị đảo màu thì phần lớn
> ứng dụng ngân hàng không đọc nổi. Vùng lặng trắng quanh mã cũng vì lý do đó.

#### Tài khoản nhận tiền — ĐỔI SO VỚI HỆ CŨ

Bản cũ để **mỗi máy tự cấu hình** rồi lưu trong `localStorage`
(`getBank`/`saveBank`). Một quầy gõ nhầm một chữ số là khách chuyển tiền vào tài
khoản người lạ, và không ai đối chiếu được vì mỗi máy nhớ một kiểu.

Nay **backend là nguồn sự thật duy nhất**: `taiKhoanNhanTien` đi kèm `Location`
(xem mục 5), nên hồ sơ người dùng đã mang sẵn — không thêm lời gọi API, không
thêm khoá cache, không thêm trạng thái đang-tải.

> ⚠ **BẪY: mã QR lấy tài khoản theo CLB CỦA HỢP ĐỒNG, không theo CLB đang chọn
> trên thanh trên.** Hai thứ đó khác nhau ngay khi người có cờ toàn hệ thống mở
> một hợp đồng của CLB khác. Lấy nhầm là khách chuyển tiền về CLB không bán hợp
> đồng này, và kế toán bên bán không thấy tiền đâu. Luật nằm ở hàm thuần
> `taiKhoanNhanTienCua()` trong `hop-dong.ts`, có test riêng, và **không rơi về
> tài khoản mặc định nào** khi tra không ra — thà không hiện mã QR.

#### Gắn ở HAI chỗ: hợp đồng và quầy bán vé

| Màn | Số tiền lấy từ | Nội dung chuyển khoản |
|---|---|---|
| Bước thu tiền của hợp đồng | ô "Số tiền" đang gõ | mã hợp đồng (`HD0004`) |
| Giỏ hàng ở quầy bán vé | tổng giỏ, đổi mỗi lần thêm/bớt món | **mã ca** (`CA001`) |

> ⚠ **Ở quầy, nội dung chuyển khoản là MÃ CA chứ không phải mã giao dịch.** Tiền
> về TRƯỚC khi giao dịch được ghi, nên lúc dựng mã chưa có mã giao dịch nào tồn
> tại. Kế toán đối chiếu theo ca — đúng cách phiếu đối soát cuối ca đang làm,
> nơi tiền chuyển khoản vốn đã tách riêng khỏi tiền mặt (bảng `VAO_KET`, Bước 11).
> Muốn đối chiếu tới từng giao dịch thì phải đổi luồng: ghi giao dịch ở trạng
> thái "chờ tiền về" trước, rồi mới dựng mã. Đó là việc của 12b, không phải ở đây.

Hàm tra tài khoản nằm ở **`lib/locations.ts`**, không nằm trong feature nào — cả
Hợp đồng lẫn Quầy đều cần, và để nó trong một feature rồi feature kia nhập chéo
sang là bắt đầu con đường mọi thứ nhập của mọi thứ.

**Đã kiểm chứng end-to-end** trên app đang chạy (mock + dev, `gd@vfl.vn`, thanh
trên để **"Tất cả CLB"**):
- HD0001 (Quận 1) → Vietcombank · `0071000123456` · 12.000.000 ₫ · nội dung `HD0001`;
- HD0005 (Quận 7) → Techcombank · `19001234567890` · 5.000.000 ₫ · nội dung `HD0005`;
  **cùng một phiên, cùng một phạm vi, hai tài khoản khác nhau** — đúng bẫy trên;
- mã của HD0001 đem quét lại bằng `jsQR` ra đúng chuỗi, bóc từng trường: kiểu
  khởi tạo `12`, BIN `970436`, số tài khoản `0071000123456`, số tiền `12000000`,
  `VN`, nội dung `HD0001`, CRC `2E76`;
- **ở quầy** (ca CA001, CLB Quận 7): thêm 2 vé + 1 nước → mã mang 215.000 ₫ và
  tài khoản Techcombank của Quận 7; thêm một vé lớp nhóm → mã **đổi ngay** sang
  365.000 ₫; quét lại bằng `jsQR` ra đúng chuỗi, nội dung `CA001`, CRC `30AE`.

**Cả hai chuỗi quét được đó nay nằm trong `vietqr.test.ts`** làm mốc so từng ký
tự. Chúng cố ý khác nhau ở mọi chiều đo được — ngân hàng, độ dài số tài khoản, độ
dài số tiền và nội dung — nên đi qua hai phiên bản QR khác nhau (45 ô và 53 ô một
cạnh), tức là hai nhánh khác nhau của bộ mã hoá.

> **Bài học khi tự kiểm bằng cách quét lại.** Lần quét đầu ở quầy THẤT BẠI, và
> đó là lỗi của script kiểm chứ không phải của sản phẩm: `MaQR` lấy cỡ từ class
> CSS (`h-44 w-44`), nên chuỗi SVG tách ra khỏi trang không còn cỡ nào và
> rasterise ra ảnh quá nhỏ để đọc. Đặt `width`/`height` tường minh lên bản nhân
> đôi trước khi vẽ là đọc được ngay. Ghi lại để lần sau đừng vội kết luận mã hỏng.

### i18n · Hạ tầng + đo lại phạm vi thật ✅ (phần chuyển đổi 533 chuỗi CHƯA làm)

Trước khi đụng vào phần cơ học, đo lại xem việc thật sự to bằng nào — và giữ lại
thứ sắp mất.

#### Giữ từ điển hệ cũ — `src/lib/i18n/tu-dien-he-cu.json`

505 mục dịch Việt → Anh, moi ra từ `commercial-console.html` (~250–296). Đây là
bản dịch ĐÃ CHẠY THẬT trong sản xuất, và tệp gốc hiện chỉ nằm trên máy một người
(mục 6.4). Mất tệp là mất luôn công sức đó.

Nó KHÔNG phải tệp chết: `i18n.test.ts` dùng nó làm mốc đối chiếu — xem dưới.

#### Số liệu thật, thay cho "~600 mục"

```bash
npm run i18n-con-lai      # tools/quet-chuoi-viet.mjs
```

| Con số | |
|---|---|
| Chuỗi tiếng Việt người dùng nhìn thấy trong `src` | **533** |
| Đã đưa vào `vi.json` / `en.json` | **23** |
| Trùng nguyên văn với từ điển hệ cũ (dùng lại được bản dịch) | **43** |
| Mục từ điển cũ KHÔNG dùng tới ở Phase 1 | **462 / 505** |

Ước lượng "~600 mục · 1 tuần · việc cơ học" của tài liệu là **đúng tầm**. Nhưng
462/505 mục của hệ cũ thuộc màn chưa dựng (lương/BHXH, Academy, Pro Skill, chăm
lead, trung tâm báo cáo, đặt target), nên **không port thẳng từ điển cũ sang** —
chỉ 43 chuỗi dùng lại được, phần còn lại phải dịch mới.

Phân bố (có chuỗi dùng chung nên cộng lại > 533): `hop-dong` 115 · `san-pham` 92 ·
`ban-hang-quay` 80 · `dat-lich` 79 · `app` 52 · `nhan-vien` 47 · `tong-quan` 36 ·
`packages` 35 · `hoi-vien` 30 · `lib` 30 · `components` 20.

> ⚠ **Công cụ đếm phải duyệt từng ký tự, đừng dùng regex.** Bản đầu của
> `quet-chuoi-viet.mjs` bắt chuỗi trong nháy bằng regex và **đếm thiếu gần bốn
> lần** (154 thay vì 533) — nó chỉ thấy chữ nằm giữa hai thẻ JSX, bỏ sót toàn bộ
> `placeholder="…"`, `label="…"`, nhãn trong `types.ts` và thông điệp toast. Suýt
> nữa thì báo cáo sai rằng tài liệu ước lượng quá tay.

#### Hạ tầng `t()` — 13 test

Ba loại lỗi i18n đều VÔ HÌNH nếu không có test, nên phần này làm trước:

1. **Thiếu bản tiếng Anh cho một khoá.** `t()` lặng lẽ lùi về tiếng Việt: không
   lỗi, không cảnh báo, chỉ có một câu tiếng Việt nằm giữa màn tiếng Anh mà chỉ
   người dùng tiếng Anh mới thấy. → test đối chiếu **vi ↔ en phải cùng bộ khoá**,
   cả hai chiều (khoá thừa bên `en` là rác và làm phép đối chiếu yếu đi).
2. **Chép nguyên tiếng Việt sang `en.json`** cho đủ khoá — qua được test trên mà
   chẳng dịch gì. → test chặn, kèm danh sách ngoại lệ đúng một mục (`app.name`
   là tên riêng).
3. **Dịch lệch với hệ cũ.** Trong hai tuần giữ đường lùi, hai hệ CHẠY SONG SONG;
   cùng một khái niệm mà bản cũ gọi "Club" còn bản mới gọi "Branch" thì người
   dùng tiếng Anh tưởng là hai thứ. → test đối chiếu với `tu-dien-he-cu.json`.

Test số 3 **bắt được lệch thật ngay lần chạy đầu**, và nó cho thấy đúng giới hạn
của cách hệ cũ làm i18n: từ điển cũ tra **theo chữ tiếng Việt**, nên một chữ chỉ
có đúng một bản dịch. "Hội viên" làm nhãn cột là `Member`, làm mục menu trỏ tới
danh sách là `Members`. Tra theo chữ không phân biệt được ngữ cảnh; **tra theo
KHOÁ thì được** — đó là lý do giữ nguyên cách khoá hiện tại thay vì bắt chước hệ
cũ. Ba ca đó nằm trong danh sách ngoại lệ có ghi lý do, kèm một test nữa canh
đúng danh sách ngoại lệ (sửa `en.json` cho khớp mà quên bỏ dòng ngoại lệ thì
dòng đó âm thầm che mất lần lệch vô ý sau này).

`t()` cũng nhận **tham số chèn** — `t('Còn {so} việc', { so: 3 })`. Hai hành vi
cố ý, đều theo cùng một nguyên tắc "hỏng thì phải NHÌN THẤY":
- khoá không có → trả **chính khoá**, không trả chuỗi rỗng (ô trống không ai để
  ý, `hopDong.luuThayDoi` giữa giao diện thì nhìn phát biết);
- thiếu giá trị cho chỗ trống → **giữ nguyên `{so}`**, không xoá (xoá thành
  "Xin chào ," là câu vẫn đọc được nên không ai báo lỗi).

Cả 5 lần phá code đều làm đúng test tương ứng đỏ.

#### Bộ chuyển ngôn ngữ lúc chạy ✅

Làm TRƯỚC phần chuyển đổi, vì không bật được tiếng Anh lên xem thì chuyển 510
chuỗi là làm mù — mọi lỗi dịch chỉ lộ ra khi đã muộn.

- **`lib/i18n/ngonNgu.ts`** — kho ngoài React, **10 test**. Dựng theo đúng khuôn
  `lib/storage/clbDangChon.ts`, **kể cả bài học đã trả giá ở đó**: kho là nguồn
  sự thật, nên ghi hỏng mà không có bản tạm thì nút đổi bật ngược về chỗ cũ ngay
  khi vừa bấm. Ở chế độ riêng tư là dính.
- **`components/shell/NgonNguProvider.tsx`** — `useSyncExternalStore` như
  `LocationProvider`, kèm `useT()` trả `t()` đã gắn sẵn ngôn ngữ hiện tại.
- **`NutDoiNgonNgu.tsx`** trên thanh trên, thay `langBtn` của hệ cũ.

Bốn quyết định đáng ghi:

1. **`localStorage`, không phải `sessionStorage`** — khác với CLB đang chọn.
   Ngôn ngữ là thói quen của người dùng, không phải bối cảnh phiên làm việc;
   đóng tab mở lại mà phải chọn tiếng Anh lần nữa là phiền. Hệ cũ cũng dùng
   `localStorage` (`vfl_lang`).
2. **Nút hiện ngôn ngữ SẼ CHUYỂN SANG**, không phải ngôn ngữ đang dùng — đang
   tiếng Việt thì nút ghi "EN". Nút là một hành động, nhãn nói nó sẽ làm gì; ghi
   ngôn ngữ hiện tại thì người dùng bấm vào tưởng để xác nhận.
3. **Đồng bộ `document.documentElement.lang`.** Thẻ `<html lang="vi">` dựng ở
   server, mà server không biết người này chọn gì. Trình đọc màn hình chọn giọng
   theo thuộc tính này — để sai là máy đọc tiếng Anh bằng giọng tiếng Việt.
4. **`useNgonNgu()` ngoài provider thì rơi về tiếng Việt, KHÔNG ném** — khác chủ
   ý với `useLocationScope()`. Thiếu phạm vi CLB là số liệu sai nên phải ném;
   thiếu ngôn ngữ chỉ là hiện tiếng Việt, mà `ErrorBoundary` và màn đăng nhập
   phải vẽ được kể cả khi cây provider chưa dựng xong.

> ⚠ **ĐÃ GỠ — nhưng đọc đoạn này để hiểu vì sao.** Bản `localStorage` mô tả ở
> trên làm người đã chọn tiếng Anh thấy MỘT NHỊP tiếng Việt trước khi hydrate
> xong, và `<html lang>` sai trong đúng khoảng đó. Đúng như dự đoán ghi ở đây,
> cách chữa là nhớ ngôn ngữ trong **cookie** để server đọc được ngay từ lần dựng
> HTML đầu — **đã làm ở A5**, xem phần "A5 · Nhớ ngôn ngữ trong COOKIE" bên dưới.
> Phần còn lại của mục này (kho ngoài React, `useSyncExternalStore`, nút lật,
> bốn quyết định) vẫn nguyên giá trị; chỉ chỗ CẤT giá trị là đổi.

**Đã kiểm chứng trên app đang chạy:** bấm "EN" → menu đổi sang
`Overview · Members · Staff · Products · Scheduling · Day passes · Contracts`,
`<html lang>` thành `en`, kho ghi `en` (khi đó là `localStorage`, nay là cookie —
xem A5), nút lật thành "VI"; **F5 vẫn
nhớ**. Và nhìn thấy ngay trạng thái pha trộn — menu tiếng Anh, nội dung màn vẫn
tiếng Việt — đúng thứ trước đây không kiểm được.

7 lần phá code, lần nào cũng đúng test tương ứng đỏ. Trong đó một lần **không
đỏ** và đó là phát hiện thật: `docDaLuu()` lọc giá trị lạ nhưng chưa có test nào
canh ở đúng tầng ấy (`ngonNguHieuLuc()` lọc lần nữa nên màn hình vẫn đúng). Đã bổ
sung test cho tầng đọc — cùng kiểu "phòng thủ hai lớp" với luật chạm-một-chấm ở
`signature-pad`.

#### Nhóm Hội viên đã chuyển xong — KHUÔN cho 5 nhóm còn lại ✅

Làm ở Hội viên trước vì tài liệu gọi đó là "bước định khuôn". **30 → 0 chuỗi.**

**Bảng `LABEL` trong `types.ts` → bảng `KHOA`.** Giữ nguyên hình
`Record<HoiVienStatus, string>` nhưng chứa **khoá i18n** thay vì chữ tiếng Việt;
đọc bằng `t(HOI_VIEN_STATUS_KHOA[s])`. Cách này giữ được thứ quý nhất của bảng
cũ — TypeScript vẫn bắt **thiếu nhánh** ngay lúc biên dịch khi thêm một trạng
thái mới. Không phải đổi quy ước mục 4.1.

Nửa còn lại TypeScript **không** canh được — khoá có thật trong từ điển hay không,
vì với nó mọi `string` đều hợp lệ. Bịt bằng **`types.i18n.test.ts`** (5 test):
mọi khoá trong bảng phải có trong `vi.json`, dịch ra phải khác chính khoá, và
`*_ORDER` phải phủ đúng mọi giá trị. **Chép tệp test này sang khi chuyển nhóm
tiếp theo.**

**Ba quy ước đặt khoá:**

| Tiền tố | Dùng cho | Ví dụ |
|---|---|---|
| `chung.*` | từ vựng NHIỀU nhóm dùng chung | `chung.hoTen`, `chung.trangThai` |
| `action.*` / `state.*` | động từ và trạng thái giao diện | `action.luu`, `state.dangLuu` |
| `<nhóm>.*` | chỉ nhóm đó dùng | `hoiVien.maHV`, `hoiVien.trangThai.*` |

Tách `chung.*` là thứ giữ từ điển khỏi phình: phần lớn chuỗi của Hội viên hoá ra
dùng chung với các nhóm khác.

> ⚠ **Tiến độ toàn cục tụt chậm hơn tiến độ từng nhóm, và đó là bình thường.**
> Hội viên về 0 nhưng tổng chỉ giảm **533 → 525**, vì chuỗi dùng chung vẫn còn
> trong 5 nhóm kia. Đổi lại, mấy nhóm sau sẽ nhanh hơn nhiều — phần lớn chỉ việc
> trỏ vào khoá `chung.*` đã có sẵn.

> ⚠ **CHUYỂN SANG KHOÁ LÀ ĐỔI CÁCH LẤY CHỮ, KHÔNG ĐƯỢC ĐỔI CHỮ.** Người dùng
> tiếng Việt phải thấy y hệt hôm qua. Đã suýt vi phạm một lần: cột bảng vốn ghi
> tắt **"CLB"** cho vừa cột, bị gộp nhầm vào khoá `chung.cauLacBo` ("Câu lạc
> bộ"). Nay là hai khoá tách bạch — `chung.clb` cho bảng, `chung.cauLacBo` cho
> form — và có test canh đúng chuyện đó. Lỗi loại này không ai báo vì màn vẫn
> "trông đúng"; chỉ có test và con mắt lúc kiểm mới bắt được.

**Toast trong hook lấy `t` từ `useT()`, không gọi ở module scope.** Gọi ở module
scope là chuỗi bị đóng băng theo ngôn ngữ lúc nạp tệp — đổi ngôn ngữ xong vẫn
thấy toast tiếng cũ, mà chỉ lộ ra đúng lúc thao tác thành công.

**Đã kiểm chứng trên app đang chạy**, bấm qua lại "EN"/"VI":
- danh sách: cột `Member ID · Full Name · Phone · Club · Status · Joined`, bộ lọc
  `All statuses · Active · Paused · Expired · Cancelled`, ô tìm kiếm, nút
  `Add member`, pill trạng thái;
- form thêm: `Full Name * · Phone number * · Email · Gender · Date of birth ·
  Club * · Note`, ô chọn `Male · Female · Other`, nút `Cancel` / `Add`;
- ngăn chi tiết: `Member details`, các nhãn hàng, nút `Edit`;
- đổi trạng thái → **toast `Status changed`** và pill thành `Active` — chứng minh
  phần `t` trong hook mutation chạy đúng;
- quay lại tiếng Việt: y hệt trước khi chuyển, cột vẫn ghi tắt "CLB".

Trong lúc kiểm lộ ra **mock thiếu `GET /hoi-vien/:id`** nên ngăn chi tiết luôn trả
404 — có từ trước, không phải do lần chuyển này. Đã bổ sung chi tiết / thêm / sửa
/ đổi trạng thái vào mock (mục 6.3).

#### Nhóm Nhân viên đã chuyển xong ✅ — khuôn Hội viên chạy lại lần hai

**47 → 0 chuỗi**, và tổng giảm **525 → 470**. Giảm nhiều hơn hẳn lần Hội viên
(chỉ 533 → 525) vì lần này còn kéo theo hai bảng nhãn nằm trong `lib/auth/`.

**Hai bảng nhãn của `lib/auth/` đi cùng nhóm này, không để lại sau.** Nhãn hiện
trên màn Nhân viên nhưng khai ở tầng `lib`:

| Trước | Sau | Ghi chú |
|---|---|---|
| `permissions.ts` · `ROLE_LABEL` | `ROLE_KHOA` + `roleKhoa()` | 8 vai trò |
| `capabilities.ts` · `Capability.group` / `.label` | `.nhomKhoa` / `.nhanKhoa` | 16 dòng ma trận, 5 nhóm |

Vì vậy `lib` tụt **30 → 2** chuỗi. Hai chuỗi còn lại đều KHÔNG phải việc của
nhóm này, ghi ra đây để lần sau khỏi tưởng là sót:
- `server/dotnet.ts` — câu báo thiếu biến môi trường, đọc bởi lập trình viên lúc
  dựng máy, không phải người dùng;
- `api/errors.ts` — `` `Lỗi ${status}` ``, đường lùi cuối khi backend không trả
  `detail` lẫn `title`. Chỗ này **không sửa bằng cách gọi `t()` tại chỗ**:
  `ApiError` dựng ngoài React (trong `client.ts`), gọi `t()` ở đó là đóng băng
  ngôn ngữ lúc nạp tệp — đúng cái bẫy đã ghi ở phần toast. Muốn đúng thì
  `ApiError` giữ KHOÁ, còn màn hiện lỗi mới dịch. Để lại cho lượt `components`.

**`roleKhoa()` giữ nguyên đường lùi hai chặng của `roleLabel()` cũ.** Mã vai trò
lạ trả về CHÍNH MÃ ĐÓ, rồi `t()` tra không ra cũng trả lại chính khoá — nên
backend thêm vai trò frontend chưa biết thì màn hiện mã thô, xấu nhưng không mất
thông tin, y như trước khi chuyển. Có test canh cả chuỗi hai chặng đó.

**`CAPABILITIES` là MẢNG nên TypeScript không canh được gì.** Các bảng khác là
`Record<...>` nên còn được bắt thiếu nhánh lúc biên dịch; mảng thì không có nhánh
nào để mà thiếu. Toàn bộ hàng rào của bảng này nằm ở `capabilities.i18n.test.ts`,
và vì thế nó đối chiếu **đủ 16 dòng** chứ không lấy mẫu vài dòng.

**Gom nhóm theo KHOÁ, không theo chữ đã dịch.** `capabilitiesByGroup()` trước gom
theo chữ tiếng Việt; giữ nguyên cách đó thì đổi ngôn ngữ là đổi luôn cách bảng
gom lại. Có test canh.

**Ba khoá lên `chung.*` vì nay nhiều nhóm dùng chung** — `chung.vaiTro`,
`chung.doiTrangThai`, `chung.daDoiTrangThai`; hai khoá sau lấy từ `hoiVien.*`
chuyển lên, và nhóm Hội viên đã sửa theo. Đây đúng là thứ tài liệu đoán trước:
nhóm sau nhẹ hơn vì phần lớn chỉ trỏ vào khoá có sẵn.

**Ba tệp test khoá mới, tất cả chép khuôn từ `hoi-vien/types.i18n.test.ts`:**
`nhan-vien/types.i18n.test.ts` (5) · `lib/auth/permissions.i18n.test.ts` (6) ·
`lib/auth/capabilities.i18n.test.ts` (5). Tổng test **410 → 426**.

**Sáu lần phá code, lần nào cũng đúng test tương ứng đỏ:**

| Phá gì | Test đỏ |
|---|---|
| Gõ sai khoá vai trò (`vaiTro.managerr`) | `permissions.i18n` — khoá phải có thật |
| Trỏ trạng thái Nhân viên sang bộ khoá Hội viên (khoá CÓ THẬT, nghĩa sai) | `types.i18n` — nhãn giữ nguyên + bẫy hai bộ khoá riêng |
| Chép nguyên tiếng Việt sang `en.json` | `i18n` — không trùng vi/en + lệch hệ cũ |
| Chép dòng ma trận, quên sửa `nhanKhoa` | `capabilities.i18n` — trùng nhãn trong cùng nhóm |
| Xoá một khoá bên `en.json` | `i18n` — vi ↔ en cùng bộ khoá |
| Đổi `All Locations` thành `All Clubs` | `i18n` — lệch với từ điển hệ cũ |

Ca cuối đáng nói: từ điển hệ cũ dịch "Toàn hệ thống" là **All Locations**, và
test bắt phải theo. Cùng lý do đó, `vaiTro.accountant` để **Accounting** (không
phải "Accountant") và ba tên nhóm ma trận để số ít — **khớp hệ cũ, không thêm
dòng ngoại lệ nào**. Danh sách lệch có chủ ý vẫn đúng 3 dòng như trước.

**Đã kiểm chứng trên app đang chạy**, bấm qua lại "EN"/"VI":
- danh sách: cột `Staff ID · Full Name · Role · Phone · Club · Status`, hai bộ
  lọc `All roles` / `All statuses`, nút `Add staff`, pill `Working · On leave ·
  Resigned`;
- ma trận phân quyền: đủ 8 cột vai trò, 5 tiêu đề nhóm, 16 tên quyền;
- ngăn hồ sơ: `Staff profile`, các nhãn hàng, `Hired`, khối `Permissions`;
- **ngăn hồ sơ CỦA CHÍNH MÌNH**: `Role: Director · All Locations` và
  `You cannot change your own role.` — chứng minh phần chèn tham số `{vaiTro}`
  và nhánh khoá của `VaiTroPanel` chạy đúng;
- đổi trạng thái → **toast `Status changed`** và pill đổi theo — chứng minh `t`
  trong hook mutation lấy đúng ngôn ngữ hiện tại;
- quay lại tiếng Việt: y hệt trước khi chuyển, cột vẫn ghi tắt "CLB".

> ⚠ **ĐÃ GỠ ở A5.** Lúc chuyển nhóm này, tiêu đề trang vẫn ra tiếng Việt sau khi
> bấm EN: `app/(app)/nhan-vien/page.tsx` là **server component**, không gọi được
> `useT()`, mà ngôn ngữ khi đó nhớ ở `localStorage` nên server không biết người
> này chọn gì. Cả nhóm `app` (52 chuỗi) vướng đúng chỗ này. Nay trang gọi
> `tTrenServer()` đọc cookie — xem phần A5 bên dưới.

#### Nhóm Tổng quan đã chuyển xong ✅ — lần ba, và là lần đầu đụng câu ghép

**36 → 0 chuỗi**, tổng **470 → 438**. Bảng `MA_KY_LABEL` → `MA_KY_KHOA` như hai
nhóm trước; phần đáng ghi nằm ở chỗ khác.

**Đây là nhóm đầu tiên có nhiều CÂU GHÉP, và câu ghép mở ra một loại lỗi mới.**
Sáu chuỗi của Dashboard mang chỗ trống — `{soNgay} ngày · {phamVi}`,
`Trong đó quầy: {soTien}`, `{ngay}: {tien} · {soGiaoDich} giao dịch`… Trước đây
chúng là template string ghép thẳng trong JSX; nay là khoá kèm tham số. Bẫy: đổi
tên tham số bên `en.json` mà quên bên `vi.json` thì **qua hết mọi test đối chiếu
khoá đã có** — hai bên vẫn đủ khoá, vẫn khác chữ, vẫn khớp hệ cũ — rồi người
dùng tiếng Anh đọc đúng chữ `{amount}` giữa dashboard.

Vì đây là luật của TỪ ĐIỂN chứ không của riêng nhóm nào, test nằm ở
`lib/i18n/i18n.test.ts`, soát **toàn bộ khoá**: chỗ trống của `vi` và `en` phải
trùng tên, không thiếu không thừa. Nó canh cho mọi nhóm chuyển sau mà không phải
viết lại — nhóm Sản phẩm ngay sau đó đã dùng lại và bắt được lỗi thật lúc thử
phá code.

**Lại một ca "cùng chữ, khác chỗ đứng" — và lần này là chữ hoa.** Dashboard ghi
`7 ngày · toàn hệ thống` (thường, giữa câu), bảng Nhân viên ghi `Toàn hệ thống`
(hoa, nhãn đứng riêng). Gộp vào `chung.toanHeThong` là âm thầm viết hoa giữa
câu — đúng loại lỗi "màn vẫn trông đúng" của ca `CLB` / `Câu lạc bộ`. Nay là
`tongQuan.phamViToanHeThong` và `chung.toanHeThong`, có test canh cả hai ngôn
ngữ. **Đây là lần thứ hai bẫy này xuất hiện trong ba nhóm — cứ gặp một chuỗi
trông giống chuỗi đã có thì soát chỗ đứng của nó trước khi dùng lại khoá.**

**Tên vai trò trong câu lấy từ `ROLE_KHOA`, không viết cứng.** Câu "Báo cáo doanh
thu dành cho Trưởng nhóm trở lên." nay là
`t('tongQuan.canQuyenBaoCao', { vaiTro: t(ROLE_KHOA.leader) })` — cùng bảng nhãn
mà `hasMinRole(user, 'leader')` ngay phía trên dùng. Đổi tên vai trò thì câu đi
theo, không lệch.

**`MA_KY_ORDER` CỐ Ý không phủ hết `MaKy`** — khác hai nhóm trước. `tuy-chon` là
trạng thái bật lên khi người dùng sửa ô ngày, không phải nút bấm nhanh, nên nó có
nhãn mà không có chỗ trong dãy nút. Test khẳng định đúng chuyện đó thay vì chép
nguyên ca "phủ đủ hai chiều" của Hội viên — chép nguyên thì phải nới lỏng, mà nới
lỏng thì mất luôn hàng rào.

**`tong-quan.ts` không phải sửa một dòng.** Toàn bộ hàm thuần ở đó trả số, ký
hiệu (`—`, `0%`, `+12,5%`) hoặc ngày `DD/MM` — không có chữ. Đó là hệ quả trực
tiếp của quy ước mục 4.2: tách hàm thuần ra khỏi phần trình bày thì phần trình
bày đổi được mà phép tính đứng yên.

**Sáu lần phá code, lần nào cũng đúng test tương ứng đỏ:** đổi tên chỗ trống bên
`en` · bỏ hẳn một chỗ trống bên `en` · trỏ `7-ngay` sang khoá của `30-ngay` (khoá
CÓ THẬT, nghĩa sai) · thêm `tuy-chon` vào dãy nút nhanh · gộp "toàn hệ thống"
viết thường vào khoá viết hoa · gõ sai một khoá trong bảng.

**Đã kiểm chứng trên app đang chạy**, bấm qua lại "EN"/"VI":
- bốn nút kỳ `Today · 7 days · 30 days · This month`, hai ô ngày `From` / `To`;
- dòng phạm vi `7 days · all locations` — câu ghép điền đúng cả hai tham số;
- khối hôm nay, năm ô chỉ số (`REVENUE · CONTRACTS ISSUED · NEW MEMBERS ·
  SESSIONS · OUTSTANDING`), `Counter portion: 0 ₫`, `vs previous period`,
  `New — no figure for the previous period`;
- biểu đồ: `aria-label` thành `Revenue by day, 7 days, peak 0 ₫` và mỗi cột có
  câu đọc màn hình `25/08: 0 ₫ · 0 transactions` — chứng minh chuỗi ba tham số
  chạy đúng;
- nhánh **thiếu quyền**: gọi thẳng bằng phiên `sale@vfl.vn` (staff, dưới
  Trưởng nhóm) thì trang trả đúng câu "Báo cáo doanh thu dành cho Trưởng nhóm
  trở lên." — tên vai trò trong câu đúng là chữ lấy từ `ROLE_KHOA`;
- quay lại tiếng Việt: `7 ngày · toàn hệ thống` vẫn viết thường, y hệt trước.

#### Nhóm Sản phẩm đã chuyển xong ✅ — lần đầu chạm vào TẦNG HÀM THUẦN

**92 → 0 chuỗi**, tổng **438 → 362**. Nhóm nhiều bảng nhãn nhất (bốn bảng) và là
nhóm đầu tiên có hàm thuần trả câu chữ cho người dùng.

**`gia.ts` nay trả KHOÁ i18n, không trả câu tiếng Việt.** Ba hàm
`kiemTraGiaSan` · `kiemTraGiaTriGiam` · `kiemTraKhoangNgay` trước trả thẳng
"Giá sàn không được cao hơn giá niêm yết." — nay trả `sanPham.loi.giaSanCaoHon`
và màn gọi `t(loi)`. **Không cho `gia.ts` gọi `t()` tại chỗ:** hàm thuần không
biết ngôn ngữ hiện hành, gọi `t()` ở tầng đó là đóng băng chuỗi theo ngôn ngữ
lúc nạp tệp — đúng cái bẫy đã ghi ở phần toast của nhóm Hội viên, chỉ khác là lần
này nó nằm ở tầng sâu hơn nên còn khó thấy hơn.

`null` giữ nguyên nghĩa "không có lỗi" nên chỗ gọi không phải đổi cách kiểm; có
test canh riêng chuyện đó, vì đổi `null` thành chuỗi rỗng là mọi `loi ? … : …`
trên màn im lặng đảo chiều và ô nhập không bao giờ báo lỗi nữa.

**`gia.i18n.test.ts` phải liệt kê ĐỦ MỌI NHÁNH trả lỗi.** Khác các bảng
`Record<...>`, ở đây khoá nằm trong THÂN HÀM — không có bảng nào để TypeScript
soi thiếu nhánh, nên thêm một `return` mới mà gõ sai khoá thì không gì bắt được
ngoài tệp test này. Cùng lý do với `CAPABILITIES` (mảng) ở nhóm Nhân viên: **hễ
khoá không nằm trong một `Record` thì hàng rào duy nhất là test, và test phải
liệt kê chứ không lấy mẫu.**

**Bẫy "cùng chữ, khác chỗ đứng" xuất hiện lần thứ ba — và lần này là NÚT với
TRẠNG THÁI.** Hai ca trong cùng một nhóm:

| Chữ tiếng Việt | Là trạng thái (pill) | Là nút (hành động) |
|---|---|---|
| "Ngừng bán" | `sanPham.trangThai.ngung-ban` → **Discontinued** | `sanPham.ngungBanNut` → **Stop selling** |
| "Tạm dừng" | `khuyenMai.trangThai.tam-dung` → **Paused** | `khuyenMai.tamDungNut` → **Pause** |

Gộp lại thì bản tiếng Việt vẫn "trông đúng" nên không ai báo, còn người dùng
tiếng Anh thấy một cái nút ghi "Discontinued". **Đây là quy luật, không phải
trùng hợp: một cái MÔ TẢ, một cái SAI KHIẾN — tiếng Việt không chia thì nên trông
giống nhau, tiếng Anh thì không.** Cứ gặp chuỗi trông giống chuỗi đã có thì soát
chỗ đứng của nó trước khi dùng lại khoá. (Hai ca trước: `CLB`/`Câu lạc bộ`,
`toàn hệ thống`/`Toàn hệ thống`.)

**Thêm `LOAI_GIAM_ORDER`.** Form khuyến mãi trước lấy thứ tự ô chọn từ
`Object.keys(LOAI_GIAM_LABEL)` — đúng lỗi đã sửa ở `GIOI_TINH_ORDER` của nhóm
Hội viên, chỉ là chưa ai gặp lại. Nay có hằng riêng và test canh nó phủ đủ bảng.

**Đổi tên biến vòng lặp tab từ `t` sang `muc`** ở `SanPhamScreen` và
`NhanVienScreen`. `tabs.map((t) => …)` che mất hàm dịch `t` trong cùng một hàm —
vẫn chạy đúng, nhưng đọc thì không phân biệt được `t.label` với `t('...')`. Sửa
luôn ở nhóm Nhân viên vì chính lần chuyển đó tạo ra chỗ che.

**Sáu lần phá code, lần nào cũng đúng test tương ứng đỏ:** gõ sai khoá trong thân
hàm `gia.ts` · gộp nút "Ngừng bán" vào khoá trạng thái · `LOAI_GIAM_ORDER` thiếu
một mục · trỏ loại `ve-ngay` sang khoá của `phu-kien` (khoá CÓ THẬT, nghĩa sai) ·
đổi tên chỗ trống của câu cảnh báo phá giá sàn bên `en` · cho `gia.ts` trả chuỗi
rỗng thay vì `null`.

**Đã kiểm chứng trên app đang chạy**, bấm qua lại "EN"/"VI":
- danh sách: `CODE · PRODUCT NAME · TYPE · LIST PRICE · FLOOR PRICE · CLUB ·
  STATUS`, bộ lọc `All types` / `All statuses`, loại
  `Membership package · Service · Day pass · Accessory`;
- ngăn chi tiết: `Term 365 days` (câu có tham số), khối `Floor price`,
  `List price: 12.000.000 ₫`, và **pill ghi `On sale` trong khi nút ghi
  `Stop selling`** — đúng chỗ bẫy nút-với-trạng thái;
- nhập giá sàn 99.000.000 → hiện `The floor price cannot exceed the list price.`
  và nút khoá lại — **chứng minh hàm thuần trả khoá còn màn dịch ra chữ, chạy
  thông suốt cả chuỗi**;
- tab khuyến mãi: `Below floor price (1)` trên đúng chương trình phá sàn, nút
  `Pause` cạnh trạng thái `Running`;
- form khuyến mãi, nhập 90%: `3 products would fall below the floor price` kèm ba
  dòng `Gói tập 12 tháng: 1.200.000 ₫ < floor 9.500.000 ₫` — chuỗi BA tham số;
  nhập 150% và ngày ngược: `The discount percentage cannot exceed 100.` +
  `The start date must come before the end date.`;
- quay lại tiếng Việt: y hệt trước khi chuyển, kể cả `< sàn` và `Dưới giá sàn (1)`.

**Mock bổ sung nốt phần Sản phẩm** (mục 6.3): trước đó chỉ có danh sách nên ngăn
chi tiết LUÔN trả 404 — y hệt ca nhóm Hội viên, và cũng chỉ lộ ra khi có việc bắt
phải mở nó lên.

#### Nhóm Đặt lịch đã chuyển xong ✅ — và lần phá code này TÌM RA HAI LỖ HỔNG THẬT

**79 → 0 chuỗi**, tổng **362 → 287**. Cùng khuôn bốn nhóm trước; phần đáng ghi là
hai chỗ phá code mà KHÔNG test nào đỏ, tức là hai chỗ trước nay không ai canh.

**Lỗ hổng 1 — thứ tự nhánh của `viSaoKhongDatDuoc()` không ai giữ.** Đảo hai
nhánh đầu (`daHuy` và `ketThuc <= bây giờ`) mà cả 457 test vẫn xanh, vì mọi ca cũ
chỉ dính đúng MỘT trong hai điều kiện. Buổi bị huỷ rồi để quá giờ là chuyện thường
ngày, và hai câu trả lời khác hẳn nhau: "Buổi đã huỷ." là **có người quyết định**,
"Buổi đã kết thúc." là **chỉ do thời gian trôi qua**. Nói nhầm thì người ở quầy đi
tìm nhầm nguyên nhân. Đã thêm ca cho buổi VỪA huỷ VỪA quá giờ; đảo lại thì đỏ.

**Lỗ hổng 2 — bảy thứ trong lịch tuần chỉ được kiểm CÓ MẶT, không kiểm THỨ TỰ.**
Đảo nhãn "Thứ Ba" với "Thứ Tư" mà không test nào đỏ: ca cũ chỉ hỏi bảy chữ có
trong HTML hay không. Nhãn cột lệch một ô là người xếp lịch đọc nhầm ngày — lỗi
không làm gãy gì cả, chỉ làm sai việc. Đã thêm ca đối chiếu vị trí bảy chữ trong
HTML phải tăng dần.

> ⚠ **Chuyển sang khoá làm lỗ hổng 2 nguy hiểm hơn trước, không phải nhẹ đi.**
> Mảng nhãn `['Thứ Hai', 'Thứ Ba', …]` đọc lướt là thấy sai thứ tự ngay; mảng
> khoá `['chung.thuHai', 'chung.thuBa', …]` thì không. Đây là cái giá chung của
> i18n: **chữ biến thành mã, nên mắt hết soát được và test phải gánh phần đó.**
> Cứ chuyển một mảng-nhãn-theo-thứ-tự thì hỏi ngay "có gì canh thứ tự không".

**`lich.ts` trả KHOÁ ở BỐN hàm** — `kiemTraKhoangGio` · `kiemTraSucChua` ·
`viSaoKhongDatDuoc` · `moTaTrungLich`. Cùng cách làm với `san-pham/gia.ts`, và
`lich.i18n.test.ts` cũng liệt kê đủ 9 nhánh trả khoá chứ không lấy mẫu.

**`moTaTrungLich()` giữ phép chọn ít/nhiều, chỉ đẩy CHỮ ra ngoài.** Nó trả
`datLich.trungLichMot` hoặc `datLich.trungLichNhieu`, còn màn truyền
`{ so: trung.length }`. Khoá số ít **không có chỗ trống** nên truyền thừa `so`
vô hại — và có test canh đúng chuyện đó, vì nếu khoá số ít lỡ mang `{so}` thì câu
hoá ra "…đã có 1 buổi khác…", đúng thứ mà việc tách nhánh sinh ra để tránh.

**Lưới 7 cột dùng bộ-bảy cố định, không phải `string[]`.** Kiểu
`readonly [string, string, string, string, string, string, string]` để TypeScript
đếm hộ: xoá một phần tử là lỗi biên dịch, không phải một tuần 6 ngày. Đã thử phá
— `tsc` chặn ngay.

**Hai bảng nhãn cho cùng một loại buổi, và đó là cố ý.** `LOAI_BUOI_KHOA` bản đầy
đủ cho ô chọn ("PT (1 kèm 1)"), `LOAI_BUOI_NGAN_KHOA` bản viết tắt cho pill trên
thẻ ("PT"). Cùng họ với `chung.clb` / `chung.cauLacBo`. Riêng `lop` thì hai bản
TRÙNG chữ ("Lớp") và vẫn phải là hai khoá — **không phải cứ hai khoá là bắt buộc
khác chữ, chỉ cần chúng đổi được độc lập.**

**Hai mục mới trong danh sách "trùng vi/en có chủ ý"**: `datLich.loaiNgan.pt` và
`datLich.loaiNgan.sgt`. "PT" và "SGT" là viết tắt, cả hai thứ tiếng dùng y hệt.
Danh sách nay 4 dòng, mỗi dòng có lý do.

**`chung.moiLoai` gộp từ `sanPham.moiLoai`** — hai nhóm cùng cần "Mọi loại" với
đúng một nghĩa, nên đưa lên `chung.*` và sửa nhóm Sản phẩm trỏ theo.

**Sáu lần phá code: bốn lần đỏ đúng chỗ, HAI lần không đỏ** — và hai lần không đỏ
đó mới là phần có giá trị, xem hai lỗ hổng ở trên. Bốn lần còn lại: gõ sai khoá
trong thân `lich.ts` · gộp bản viết tắt vào bản đầy đủ · thêm `{so}` vào khoá số
ít · xoá một thứ khỏi lưới (chặn bởi `tsc`).

**Đã kiểm chứng trên app đang chạy**, bấm qua lại "EN"/"VI":
- lịch tuần: `Monday … Sunday` ĐÚNG THỨ TỰ, `Previous week` / `Next week`,
  bộ lọc `All types · PT (one-on-one) · Class · SGT (small group)`, thẻ buổi ghi
  `No coach assigned`, `Waitlist: 1`, ô trống ghi `No sessions`;
- ngăn chi tiết: `Seats 1/1 — 0 left` (chuỗi ba tham số), `Booked (1)`,
  `Waitlist (1)`, `Confirmed`, pill `Full`, nút `Cancel session`;
- gõ mã hội viên đã có chỗ → `This member already has a seat in this session.`;
  gõ mã lạ vào buổi đầy → `The session is full — they can join the waitlist.`;
- form tạo buổi: chọn HLV trùng một buổi →
  `This coach already has another session at the same time.` (KHÔNG có số);
  kéo dài khung giờ cho trùng hai buổi →
  `This coach already has 2 other sessions at the same time.`;
  giờ ngược → `The end time must be after the start time.`; PT sức chứa 5 →
  `A PT session is one-on-one, so capacity must be 1.`;
- quay lại tiếng Việt: y hệt trước khi chuyển.

**Mock nay phủ ĐỦ mọi màn — việc A2 xong hẳn** (mục 6.3). Phần Đặt lịch tự kiểm
đúng những luật mà `lich.ts` chỉ cảnh báo sớm: HLV trùng lịch → 409, giờ ngược →
400, PT sức chứa khác 1 → 400, đặt chỗ khi buổi huỷ / đã đầy → 409. Dữ liệu mẫu
sinh theo TUẦN CHỨA HÔM NAY nên mở màn lên là thấy buổi ngay, và HLV lấy thẳng từ
`NHAN_VIEN` để hai màn khớp nhau thay vì bịa một danh sách riêng.

#### Nhóm Bán vé ngày tại quầy đã chuyển xong ✅

**80 → 0 chuỗi**, tổng **287 → 214**. Nhóm thứ ba có hàm thuần trả chữ, nên phần
cơ học đã thành nếp; ba điểm dưới đây mới là phần cần đọc.

**`quay.ts` trả KHOÁ ở ba hàm** — `moTaChenhLech` · `viSaoKhongBanDuoc` ·
`viSaoKhongDongDuocCa`. `moTaChenhLech` theo đúng khuôn `moTaTrungLich` của Đặt
lịch: giữ phép chọn khớp/thừa/thiếu trong hàm thuần, chỉ đẩy CHỮ ra ngoài, màn
truyền `{ soTien: money(Math.abs(lech)) }`. Sau khi bỏ chữ đi thì `quay.ts`
**không còn cần `money()`** — đã gỡ luôn import; đó là dấu hiệu tốt: tầng tính
tiền nay không biết gì về cách hiển thị.

> ⚠ **`VAO_KET` nằm ngay cạnh hai bảng nhãn, cùng hình `Record<PhuongThuc, …>`,
> nhưng KHÔNG PHẢI nhãn.** Nó quyết định tiền nào vào két — chuyển nó sang khoá
> "cho đồng bộ" là đổi phép đối soát cuối ca, tức là bắt thu ngân bù tiền túi
> cho khoản chuyển khoản. Đã thêm hẳn một ca test nói rõ ranh giới đó, vì tệp
> `types.ts` đọc lướt thì ba bảng trông giống hệt nhau.

**Hai cặp "cùng chữ tiếng Việt, khác nghĩa" trong cùng một nhóm:**

| Chữ | Khoá | Tiếng Anh |
|---|---|---|
| "Huỷ" — nút huỷ một giao dịch đã ghi | `quay.huyGd` | **Void** |
| "Đã huỷ" — trạng thái giao dịch | `quay.daHuyGd` | **Voided** |
| "Huỷ" — nút bỏ hộp thoại đi | `action.huy` | **Cancel** |
| "Ca đã đóng." — vì sao không BÁN được | `quay.khongBan.caDaDong` | The shift is closed. |
| "Ca đã đóng rồi." — vì sao không ĐÓNG CA được | `quay.khongDong.caDaDong` | The shift is already closed. |

Cặp thứ hai đáng chú ý: hai câu khác nhau đúng chữ "rồi", nên rất dễ gộp cho gọn.
Gộp thì bản tiếng Việt vẫn đọc trôi — nhưng người đang đóng ca lại đọc được câu
nói về việc bán. Cả hai cặp đều có test canh.

**Bảng nhãn phương thức thanh toán bị nhóm Hợp đồng dùng nhờ.**
`HopDongDetail` và `ThuTienForm` import `PHUONG_THUC_LABEL` từ
`ban-hang-quay/types`. Nhóm Hợp đồng chưa tới lượt, nhưng bảng đã thành khoá nên
hai tệp đó phải đổi theo — chỉ đúng chỗ dùng nhãn ấy, có ghi chú tại chỗ. Việc
này lôi ra thêm một chỗ che tên: `hopDong.thanhToan.map((t) => …)` nay đã đổi
thành `tt`.

**Ba chỗ đặt tên `t` bị che, đã dọn cùng lượt** — vòng lặp tab ở
`BanHangQuayScreen`, vòng lặp phiếu thu ở `HopDongDetail`, và
`const t = tomTatCa(ca)` ở `DoiSoatCa` (đổi thành `tt`). **Cứ đưa `useT()` vào
một tệp thì soát ngay xem trong đó đã có biến tên `t` chưa** — nó vẫn chạy đúng
nên `tsc` không kêu, chỉ có người đọc là không phân biệt được `t.label` với
`t('…')`.

**Sáu lần phá code, lần nào cũng đúng test tương ứng đỏ:** gộp hai câu "Ca đã
đóng" · thêm chỗ trống `{soTien}` vào khoá "khớp két" · cho chuyển khoản vào két
(phá quy tắc tiền, không phải nhãn) · nút "Huỷ" dùng khoá của "Đã huỷ" · gõ sai
khoá phương thức · đảo thừa/thiếu trong `moTaChenhLech`.

**Đã kiểm chứng trên app đang chạy**, bấm qua lại "EN"/"VI", diễn tập trọn một ca:
- chưa chọn CLB → `Pick one specific club in the top bar…`;
- mở ca 500.000 ₫: hint đổi theo số vừa gõ
  (`…reconciles against 500.000 ₫ plus the cash you take in.`);
- thanh ca `Shift CA001 · … · opened at …`, `Cash in the drawer: 500.000 ₫`,
  ba tab `Sell · Transactions (0) · Reconcile & close`;
- giỏ trống → `The cart is empty.` (khoá của `viSaoKhongBanDuoc`), nút
  `Take 0 ₫`; bấm hai vé → `Cart (2)`, `Take 200.000 ₫`, nhãn trợ năng
  `One more Vé tập ngày` / `One less Vé tập ngày`;
- thu tiền → toast `Payment taken`, két lên `700.000 ₫`, tab thành
  `Transactions (1)`;
- lịch sử: `CODE · AT · ITEMS · CUSTOMER · PAYMENT · AMOUNT`, dòng ghi
  `Walk-in · Cash`, nút **`Void`** (không phải "Cancel");
- phiếu đối soát: `Opening cash · Cash taken in · Bank transfer (not in the
  drawer) · Card (not in the drawer) · Total revenue · Cash that should be in
  the drawer`, và `Enter the cash you counted.` khi chưa gõ;
- gõ 700.000 → `The drawer matches.`; 750.000 → `50.000 ₫ over.`; 650.000 →
  `50.000 ₫ short.`, kèm `A discrepancy has to be explained.`;
- quay lại tiếng Việt: `Thiếu 50.000 ₫.`, `Lệch két thì phải ghi lý do.`,
  `Khách vãng lai`, nút `Huỷ` — y hệt trước khi chuyển.

#### Nhóm Hợp đồng đã chuyển xong ✅ — HẾT BẢY NHÓM NGHIỆP VỤ

**115 → 0 chuỗi**, tổng **214 → 111**. Chỉ còn phần đuôi: `app` 52 · `packages`
35 · `components` 22 · `lib` 2.

Đây là nhóm buộc phải đổi HÌNH DẠNG hàm thuần, không chỉ đổi chữ — và cách làm ở
đây là khuôn cho mọi hàm thuần trả câu có tham số về sau.

**Ba nhóm trước trả KHOÁ; nhóm này phải trả KHOÁ + THAM SỐ.** `viSaoKhongChuyenDuoc()`
có mười nhánh, phần lớn mang theo số hoặc tên: còn thiếu bao nhiêu tiền, cần vai
trò nào, chuyển từ trạng thái nào sang trạng thái nào. Trả mỗi khoá thì màn phải
tự tính lại từng thứ ấy — tức là chép luôn cây phân nhánh ra ngoài. Nên ba hàm
(`viSaoKhongChuyenDuoc` · `viSaoKhongThuDuoc` · `canhBaoGiaSan`) nay trả

```ts
interface LyDoChan { khoa: string; thamSo?: …; dongViPham?: … }
```

và `null` vẫn giữ nghĩa "không có lý do", nên mọi chỗ `if (lyDo)` không phải sửa.

**`lyDo.ts` — ghép khoá thành câu, và VẪN LÀ HÀM THUẦN vì NHẬN `t` LÀM THAM SỐ.**
Đây là mảnh ghép còn thiếu của cả năm nhóm trước: có một chỗ cần vừa dịch được
vừa không được dính React. Nhận `t` từ ngoài vào giải quyết cả hai — nó không
import `@/lib/i18n` để gọi ở module scope (bẫy đóng băng ngôn ngữ), và nó có test
riêng chạy được ở **cả hai ngôn ngữ** mà không cần render gì.

**Tham số có thể MANG KHOÁ, và phải khai ra chứ không đoán.** Câu "Không chuyển
thẳng từ “X” sang “Y”." nhận hai tên trạng thái; hàm thuần chỉ biết khoá của
chúng. `lyDo.ts` dịch lồng thêm một lớp — nhưng **chỉ cho những tham số đã liệt
kê trong `THAM_SO_LA_KHOA`**, không đoán theo hình dạng chuỗi.

> ⚠ **Vì sao không đoán:** luật kiểu "chuỗi nào có dấu chấm thì dịch" chạy đúng
> hôm nay, rồi một ngày có hội viên tên "Nguyen.Van.An" hoặc ghi chú "TT.2026" và
> nó bị nuốt mất. Có test canh đúng chuyện đó: tham số `soTien` phải đi qua
> nguyên vẹn.

**Danh sách dòng phá sàn ghép ở `lyDo.ts`, không ở hàm thuần.** Câu cũ là
`"{n} dòng dưới giá sàn / {ten}: {gia} < sàn {giaSan} · …"` — chi tiết từng dòng
cũng phải dịch được, mà hàm thuần thì không dịch được. Nên `canhBaoGiaSan()` trả
kèm `dongViPham` (dữ liệu thô), còn `lyDo.ts` mới ghép. Câu hiện ra **giống từng
ký tự** với bản trước khi chuyển; có test đối chiếu nguyên văn.

**Hai bảng nhãn cho cùng một tập trạng thái, lần thứ ba gặp bẫy này.**
`TRANG_THAI_HOP_DONG_KHOA` MÔ TẢ ("Đã huỷ"), `HANH_DONG_KHOA` SAI KHIẾN
("Huỷ hợp đồng"). Riêng `tam-dung` thì hai bảng trùng chữ ("Tạm dừng") — và vẫn
phải là hai khoá, vì phải đổi được độc lập. Test khẳng định **mọi trạng thái đều
có hai khoá khác nhau**, kể cả ca trùng chữ đó.

**`TRANG_THAI_HIEN_THI_KHOA` trải từ bảng lưu rồi thêm `het-han`** — sửa bảng lưu
mà quên thì phép trải vẫn chạy, không ai thấy. Có test đếm phần thêm phải đúng
một khoá.

**`hop-dong.test.ts` chuyển từ đối chiếu CÂU sang đối chiếu KHOÁ**, và mạnh hơn
hẳn: trước đây `toMatch(/Kế toán trở lên/i)` chỉ khẳng định câu có chữ đó, nay
`toEqual({ khoa: 'hopDong.chan.canVaiTro', thamSo: { vaiTro: 'vaiTro.accountant' } })`
khẳng định đúng vai trò nào. Chữ hiện ra thì `lyDo.test.ts` canh.

**Một dòng mới trong danh sách "trùng vi/en có chủ ý":** `hopDong.daChuyenBuoc`
= `"{hanhDong}: {ma}"` — khuôn ghép thuần tuý, không có chữ nào để dịch. Danh
sách nay 5 dòng, mỗi dòng có lý do.

**Sáu lần phá code, lần nào cũng đúng test tương ứng đỏ:** bỏ khai báo dịch lồng
tham số vai trò · gộp bảng hành động vào bảng trạng thái · chỉ liệt kê dòng phá
sàn đầu tiên · gõ sai khoá trong thân `hop-dong.ts` · bỏ `het-han` khỏi bảng hiển
thị (chặn bởi `tsc`) · đổi tên chỗ trống bên `en`.

**Đã kiểm chứng trên app đang chạy**, diễn tập trọn luồng bằng cả hai ngôn ngữ:
- danh sách: `CONTRACT NO. · MEMBER · CLUB · DRAWN UP BY · STATUS · TOTAL ·
  OUTSTANDING · DRAWN UP`, bộ lọc đủ 8 trạng thái, cột trạng thái hiện `Expired`
  cho hợp đồng quá hạn (trạng thái SUY RA, không lưu);
- ngăn chi tiết HD0004: thanh 5 bước `Quote · Payment · Verification · Issue &
  sign · In force`, bảng dòng `PRODUCT · UNIT PRICE · QTY · AMOUNT`,
  `Subtotal (1 lines)`, `Collected`, `Outstanding`;
- nút "Send to accounting" bị chặn kèm **`Not paid in full — 7.000.000 ₫
  outstanding.`** — khoá + tham số tiền, ghép qua `lyDoThanhChu`;
- ô thu tiền: gõ 99.000.000 → `That exceeds the outstanding amount (7.000.000 ₫).`;
  gõ 0 → `The amount must be greater than 0.`;
- thu đủ 7.000.000 → toast `7.000.000 ₫ recorded`, `Outstanding 0 ₫`, nút mở
  khoá; xác nhận → hộp thoại `HD0004 — Trần Thị Bình. This step cannot be undone.`
  → toast **`Send to accounting: HD0004`** (khoá lồng khoá: tên hành động nằm
  trong khuôn ghép);
- form lập hợp đồng, hạ hai dòng xuống dưới sàn:
  `2 lines below the floor price / Gói tập 12 tháng: 9.000.000 ₫ < floor
  9.500.000 ₫ · PT 10 buổi: 3.000.000 ₫ < floor 4.000.000 ₫`;
- quay lại tiếng Việt: **`2 dòng dưới giá sàn / Gói tập 12 tháng: 9.000.000 ₫ <
  sàn 9.500.000 ₫ · PT 10 buổi: 3.000.000 ₫ < sàn 4.000.000 ₫`** — giống từng ký
  tự với bản trước khi chuyển.

> ⚠ **Hai chỗ trong màn Hợp đồng vẫn ra tiếng Việt khi bật EN, và KHÔNG phải
> sót:** nút "Huỷ" của `ConfirmDialog` thuộc nhóm `components`, và câu báo lỗi
> chữ ký đến từ `packages/signature-pad`. Hai nhóm đó chưa tới lượt — xem bảng
> 7.0. Có ghi chú tại chỗ ở `KyHopDongForm`.

#### Bộ component nền đã chuyển xong ✅ — phần đuôi thứ nhất

**22 → 5 chuỗi**, tổng **111 → 93**. Năm chuỗi còn lại KHÔNG phải sót: hai câu
`throw` của `useSession()` / `useLocationScope()` và câu `console.error` của
`ErrorBoundary` đều là chữ cho lập trình viên đọc, không bao giờ lên màn (công
cụ đếm bắt hai câu `throw` hai lần nên ra 5 chứ không phải 3).

**Khác bảy nhóm nghiệp vụ ở ba chỗ, và cả ba đều là bẫy riêng của tầng nền.**

**1 · Nhãn mặc định nằm ở GIÁ TRỊ MẶC ĐỊNH CỦA THAM SỐ — chỗ `t()` không chạy
đúng lúc.** `ConfirmDialog` và `QueryState` khai `confirmLabel = 'Xác nhận'`,
`loadingText = 'Đang tải…'` ngay trên chữ ký hàm. Viết `confirmLabel =
t('chung.xacNhan')` vào đúng chỗ đó thì mã vẫn chạy, test khoá vẫn xanh, và chữ
vẫn đúng — cho tới lúc người dùng bấm nút đổi ngôn ngữ: giá trị mặc định tính
một lần lúc nạp module nên nó đóng băng theo ngôn ngữ lúc đó. Cách đúng: để mặc
định là `undefined`, rồi `confirmLabel ?? t('chung.xacNhan')` TRONG thân hàm.
Cùng một bẫy với "toast lấy `t` từ `useT()`, không gọi ở module scope" đã ghi ở
nhóm Hội viên, chỉ đổi hình dạng.

**2 · `ErrorBoundary` là class component nên không gọi được hook.** Phần chữ
tách ra thành hàm `KhungLoi` riêng. Việc này chỉ an toàn nhờ một quyết định cũ:
`useNgonNgu()` ngoài provider **rơi về tiếng Việt thay vì ném**. Nếu nó ném thì
màn báo lỗi sẽ tự gây lỗi, đúng lúc không còn boundary nào đỡ nữa.

**3 · Chữ chỉ dành cho trình đọc màn hình cũng là chữ phải dịch.** `aria-label`
của nút đóng (`Drawer`, `Toast`), câu mô tả `sr-only` của `Drawer` và
`ConfirmDialog`, `aria-label` của ô chọn CLB trên thanh trên. Mắt không thấy nên
không ai báo, nhưng người dùng tiếng Anh dùng trình đọc màn hình thì nghe nguyên
tiếng Việt. Nhãn phụ của nút đổi ngôn ngữ nay cũng dịch: đang ở bản tiếng Anh
thì nghe `Switch to Vietnamese`, không phải `Chuyển sang Tiếng Việt`.

**`ApiError` nay giữ KHOÁ, màn hiện lỗi mới dịch — món nợ đã hẹn từ nhóm Nhân
viên.** `` `Lỗi ${status}` `` là đường lùi cuối khi backend không trả `detail`
lẫn `title`. Không sửa được bằng cách gọi `t()` tại chỗ vì `ApiError` dựng trong
`client.ts`, tức ngoài React. Nay:

| | Trước | Sau |
|---|---|---|
| `message` | `Lỗi 503` | `HTTP 503` — chữ cho lập trình viên, đọc trong log |
| khoá | không có | `khoaThongDiep` = `'loi.maSo'`, chỗ trống `{ma}` = `status` |
| ai dịch | không ai | `QueryState` và `LoginForm` |

Backend CÓ trả `detail`/`title` thì `khoaThongDiep` là `null` và câu đó hiện
nguyên văn — "Hội viên đã có hợp đồng đang hiệu lực" mà bị thay bằng "Lỗi 400"
là mất hẳn thông tin. Có test canh cả hai chiều. Vì vậy `lib` tụt **2 → 1**;
chuỗi cuối cùng (`server/dotnet.ts`, câu báo thiếu biến môi trường) là chữ cho
người dựng máy, không phải người dùng.

**Cách KIỂM khác bảy nhóm kia, vì bộ nền không có bảng `KHOA` để đối chiếu.**
Bảy nhóm nghiệp vụ dùng `types.i18n.test.ts`: soát bảng khoá trong `types.ts` với
từ điển. Bộ nền không có bảng nào — chữ nằm ở nhãn mặc định và trong JSX — nên
chép khuôn đó sang là **test tự giữ một bản danh sách khoá riêng**, gõ sai khoá
trong component thì test vẫn xanh. Tệp mới `components/ui/nen.interaction.test.tsx`
(**14 test**, jsdom) làm ngược lại: VẼ component ra rồi đọc chữ, mỗi ca chạy hai
lượt vi/en. Khoá sai thì màn hiện đúng chuỗi khoá và test đỏ ngay.

Tổng test **480 → 495** (14 test mới + 1 test cho `ApiError`).

**Chín lần phá code, lần nào cũng đúng test tương ứng đỏ:**

| Phá gì | Test đỏ |
|---|---|
| Gõ sai khoá câu đếm trang (`nen.trangg`) | `nen.interaction` — Pagination |
| Trả nhãn mặc định về giá trị mặc định của tham số | `nen.interaction` — ConfirmDialog bản EN |
| Đảo hai nút Trước / Sau | `nen.interaction` — Pagination (2 ca) |
| `QueryState` đưa thẳng `err.message` lên màn | `nen.interaction` — BẪY lỗi API |
| `ApiError` đè cả câu backend gửi về bằng khoá | `nen.interaction` + `errors.test` |
| Đổi tên chỗ trống bên `en.json` (`tong` → `total`) | `i18n` — chỗ trống phải trùng tên |
| Xoá bản tiếng Anh của một khoá mới | `i18n` — vi ↔ en cùng bộ khoá |
| Chép nguyên tiếng Việt sang `en.json` | `i18n` — không trùng vi/en |
| Dịch "Đóng" lệch hệ cũ (Close → Dismiss) | `i18n` — lệch với từ điển hệ cũ |

**Một dòng ngoại lệ mới trong `i18n.test.ts`, và nó có lý do thật:**
`nen.ngonNguEn` để **"English"** ở cả hai bản. Tên ngôn ngữ tự gọi mình; đổi bản
tiếng Việt thành "Tiếng Anh" là đổi chữ của người dùng tiếng Việt, đúng thứ việc
chuyển i18n không được phép làm. Danh sách trùng có chủ ý nay 6 dòng.

**Khoá mới — 12 khoá, và phần lớn việc là TRỎ VÀO khoá có sẵn.** Chín trong số
chữ của bộ nền đã có khoá từ bảy nhóm trước (`action.huy`, `action.dong`,
`action.thuLai`, `chung.xacNhan`, `state.dangTai`, `state.trong`, `state.loi`,
`action.dangXuat`, `chung.cauLacBo`) — đúng thứ tài liệu đoán từ nhóm Hội viên.
Tiền tố mới **`nen.*`** cho chữ chỉ bộ component nền dùng, và **`loi.*`** cho hai
câu báo lỗi dùng chung (`loi.man`, `loi.maSo`).

**Đã kiểm chứng trên app đang chạy** (`npm run mock` + `npm run dev`), bấm qua
lại EN/VI trên `/thu-nghiem` và các màn thật:
- `Trang 1 / 5 · Trước · Sau` → `Page 1 of 5 · Previous · Next`;
- ba trạng thái `QueryState`: `Đang tải… · Chưa có dữ liệu. · Không tải được dữ
  liệu.` → `Loading… · No data yet. · Failed to load data.`, nút `Thử lại` →
  `Retry`;
- `ErrorBoundary`: `Màn hình này gặp sự cố` → `This screen ran into a problem`;
- ngăn chi tiết Hội viên: nút đóng `Đóng` → `Close`, mô tả `sr-only`
  `Bảng thông tin` → `Details panel`;
- hộp thoại huỷ buổi tập ở Đặt lịch: nút mặc định `Huỷ` → `Cancel`, còn nhãn màn
  tự truyền (`Huỷ buổi` → `Cancel session`) vẫn thắng nhãn mặc định;
- thanh trên: `Đăng xuất` → `Sign out`, `aria-label` ô chọn CLB `Câu lạc bộ` →
  `Club`, nút ngôn ngữ `EN`/`aria=Chuyển sang English` ↔ `VI`/`aria=Switch to
  Vietnamese`;
- quay lại tiếng Việt: y hệt trước khi chuyển, không chuỗi khoá nào lọt ra màn,
  console sạch (chỉ còn lỗi CỐ Ý của nút thử `ErrorBoundary`).

> ⚠ **Ghi chú ở `KyHopDongForm` nay chỉ còn đúng một nửa.** Nút "Huỷ" của
> `ConfirmDialog` đã dịch; câu báo lỗi chữ ký vẫn tiếng Việt vì nó đến từ
> `packages/signature-pad` — nhóm `packages` chưa tới lượt.

#### `packages` đã chuyển xong ✅ — phần đuôi thứ hai, và là lần đầu dịch trong một GÓI PORT

**35 → 3 chuỗi**, tổng **93 → 61**. Ba chuỗi còn lại là ba câu `throw` của
`tlv()` — lỗi bất biến bên trong bộ mã hoá, chỉ lập trình viên đọc.

**Mục 8 nói "port nguyên văn, đừng viết lại", và điều đó KHÔNG cấm chuyển i18n.**
Câu ấy áp cho THUẬT TOÁN — TLV, CRC, ngưỡng xoá nền, phép co ảnh — và không một
dòng nào trong số đó bị đụng. Thứ đổi là chỗ LẤY CHỮ, y như bảy nhóm nghiệp vụ.

**Hàm thuần trả KHOÁ, màn mới dịch — đúng khuôn `san-pham/gia.ts`, nhưng lần này
lòi ra một hình dạng nữa.** Hai câu của `chu-ky.ts` mang con số tính ngay trong
hàm ("Ảnh 8.0 MB, vượt mức 2 MB.", "Ảnh chữ ký quá lớn (600 KB)."), mà khoá trần
thì không chở được con số đi. Thêm kiểu `LyDo` ở `lib/i18n`:

```ts
export interface LyDo { khoa: string; thamSo?: ThamSo; }
```

| Module | Trả về | Vì sao |
|---|---|---|
| `features/san-pham/gia.ts` | khoá trần `string \| null` | không nhánh nào có chỗ điền |
| `packages/vietqr/vietqr.ts` | khoá trần `string \| null` | như trên — 7 nhánh, không nhánh nào có số |
| `packages/signature-pad/chu-ky.ts` | `LyDo \| null` | 2 trong 7 nhánh mang con số |

**Luật để lần sau khỏi phải nghĩ lại: cả hàm trả CÙNG một kiểu.** Trộn khoá trần
với `LyDo` trong một hàm là chỗ gọi phải kiểm `typeof` — đúng thứ mà một hàm kiểm
tra không nên bắt ai làm. Đã ghi ngay trên khai báo `LyDo`.

**Bẫy MỚI mà `LyDo` mở ra, và nó không giống bẫy nào trước đó.** Từ trước tới
giờ, chỗ trống của một câu do CHÍNH màn điền, nên sai tên là thấy ngay lúc viết.
Nay hàm thuần điền, từ điển chờ — hai chỗ cách nhau ba tệp. Đổi `thamSo: { mb }`
thành `{ dungLuong }` là **qua hết mọi test khoá đã có**: khoá vẫn có thật, vẫn
dịch ra chữ, vi ↔ en vẫn cùng chỗ trống. Chỉ có màn hiện `Ảnh {mb} MB`. Vì vậy
`chu-ky.i18n.test.ts` có một ca riêng dựng câu THẬT từ đầu ra của hàm rồi soát
không còn `{…}` nào, ở cả hai ngôn ngữ.

**Ca "cùng chữ, khác chỗ đứng" lần thứ tư — và lần này là ĐỘNG TỪ.**

| Chữ tiếng Việt | Khoá | Tiếng Anh |
|---|---|---|
| "Xoá" — xoá một bản ghi | `action.xoa` | **Delete** |
| "Xoá" — dọn sạch khung ký | `chuKy.xoa` | **Clear** |

Dùng lại `action.xoa` cho nút của khung ký thì bản tiếng Việt vẫn "trông đúng"
nên không ai báo, còn người dùng tiếng Anh thấy nút **Delete** dưới một khung ký
— tưởng là xoá hợp đồng. Có test canh đúng chuyện đó. (Ba ca trước:
`CLB`/`Câu lạc bộ`, `toàn hệ thống`/`Toàn hệ thống`, nút/trạng thái ở Sản phẩm.)

**Lỗi NÉM ra thì giữ khoá, KHÔNG dịch.** `chuoiVietQR()` ném khi chỗ gọi quên hỏi
`viSaoKhongTaoDuocQR()` trước — đó là lỗi lập trình, người đọc là lập trình viên,
và khoá (`VietQR: vietqr.loi.soTienPhaiDuong`) chỉ thẳng ra nhánh nào đã chặn.
Dịch ở tầng đó thì lại rơi vào bẫy đóng băng ngôn ngữ. Cùng lối với `ApiError` ở
lượt `components`.

**Hai chỗ theo từ điển hệ cũ, không theo thói quen:** `vietqr.soTaiKhoan` để
**Account No.** (hệ cũ dịch vậy) chứ không phải "Account number"; `chung.soTien`
dùng lại cho hàng "Số tiền" thay vì tự đặt khoá mới. Cả hai đều có test bắt được
khi thử phá.

**Ba tệp test mới — tổng test 495 → 513 (+18):**

| Tệp | Test | Canh gì |
|---|---|---|
| `signature-pad/chu-ky.i18n.test.ts` | 5 | 7 nhánh lỗi + chỗ trống điền đủ |
| `vietqr/vietqr.i18n.test.ts` | 5 | 7 nhánh lỗi + lỗi ném mang khoá |
| `vietqr/KhoiChuyenKhoan.interaction.test.tsx` | 5 | vẽ ra rồi đọc chữ, vi/en |

Cộng thêm 3 ca tiếng Anh nối vào `ChuKyPad.interaction.test.tsx` có sẵn. **Các ca
tiếng Việt cũ của tệp đó KHÔNG phải sửa một dòng nào** — chúng vẫn tìm nút bằng
đúng chữ "Hoàn tác" / "Xoá" như trước khi chuyển, và chạy được là nhờ `useT()`
ngoài provider rơi về tiếng Việt. Đó vừa là bằng chứng chữ không đổi, vừa là lần
thứ hai quyết định "không ném khi thiếu provider" trả công.

**Chín lần phá code, lần nào cũng đúng test tương ứng đỏ:**

| Phá gì | Test đỏ |
|---|---|
| Gõ sai khoá nhãn nút khung ký | `ChuKyPad.interaction` (cả ca tiếng Việt cũ) |
| Trỏ nút xoá khung ký sang `action.xoa` (khoá CÓ THẬT, nghĩa sai) | `ChuKyPad.interaction` — bẫy Clear ≠ Delete |
| Đổi tên tham số hàm điền vào (`mb` → `dungLuong`) | `chu-ky.i18n` — chỗ trống điền hết |
| Đổi tên chỗ trống bên `en.json` (`toiDa` → `max`) | `i18n` — chỗ trống phải trùng tên |
| Nhánh `vietqr` trả khoá CÓ THẬT nhưng sai nghĩa | `vietqr.i18n` — đúng khoá đã khai |
| Màn quên gọi `t()` cho lý do hàm thuần trả về | `KhoiChuyenKhoan.interaction` |
| Dịch "Số tài khoản" lệch hệ cũ | `i18n` — lệch với từ điển hệ cũ |
| Bỏ tham số của nhãn phụ mã QR | `KhoiChuyenKhoan.interaction` — hai chỗ trống |
| Hàm thuần trả object thay vì `null` khi KHÔNG có lỗi | `chu-ky.i18n` |

**Đã kiểm chứng trên app đang chạy** (`npm run mock` + `npm run dev`), đi trọn
luồng hợp đồng HD0004 bằng tiếng Anh rồi bật lại tiếng Việt:
- khối chuyển khoản ở bước thu tiền: `Bank transfer · Bank · Account No. ·
  Account holder · Amount · Transfer note · Copy`, nhãn phụ mã QR
  `QR code to transfer 7.000.000 ₫ to 0071000123456` — **cả hai chỗ trống đều
  điền**;
- đi tiếp `Send to accounting` → `Verify & issue` → tới bước ký: `Undo · Clear ·
  Upload signature image · Sign directly with your mouse or finger` — nút ghi
  **Clear**, không phải Delete;
- quay lại tiếng Việt: `Hoàn tác · Xoá · Tải ảnh chữ ký · Ký trực tiếp bằng chuột
  hoặc ngón tay` và `Chuyển khoản · Ngân hàng · Số tài khoản · Chủ tài khoản ·
  Số tiền · Nội dung chuyển khoản · Sao chép` — y hệt trước khi chuyển;
- không chuỗi khoá nào lọt ra màn, console sạch.

> ⚠ **Ghi chú ở `KyHopDongForm` nay đã gỡ.** Cả hai vế — nút "Huỷ" của
> `ConfirmDialog` và câu báo lỗi chữ ký — đều đã dịch.

#### i18n ĐÃ XONG — số chuỗi còn lại KHÔNG phải việc phải làm

> Bảng dưới là con số **lúc viết tài liệu (42)**. Sau khi dọn để bàn giao,
> `npm run i18n-con-lai` báo **11** — đúng bảng này trừ đi dòng `thu-nghiem`
> đã xoá. Xem mục 0a.

Cả 42 đều nằm ngoài phần sản phẩm:

| Còn lại | Ở đâu | Vì sao không dịch |
|---|---|---|
| 31 | `app/thu-nghiem/page.tsx` | Trang thử bộ component nền, CHỈ CÓ Ở BẢN DEV. Chữ của nó là dữ liệu bịa ("Nguyễn Văn An", "Quận 1", "Lỗi cố ý để thử ErrorBoundary") |
| 5 | `components` | 2 câu `throw` của `useSession()`/`useLocationScope()` + 1 `console.error` của `ErrorBoundary` (công cụ đếm bắt hai câu `throw` hai lần) |
| 3 | `packages/vietqr` | Ba câu `throw` của `tlv()` — lỗi bất biến trong bộ mã hoá |
| 1 | `lib/server/dotnet.ts` | Câu báo thiếu biến môi trường, đọc lúc dựng máy |
| 1 | `packages/xlsx-writer/xlsx.ts` | Câu `throw` khi workbook không có sheet nào — lỗi lập trình |
| 1 | `packages/xlsx-writer/mau-xml.ts` | `styles.xml` chép nguyên văn; chữ "VNĐ" trong đó là MÃ ĐỊNH DẠNG SỐ của Excel, không phải chữ trên màn |

Mười một câu ở các nhóm dưới là chữ cho LẬP TRÌNH VIÊN hoặc dữ liệu định dạng,
không bao giờ lên màn. Trang
`thu-nghiem` thì tài liệu đã ghi "hết vai trò" từ lúc dựng xong sáu nhóm nghiệp
vụ — **xoá hay giữ là quyết định riêng**, đừng gộp vào lượt i18n.

Từng phần và cách kiểm của nó ghi ở đúng phần tương ứng bên trên:
- ~~bảy nhóm nghiệp vụ~~ — ✅ đối chiếu bảng `*_KHOA` bằng `types.i18n.test.ts`;
- ~~`components`~~ — ✅ vẽ component ra rồi đọc chữ ở cả hai ngôn ngữ
  (`ui/nen.interaction.test.tsx`); bộ nền không có bảng `KHOA` để đối chiếu;
- ~~`lib`~~ — ✅ cùng lượt `components` (`ApiError` nay giữ khoá);
- ~~`packages`~~ — ✅ hàm thuần trả khoá (`vietqr.ts`) hoặc `LyDo` (`chu-ky.ts`);
  phần thuật toán của mục 8 không đụng một dòng;
- ~~`app`~~ — ✅ sau khi A5 gỡ chặn; trang server đọc cookie qua `tTrenServer()`.

**Và nay có một lưới bao trùm tất cả:** `lib/i18n/khoaDaDung.test.ts` quét mã
nguồn, bắt khoá gõ sai ở BẤT KỲ đâu và khoá chết trong từ điển. Thêm màn mới thì
không phải sửa gì trong nó.

#### ⚠ Worker jsdom không khởi động được khi máy thiếu BỘ NHỚ — biết trước để khỏi mất thời gian

Cùng thông điệp `Timeout waiting for worker to respond` với ca `forks` ở trên,
nhưng **nguyên nhân khác và cách xử lý cũng khác**:

```
Error: [vitest-pool]: Failed to start threads worker for test files
  src/features/hop-dong/components/ThuTienForm.interaction.test.tsx
Caused by: Error: [vitest-pool-runner]: Timeout waiting for worker to respond
```

Chỉ **11 tệp `*.interaction.test.tsx`** dính; 62 tệp còn lại luôn xanh. Máy dự án
có 7,9 GB RAM, và khi mở sẵn trình duyệt + VS Code + hai dev server thì chỉ còn
~1,1 GB trống — không đủ để dựng thêm worker jsdom. Cả bộ test cũng chậm gấp 3–5
lần (~20 giây → 90–120 giây), đó là dấu hiệu nhận ra ngay.

**Cách chắc chắn xanh mà không phải đóng gì:** chạy hai lượt.

```bash
npx vitest run --exclude "**/*.interaction.test.tsx"   # 69 tệp · 614 test
npm test -- interaction                                # 15 tệp · 119 test
```

Cộng lại đúng **84 tệp · 733 test**, và đã đối chiếu như vậy. Chạy một lượt
`npm run kiem-tra` thì cần đóng bớt cửa sổ trước, hoặc chấp nhận thử lại.

> ⚠ **Đừng "sửa" bằng cách đổi `pool` hay hạ `maxWorkers`.** `pool: 'threads'`
> là thứ đang giữ cho phần jsdom chạy được (lý do ở trên); đổi đi là quay về ca
> hỏng nặng hơn. Đây là giới hạn của MÁY, không phải của cấu hình — và nó KHÔNG
> phải test đỏ: không có một khẳng định nào sai, chỉ là worker không dựng nổi.

### A5 · Nhớ ngôn ngữ trong COOKIE ✅ — và nhờ đó i18n xong nốt nhóm `app`

Món này không phải i18n, nhưng nó là thứ DUY NHẤT còn chặn 52 chuỗi cuối, nên
làm xong là chuyển nốt được luôn trong cùng một lượt.

#### Vì sao đổi từ `localStorage` sang cookie

Mọi trang trong `app/` là **server component**. Server không đọc được
`localStorage`, nên nó dựng HTML bằng tiếng Việt rồi client mới sửa lại sau khi
hydrate. Hai hệ quả, cả hai đã ghi sẵn ở hai ghi chú ⚠ từ lượt dựng bộ chuyển
ngôn ngữ:

- người đã chọn tiếng Anh thấy **một nhịp tiếng Việt** nháy lên;
- `<html lang>` **sai** trong đúng khoảng đó, mà trình đọc màn hình chọn giọng
  theo thuộc tính này.

Cookie đi kèm request nên server biết ngay từ byte đầu tiên. **Ý ban đầu không
đổi:** ngôn ngữ vẫn là THÓI QUEN chứ không phải bối cảnh phiên, nên cookie phải
có `Max-Age` dài — cookie không `Max-Age` là cookie phiên, đóng trình duyệt là
quên, tức là tụt về đúng cái `sessionStorage` mà bản đầu đã cố tránh.

#### Hàm thuần trước, UI sau — `lib/i18n/cookieNgonNgu.ts`, 12 test

Phép đọc/ghi cookie chỉ nhận và trả CHUỖI, không chạm `document` lẫn
`next/headers`, nên test được cả hai đầu bằng chuỗi thật. Bốn bẫy, mỗi bẫy một
test:

| Bẫy | Vì sao nó âm thầm |
|---|---|
| **So tên bằng "có chứa"** | `chuoi.includes('vfl.ngonNgu=')` khớp luôn cookie tên `x_vfl.ngonNgu` của thứ khác. Chỉ lộ ra khi có cookie thứ hai — tức là muộn |
| **Trùng tên, lấy bản cuối** | Hai cookie cùng tên khác `Path` cùng được gửi lên; trình duyệt xếp bản khớp sát nhất LÊN TRƯỚC. Lấy bản cuối là đọc phải cookie chết |
| **Quên `Path=/`** | Cookie chỉ thuộc đường dẫn đang đứng: chọn EN ở `/hoi-vien` rồi sang `/tong-quan` là quên. "Chỉ thỉnh thoảng mới sai" nên không ai báo |
| **`Secure` đặt cứng** | Cookie KHÔNG BAO GIỜ ghi được lúc `npm run dev` trên `http://localhost`, mà trình duyệt im lặng bỏ qua chứ không báo gì. Nên `baoMat` là THAM SỐ — hàm vẫn thuần, chỗ gọi đọc `location.protocol` |

Ca đáng giá nhất của tệp: **ghi rồi đọc lại**. Đọc và ghi là hai hàm riêng, mỗi
hàm tự nó đúng mà lệch nhau thì vẫn hỏng — và chuỗi ghi ra có cả thuộc tính còn
`document.cookie` lúc đọc thì không, nên phải dựng lại đúng phần trình duyệt trả
về.

#### ⚠ KHÁC `localStorage` MỘT ĐIỂM SỐNG CÒN: ghi cookie hỏng thì IM LẶNG

`localStorage.setItem` bị chặn thì **ném** `SecurityError`, nên `try/catch` là đủ
để biết. Gán `document.cookie` bị chặn thì **không ném gì cả** — chuỗi vào hư
không và lần đọc sau vẫn ra giá trị cũ.

Với `useSyncExternalStore` thì kho LÀ nguồn sự thật, nên tin bừa vào phép gán
nghĩa là nút đổi ngôn ngữ **bật ngược về chỗ cũ ngay khi vừa bấm** — bấm mãi
không đổi được, không báo gì. Đây đúng là bài học đã trả giá ở `clbDangChon`,
nhưng bản `localStorage` thoát nhờ việc kho kia biết ném. Vì vậy `luu()` phải
**ĐỌC LẠI** để biết mình có ghi được không, rồi mới quyết định dùng bản tạm.

Bản giả cookie trong test cũng phải cư xử đúng như thật: **ghi là một câu lệnh,
đọc là cả chuỗi**. Gán `"a=1; Path=/"` chỉ thêm MỘT cookie, còn đọc ra là
`"a=1; b=2"` không kèm thuộc tính nào. Bản giả nào trả lại nguyên chuỗi vừa gán
là bản giả nói dối, và test sẽ xanh với mã hỏng.

#### Nửa server — `lib/i18n/ngonNguServer.ts`, 7 test

`ngonNguTrenServer()` đọc cookie, `tTrenServer()` trả `t()` đã gắn ngôn ngữ. Đây
là bản song sinh của `useT()`; **đặt tên khác nhau là CỐ Ý** — hai hàm chạy hai
phía và không thay nhau được, đừng để ai gọi `useT()` trong trang server rồi tự
hỏi vì sao chữ không đổi.

Hai nhánh phòng thủ, cả hai đều có test: giá trị lạ trong cookie rơi về tiếng
Việt (không thì `<html lang="fr">` và mọi chuỗi rơi về chính khoá — hỏng ngay từ
HTML đầu chứ không phải sau hydrate); `cookies()` ném khi gọi ngoài ngữ cảnh
request thì bắt lại, vì để nó ném lên là cả trang trắng chỉ vì một tuỳ chọn hiển
thị.

#### Ảnh chụp server của provider nay là một PROP

`NgonNguProvider` nhận `ngonNguBanDau` và `getServerSnapshot` trả chính nó, thay
cho hằng `null` của bản cũ. `app/layout.tsx` đọc cookie một lần, dùng cho cả
`<html lang>` lẫn prop này — nên hai bên khớp nhau, không lệch hydration.

> ⚠ **Test jsdom KHÔNG với tới nhánh này.** `useSyncExternalStore` chỉ dùng
> `getServerSnapshot` khi render ở server và ở lần render hydrate đầu; ở jsdom
> React render thẳng nên luôn đi `getSnapshot`. Nghĩa là **bỏ hẳn
> `ngonNguBanDau` đi thì mọi test tương tác vẫn xanh**, còn người dùng thật quay
> lại nhìn nhịp tiếng Việt nháy lên. Đường duy nhất đi đúng nhánh đó là
> `renderToStaticMarkup` — vì vậy có thêm `NgonNguProvider.test.tsx` chạy ở môi
> trường `node`, không phải jsdom.

#### Cái giá đã biết trước: cả cây route thành ĐỘNG

Đọc cookie trong root layout làm Next không dựng tĩnh được nữa. Trước đây
`/dang-nhap` và `/thu-nghiem` là `○ (Static)`; nay mọi route đều `ƒ (Dynamic)`.
Chấp nhận được với hệ này — mọi màn khác đều sau đăng nhập và đều đọc dữ liệu
theo phiên — và đổi lại là `<html lang>` đúng ngay từ byte đầu.

> ⚠ **Người đang có lựa chọn trong `localStorage` sẽ phải bấm "EN" lại MỘT lần.**
> Không viết mã di trú: nó phải đọc `localStorage` sau khi hydrate rồi ghi cookie
> — tức là dựng lại đúng cái nhịp nháy vừa gỡ bỏ, cho một nhóm người dùng mà ở
> Phase 1 gần như chỉ có đội phát triển (bản tiếng Anh chủ yếu để kiểm). Khoá cũ
> nằm lại trong `localStorage` và vô hại. Ghi ra đây để không ai tưởng là lỗi.

#### Nhóm `app` chuyển xong ngay sau đó ✅ — HẾT PHẦN i18n

**52 → 31 chuỗi, và 31 chuỗi còn lại đều nằm trong đúng một tệp:**
`app/thu-nghiem/page.tsx`, trang thử bộ component nền CHỈ CÓ Ở BẢN DEV. Chữ của
nó là dữ liệu bịa để xem component vẽ ra sao — "Nguyễn Văn An", "Quận 1", "Gây
lỗi", "Lỗi cố ý để thử ErrorBoundary". Dịch chúng là dịch đồ đạc trong phòng thử
đồ. **Phần sản phẩm thật của `app` về 0**: `(app)` 0 · `dang-nhap` 0 · `api` 0.
Tài liệu đã ghi trang này "hết vai trò" từ lúc dựng xong sáu nhóm nghiệp vụ —
xoá hay giữ là quyết định riêng, không gộp vào lượt i18n.

**`metadata` tĩnh không dịch được, phải là `generateMetadata()`.** `metadata`
tính một lần lúc dựng và không thấy request nào; `generateMetadata()` chạy trong
ngữ cảnh request nên đọc được cookie. Áp cho `app/layout.tsx` (tên + mô tả hệ
thống) và `app/dang-nhap/page.tsx` (tiêu đề tab).

**Bảy trang dùng lại khoá `nav.*` cho tiêu đề, trừ một.** Tiêu đề trang và mục
menu là cùng một khái niệm ở cùng ngữ cảnh (trỏ tới DANH SÁCH) nên số nhiều của
`nav.*` là đúng chỗ. Ngoại lệ duy nhất: menu ghi "Bán vé ngày" còn trang ghi
"Bán vé ngày tại quầy" — **chữ khác nhau thì khoá khác nhau**, đúng luật đã giữ
từ `chung.clb` / `chung.cauLacBo`.

**Route đổi token cũng dịch được rồi.** `api/auth/refresh` trả
`{ title: 'Phiên đã kết thúc' }`, và `client.ts` đưa thẳng `title` đó lên màn qua
`ApiError` — tức là chữ cho NGƯỜI DÙNG. Route handler chạy trong ngữ cảnh request
nên gọi `tTrenServer()` được. Đây là ví dụ cho thấy cookie mở khoá cả phía server
chứ không riêng trang.

#### `khoaDaDung.test.ts` — lưới cuối, và nó ĐỌC MÃ NGUỒN

Các tệp `*.i18n.test.ts` của từng nhóm đối chiếu một BẢNG khoá. Nhưng phần lớn
khoá của dự án **không nằm trong bảng nào** — chúng viết thẳng ở chỗ gọi, trong
JSX và trong thân hàm, và với TypeScript thì mọi `string` đều hợp lệ.

Tệp này quét toàn bộ `src`, gom mọi khoá trong lời gọi `t('...')`, rồi soát bốn
việc. **Nó không giữ bản danh sách nào của riêng nó** — thứ mà mọi test chép
khuôn đều phải giữ, và là chỗ chúng âm thầm lệch khỏi mã. Thêm màn mới, thêm
khoá mới, đổi tên khoá: không phải sửa gì trong tệp này.

| Ca | Bắt được gì |
|---|---|
| Công cụ quét phải TÌM RA thứ gì đó | chính nó — biểu thức tìm hỏng thì danh sách rỗng và mọi ca sau thành xanh vĩnh viễn |
| Mọi khoá viết thẳng phải có thật | gõ sai khoá ở bất kỳ đâu |
| Khoá phải dịch ra chữ thật ở cả hai ngôn ngữ | chép khoá vào từ điển cho qua test |
| **Không có khoá CHẾT trong từ điển** | khoá của màn đã xoá, và chuỗi quên chưa chuyển |

Ca cuối tính "đã dùng" theo **chuỗi khoá có xuất hiện trong mã hay không**, chứ
không theo lời gọi `t()`, vì rất nhiều khoá tra ĐỘNG: bảng `*_KHOA`, ma trận
`CAPABILITIES`, `navigation.ts`, và các hàm thuần trả khoá. Tất cả những chỗ đó
đều ghi khoá ĐẦY ĐỦ dưới dạng chuỗi — đó là quy ước, và ca này giữ cho nó đúng.

**Nó tìm ra ba khoá chết ngay lần chạy đầu:** `action.timKiem` và `action.locLai`
chưa màn nào dùng từ lúc gieo 23 khoá hạ tầng, còn `action.xoa` trùng nguyên với
`chung.xoa` (khoá đang thật sự được dùng ở dòng sản phẩm của hợp đồng). Đã bỏ cả
ba. Khoá chết không vô hại: nó làm phép đối chiếu vi ↔ en yếu đi, vì dịch sai một
khoá không ai dùng thì không ai nhìn thấy, mà nó vẫn nằm trong danh sách "đã
dịch".

Một sửa nhỏ đi kèm: **`Toaster` đổi tên biến vòng lặp từ `t` sang `muc`** để trả
lại tên `t` cho hàm dịch — đúng việc đã làm với biến tab ở nhóm Sản phẩm, và lần
này còn là điều kiện để công cụ quét nhìn thấy lời gọi.

#### Phá code — 20 lần, lần nào cũng đúng test tương ứng đỏ

Chia ba đợt theo ba tầng.

**Tầng hàm thuần cookie (8):** so tên bằng "có chứa" · bỏ `trim()` quanh tên · bỏ
`trim()` quanh giá trị · trùng tên lấy bản cuối · quên `Path=/` · bỏ `Max-Age` ·
đặt `Secure` cứng · nhận bừa mọi giá trị.

**Tầng nối dây (6):** tin vào phép gán cookie không đọc lại · bỏ cờ `Secure` khi
chạy HTTPS · server bỏ lọc giá trị cookie · server để `cookies()` ném lên trên ·
ảnh chụp server quay về hằng `null` · provider bỏ effect đồng bộ `<html lang>`.

**Tầng `app` (6):** gõ sai khoá tiêu đề trang · gõ sai khoá mô tả trang · gõ sai
khoá trong `LoginForm` · thêm khoá vào từ điển mà không ai dùng · chép nguyên
tiếng Việt sang `en` · route đổi token trả câu tiếng Việt cứng thay vì khoá.

Bốn ca cuối của tầng ba đều do **`khoaDaDung.test.ts`** bắt — lưới mới đắt giá
nhất, vì nó bắt được cả thứ chưa ai nghĩ tới lúc viết test.

#### Đã kiểm chứng trên app đang chạy — và lần này kiểm ở TẦNG HTTP

Nhịp nháy tiếng Việt là thứ không bấm tay mà thấy được, nên phải soi thẳng byte
mà server trả về:

```bash
curl -s -H "Cookie: vfl.ngonNgu=en" http://localhost:3000/dang-nhap | grep -o '<html[^>]*>'
```

| Cookie | `<html lang>` | Tiêu đề tab |
|---|---|---|
| không có | `vi` | `Đăng nhập · VFL Alpha Management` |
| `vfl.ngonNgu=en` | `en` | `Sign in · VFL Alpha Management` |
| `vfl.ngonNgu=fr` (rác) | `vi` | — |

Và trong HTML của `/hoi-vien` (đăng nhập bằng `curl` để có cookie phiên): bản
`en` có sẵn `Members` cùng `List, details, add / edit, change status.` **ngay
trong byte đầu**, menu cũng đã là `Overview · Members · Staff …` — không còn nhịp
nào để mà nháy.

Trên trình duyệt: bấm "EN" ghi **cookie** (`localStorage` trống), F5 vẫn nhớ,
`<html lang>` đúng, console sạch (không lệch hydration). Bảy trang bằng tiếng
Anh: `Overview · Members · Staff · Products · Scheduling · Day passes at the
front desk · Contracts` kèm đủ bảy câu mô tả; bấm "VI" thì bảy tiêu đề trở lại y
hệt trước khi chuyển. `POST /api/auth/refresh` không có phiên trả
`{"title":"Phiên đã kết thúc"}` hoặc `{"title":"Your session has ended"}` đúng
theo cookie.


### A4 · Đăng xuất dọn sạch máy cho người sau ✅ — lỗi hành vi thật ở quầy, và CẢ HAI đường ra

Bảng 7.0 để món này ở cuối vì nó "chỉ 1 giờ". Nhưng nó là **lỗi đang xảy ra**:
quầy dùng chung một máy, người trước đăng xuất rồi người sau đăng nhập ngay trên
cùng tab, mà `sessionStorage` và cookie đều sống qua lần chuyển trang đó. Người
sau thừa hưởng **CLB đang chọn** của người trước — bán vé và đặt lịch vào nhầm cơ
sở, và **màn vẫn "trông đúng" nên không ai báo**.

#### Một CỬA duy nhất, không gọi rải rác — `lib/storage/quenPhien.ts`

Cách hiển nhiên là gọi thẳng hai hàm `quen()` trong `LogoutButton`. Không làm vậy,
vì chỗ nhớ theo người dùng sẽ còn thêm (bộ lọc đã lưu, cột đã ẩn, cỡ trang…) và
**thứ hỏng ở đây không bao giờ tự lộ ra với người viết mã**: kho mới thêm chạy
đúng ở mọi màn, chỉ người dùng TIẾP THEO mới thấy nó ở lại — và họ không biết đó
là lỗi.

Nên: `quenMoiThuCuaNguoiDung()` là cửa duy nhất, cộng **một test ĐỌC MÃ NGUỒN**
bắt buộc mọi module có `export function quen()` phải được nối vào cửa đó. Cùng
lối với `khoaDaDung.test.ts` của lượt i18n: danh sách chép tay chính là thứ người
thêm kho mới sẽ quên cập nhật.

**Mỗi kho một `try` riêng.** Gộp chung một `try` là kho khai SAU kho ném sẽ ở lại
nguyên vẹn trên máy — đúng cái lỗi cửa này sinh ra để chặn, chỉ im lặng hơn.

**Dọn TRƯỚC lời gọi mạng, không phải sau.** Gọi sau `await api.post('/auth/logout')`
thì mạng chậm hay hỏng là có một khoảng người sau đã ở trang đăng nhập mà kho vẫn
còn của người trước. Có test giữ lời gọi mạng treo lơ lửng để nhìn đúng khoảnh
khắc đó.

#### 🐞 Bước "phá code" bắt được một test KHÔNG CÓ RĂNG — của chính lượt này

Ca "một kho hỏng không được chặn kho còn lại" viết lần đầu bằng cách chặn
`sessionStorage`. Nó **xanh cả với bản gộp chung `try`** — tức là không kiểm gì
cả. Lý do: cả hai hàm `quen()` hiện có đều **tự nuốt lỗi bên trong**, nên chặn
kho thật thì không có gì ném ra tới cửa.

Phải giả hẳn một kho biết ném (`vi.doMock`) thì ca mới đỏ đúng lúc. Và điều đó
làm rõ luôn ý nghĩa của lớp phòng thủ này: nó **không phải cho hai kho hiện có**,
mà cho kho THÊM SAU — kho mà ta chưa biết nó có nuốt lỗi hay không. Đã ghi lý do
ngay trong ca test, vì đọc mã hiện tại thì lớp này trông như thừa.

> ⚠ Đây là lần thứ ba bước "cố tình phá code" tìm ra thứ không ai canh (hai lần
> trước ở nhóm Đặt lịch và ở `docDaLuu()` của kho ngôn ngữ). **Đừng bỏ bước đó
> dù việc trông cơ học** — và đặc biệt đừng bỏ khi test vừa viết đã xanh ngay.

#### ⚠ Đánh đổi đã biết: ngôn ngữ mất tính "thói quen" trên máy CÁ NHÂN

`cookieNgonNgu.ts` cố ý cho cookie `Max-Age` một năm vì ngôn ngữ là thói quen của
người dùng chứ không phải bối cảnh phiên. Xoá nó khi đăng xuất là đi ngược lại:
trên máy cá nhân, mỗi lần đăng nhập lại phải chọn tiếng Anh một lần nữa.

Chọn theo QUẦY vì đó là chỗ có lỗi thật, và với CLB thì thừa hưởng là sai SỐ
LIỆU chứ không chỉ phiền. **Muốn giữ ngôn ngữ qua lần đăng nhập thì bỏ đúng một
dòng trong `quenPhien.ts`**, và nhớ bỏ cả dòng tương ứng trong test — đã ghi chú
tại chỗ để không ai phải đoán.

#### Đường ra thứ hai — `/api/auth/thoat` — đã dọn nốt ✅

Nút Đăng xuất không phải đường duy nhất tới trang đăng nhập. Khi tầng server phát
hiện phiên hỏng, nó chuyển hướng qua `GET /api/auth/thoat` (mục 5) — và đường đó
**không chạy được mã client**, nên `sessionStorage` giữ nguyên CLB của người
trước. Cùng một lỗi, đường khác, và người ở quầy thì không phân biệt được hai
đường ấy.

Ba cách, cân nhắc rồi mới chọn:

| Cách | Được | Mất |
|---|---|---|
| Trang đăng nhập dọn TẤT CẢ khi mở | phủ MỌI đường ra | mọi lần đăng nhập đều về tiếng Việt — hỏng hẳn tính "thói quen" của ngôn ngữ |
| **Trang đăng nhập chỉ dọn CLB** ← đã chọn | phủ mọi đường ra cho thứ NGUY HIỂM, không tốn gì | ngôn ngữ vẫn theo người dùng qua đường hết phiên — đúng ý, không phải mất |
| Để nguyên | — | lỗi còn ở đường hết phiên |

**Luật rút ra, ghi ngay trong mã: "CLB KHÔNG BAO GIỜ sống sót qua trang đăng
nhập; ngôn ngữ chỉ dừng ở lần đăng xuất CÓ CHỦ Ý."** Hai cửa cho hai lúc khác
nhau — `quenClbDangChon()` và `quenMoiThuCuaNguoiDung()` — và có test canh đúng
chỗ dễ gộp nhầm nhất là gộp chúng lại.

**Không tốn gì, và đó là nhờ middleware.** `proxy.ts` đá người còn phiên hiệu lực
ra khỏi `/dang-nhap`, nên phép dọn ở màn đăng nhập chỉ chạy đúng lúc KHÔNG có ai
đang đăng nhập — mà lúc đó thì không CLB nào được phép còn chọn. Nếu sau này bỏ
nhánh đó của middleware thì phải xem lại chỗ này.

#### Test — 16 ca mới

| Tệp | Ca | Canh gì |
|---|---|---|
| `lib/storage/quenPhien.test.ts` | 6 | xoá cả hai kho · kho ném không chặn kho kia · **cửa trang đăng nhập chỉ xoá CLB, GIỮ ngôn ngữ** · chưa chọn gì · chạy được ở server · **mọi kho có `quen()` phải nối vào cửa** |
| `components/auth/LogoutButton.interaction.test.tsx` | 4 | bấm thật thì hai kho sạch · **dọn trước lời gọi mạng** · lỗi mạng vẫn ra ngoài và vẫn sạch · nút khoá sau khi bấm |
| `app/dang-nhap/LoginForm.interaction.test.tsx` | 6 | **mở màn là CLB hết** · **ngôn ngữ thì giữ** · sai mật khẩu · **lỗi backend không có detail thì hiện câu ĐÃ DỊCH, không phải "HTTP 500"** · mất mạng · đăng nhập được |

Tổng test **542 → 558**. Tệp `LoginForm` cũng là tệp test đầu tiên của màn đăng
nhập, và khuôn giả `next/navigation` + `@/lib/api` trong đó chép sang được cho A3.

**Chín lần phá code, lần nào cũng đúng test tương ứng đỏ:** cửa quên xoá ngôn ngữ ·
gộp hai kho vào chung một `try` (hai biến thể) · nút Đăng xuất quên gọi dọn · dọn
sau lời gọi mạng thay vì trước · **thêm hẳn một tệp kho mới có `quen()` mà không
nối vào cửa** · cửa trang đăng nhập dọn luôn cả ngôn ngữ · màn đăng nhập quên dọn
CLB · `LoginForm` đưa thẳng `err.message` lên màn.

#### Đã kiểm chứng trên app đang chạy

Đóng vai hai người dùng chung một tab:

1. **Người trước** (`gd@vfl.vn`): chọn CLB **VFL Quận 7**, bấm **EN** → kho ghi
   `vfl.location = q7`, cookie `vfl.ngonNgu=en`, `<html lang="en">`, thanh trên
   `VI · Sign out`.
2. Bấm **Sign out** → về `/dang-nhap`; `sessionStorage['vfl.location']` **null**,
   cookie ngôn ngữ **mất hẳn**, `<html lang="vi">`, trang đăng nhập tiếng Việt
   với đúng tiêu đề tab `Đăng nhập · VFL Alpha Management`.
3. **Người sau** (`sale@vfl.vn`) đăng nhập ngay trên tab đó → ô chọn CLB về `q1`,
   kho vẫn rỗng, giao diện tiếng Việt. Không thừa hưởng gì.

Rồi kiểm riêng **đường hết phiên**, tức đường trước đây rò:

4. Đăng nhập lại, chọn **q7**, bật **EN** → kho `q7`, cookie `en`, `lang="en"`.
5. Vào thẳng `/api/auth/thoat` (đúng đường server dùng khi phiên hỏng) → về
   `/dang-nhap` với **`sessionStorage['vfl.location']` = null** — trước lượt này
   nó vẫn còn `q7` — trong khi **cookie ngôn ngữ vẫn `en`**, `<html lang="en">`,
   và màn đăng nhập hiện `Sign in · Club chain operations system · Password`.
   Đúng cả hai nửa của luật: thứ nguy hiểm hết, thói quen thì ở lại.

Console sạch (chỉ còn cảnh báo WebSocket HMR của bản dev).


### Dọn nợ · Test tương tác (jsdom + React Testing Library) ✅

Món cuối trong bảng 7.0 không bị chặn bởi ai. Phủ đúng chỗ trước giờ chỉ kiểm
được bằng tay: **click và gõ**.

**Phụ thuộc dev: 4, không phải 2** như tài liệu ước lượng — `@testing-library/dom`
là peer bắt buộc của cả `react` lẫn `user-event`. `npm audit` vẫn **0
vulnerabilities**.

**KHÔNG cài `@testing-library/jest-dom`.** Nó chỉ thêm mấy matcher kiểu
`toBeDisabled()`; đọc thẳng `button.disabled` cũng rõ như vậy mà bớt một phụ
thuộc phải nâng cấp theo.

**Môi trường: `node` vẫn là mặc định.** Tệp nào cần DOM thì tự khai ở đầu tệp:

```ts
// @vitest-environment jsdom
```

Bật jsdom cho cả bộ là bắt 300 test hàm thuần trả giá dựng DOM mà không dùng tới.
Đồ nghề chung ở **`src/test/jsdom.tsx`**: dọn dẹp giữa các ca, bản giả
`ResizeObserver`, bản giả `<canvas>`, và mấy hàm bấm/gõ đã bọc `act()`.

> ⚠ **`pool: 'threads'`, KHÔNG phải `forks` (mặc định của Vitest).** Trên máy
> Windows của dự án, `require('jsdom')` mất **~12 giây** — thư viện nhiều tệp nhỏ
> và trình quét virus soi từng tệp. Với `forks`, mỗi tệp test jsdom là một tiến
> trình mới phải trả lại từng ấy thời gian, và worker vượt hạn khởi động:
> `Timeout waiting for worker to respond`, không chạy nổi một test nào. `threads`
> dùng chung worker nên chỉ trả giá đó một lần. Cả bộ test cũng nhanh hơn hẳn:
> **~55 giây → ~17 giây**.
>
> ⚠ **Thỉnh thoảng vẫn hụt.** Đã gặp MỘT lần: `npm run kiem-tra` chạy được 43/49
> tệp rồi báo 6 "unhandled error", chạy lại ngay thì xanh trọn. Nguyên nhân cùng
> gốc với đoạn trên — worker jsdom khởi động chậm khi máy đang bận (dev server +
> `next build` chạy song song). Gặp thì chạy lại trước khi đi tìm lỗi trong code;
> nếu lặp lại đều đặn thì mới phải nâng hạn khởi động của pool.

| Tệp | Phủ gì |
|---|---|
| `ChuKyPad.interaction.test.tsx` (7) | đặt bút · kéo · nhấc bút · Hoàn tác · Xoá · khung xám lúc đang gửi · canvas bị nhiễm |
| `LocationProvider.interaction.test.tsx` (6) | **đổi CLB rồi F5** · bị rút quyền · mất cờ toàn hệ thống · kho bị chặn |
| `DoiSoatCa.interaction.test.tsx` (8) | gõ tiền có nhóm hàng nghìn · cửa "lệch thì bắt buộc ghi lý do" · đếm được 0 |

Cả ba nhóm đã kiểm chứng bằng cách cố tình phá code — 11 lần phá, lần nào cũng
đúng test tương ứng đỏ.

> **Bài học 1 — `act()` không phải thủ tục hình thức.** Ban đầu test bấm bằng
> `element.click()`. Handler chạy, ref đổi, `onChange` bắn đúng — nhưng React
> CHƯA vẽ lại, nên `button.disabled` vẫn là giá trị cũ và test đỏ ở một chỗ trông
> như vô lý. Dùng `fireEvent` / bọc `act()`; đã gói sẵn thành `bam()`, `go()`,
> `chon()`, `keoBut()` trong `src/test/jsdom.tsx`.

> **Bài học 2 — có luật được phòng thủ hai lớp, phá một lớp test vẫn xanh.**
> Luật "một chấm không phải chữ ký" do CẢ `nhacBut()` (bỏ nét 1 điểm) lẫn
> `daVe()` (đòi nét từ 2 điểm) giữ. Phá riêng từng lớp thì test không đỏ, phá cả
> hai mới đỏ. Đó là kết quả ĐÚNG, không phải test cùn — hành vi người dùng thấy
> không đổi khi còn một lớp. Đừng gỡ lớp nào với lý do "thừa".

#### 🐞 Lỗi thật do test tương tác lôi ra — `sessionStorage` bị chặn

**Triệu chứng:** ở chế độ riêng tư (hoặc site data bị khoá), ô chọn CLB **bật
ngược về chỗ cũ ngay khi vừa chọn**. Người dùng bấm mãi không đổi được CLB, và
không có một lời báo nào.

**Nguyên nhân:** với `useSyncExternalStore`, **kho LÀ nguồn sự thật** — màn hình
không giữ bản sao nào của lựa chọn. `luu()` nuốt lỗi ghi rồi vẫn báo cho người
nghe; lần render ngay sau đó đọc lại kho và thấy giá trị cũ.

**Vì sao unit test không thấy:** `clbDangChon.test.ts` có hẳn một ca cho cảnh
này — và nó **khẳng định nhầm hành vi hỏng là đúng** (`expect(docDaLuu()).toBeNull()`).
Unit test đứng một mình không biết giá trị trả về ấy được dùng để làm gì. Test
tương tác biết, vì nó bấm vào đúng cái ô người dùng bấm.

**Đã sửa:** `clbDangChon.ts` giữ thêm một **bản lưu tạm trong bộ nhớ**, chỉ dùng
sau một lần ghi HỎNG thật (`ghiDuoc = false`). Đường chạy bình thường không đụng
tới nó, nên không sinh ra hai chỗ nhớ song song — có test riêng khẳng định điều
đó. Kèm theo là hàm **`quen()`** để xoá lựa chọn đã nhớ.

> ⚠ **`quen()` chưa được nối vào nút Đăng xuất.** Ở quầy nhiều người dùng chung
> một máy, người sau đang thừa hưởng CLB của người trước cho tới khi đóng tab.
> Việc nhỏ, nhưng là đổi hành vi đăng xuất nên tách ra — xem mục 6.2.

**Đã kiểm chứng trên app đang chạy** (mock + dev, `gd@vfl.vn`): đổi CLB ở thanh
trên sang Quận 7 → dòng phạm vi ở Dashboard đổi theo ("7 ngày · VFL Quận 7"),
`sessionStorage` ghi `q7`; **F5 → vẫn Quận 7**, không lỗi hydration trong console.
Đây đúng là việc mà mục "Dọn nợ · `LocationProvider`" dặn phải làm đầu tiên khi
mở app thật.

### Đợt rà soát thứ ba ✅ — đổi CLB khi đang ở trang 2 là mất sạch danh sách

Đợt này dò hai chỗ chưa ai đụng: **ngày tháng ở các mốc biên** và **phép tính
tiền của hợp đồng**. Cả hai đi qua sạch — ghi lại bên dưới để lần sau khỏi kiểm
lại. Lỗi nằm ở chỗ thứ ba, tìm ra khi đang đọc mã phân trang.

#### Hai phần đi qua sạch

**Ngày tháng.** Không có một chỗ nào dùng `toISOString()` (cảnh báo đã ghi ở
`lib/format/date.ts`, và mã tuân đúng). Dò các mốc biên:

| Dò | Kết quả |
|---|---|
| `mondayOf` Chủ nhật 06/09 | → 31/08 ✓ (không nhảy sang tuần sau) |
| `mondayOf` 01/01/2026 | → 29/12/2025 ✓ (qua biên năm) |
| "Tháng này" ngày 01 / 30 / 29-02-2024 | đúng, và kết thúc ở HÔM NAY chứ không phải cuối tháng ✓ |
| `phanTramThayDoi` kỳ trước = 0 | `null` ✓ ("tăng vô hạn" không hiển thị được) |

**Tiền hợp đồng.** Luật "giảm giá tính TRÊN TẠM TÍNH rồi làm tròn MỘT LẦN" chạy
đúng: ba dòng lẻ + giảm 7% → làm tròn một lần ra **70.000**, làm tròn từng dòng
ra **69.999**; hàm trả đúng con số đầu. Giảm số tiền lớn hơn tạm tính thì tổng
kẹp về **0**, không âm. Số lượng 0 và giỏ rỗng đều ra 0.

> ⚠ **Một câu để hỏi vận hành, không phải lỗi.** Kỳ so sánh của "Tháng này" là
> "cùng SỐ NGÀY liền trước". Ngày 02/09 thì nó so 01–02/09 với **30–31/08** —
> tức là so đầu tháng (thường vắng) với cuối tháng (thường đông). Nhãn trên màn
> ghi trung tính là "so với kỳ trước" nên không sai, nhưng nếu vận hành muốn so
> với **cùng kỳ tháng trước** (01–02/08) thì đó là đổi ý sản phẩm, không phải sửa
> lỗi. Ghi ra đây để có người quyết.

#### 🐞 LỖI · Đang ở trang 2, đổi CLB là danh sách trống và không có đường về

Dựng lại được trên app: gieo 25 hội viên vào Quận 1 (thành 28 người, 2 trang),
sang **trang 2**, rồi đổi CLB trên thanh trên sang Quận 7 (1 người, 1 trang):

- bảng **trống trơn** — 0 dòng;
- màn báo **"Không có hội viên khớp bộ lọc."** — sai hẳn: CLB đó CÓ hội viên và
  không bộ lọc nào loại ai cả;
- thanh phân trang **biến mất** (chỉ một trang thì nó tự ẩn), nên **không còn
  đường nào quay lại trang 1** ngoài đổi bộ lọc hoặc tải lại trang.

Người vận hành kết luận "Quận 7 không có hội viên nào" — và đó là kết luận về DỮ
LIỆU, rút ra từ một lỗi giao diện.

**Cả bốn màn có phân trang đều dính** (Hội viên · Nhân viên · Sản phẩm · Hợp
đồng), và cả bốn đều đã nhớ `setPage(1)` khi đổi BỘ LỌC. Chỗ nấp của lỗi: **CLB
không đến từ bộ lọc** — nó đến từ thanh trên qua `useLocationScope()`, nên không
ai gọi reset.

**Đã vá** — `lib/hooks/useTrangTheoPhamVi.ts`, một hook giữ số trang và tự về 1
khi phạm vi đổi; cả bốn màn dùng chung.

⚠ **Chỉnh state NGAY TRONG LÚC RENDER, không dùng `useEffect`.** Đây đúng ca
React khuyến nghị cách đó. Đặt trong effect thì có một nhịp màn vẽ bằng số trang
CŨ với dữ liệu MỚI — vẫn đúng cái bảng trống, chỉ ngắn hơn. Dự án cũng đã bỏ lối
`setState` trong effect một lần rồi, ở `LocationProvider`.

**Kiểm lại:** trang 2 của Q1 (8 dòng) → đổi sang Q7 → **1 dòng**, không còn câu
báo trống oan.

#### Bước phá code lại chỉ ra một lớp phòng thủ THỪA — và lần này thì gỡ

Bản đầu trả `trang: phamViTruoc === phamVi ? trang : 1` cho chắc. Phá lớp đó
(trả thẳng `trang`) thì **không test nào đổi màu**, và lần này lý do khác hẳn ca
chữ ký ở A3: gọi `setTrang` trong lúc render làm React **bỏ kết quả lần vẽ đó và
vẽ lại lập tức**, trước khi trình duyệt thấy gì — nên lần vẽ mang số trang cũ
không bao giờ tới DOM. Không có đường chạy nào chạm tới lớp thứ hai.

**Đã gỡ.** Khác với ca chữ ký (ba lớp độc lập, phá cả ba mới đỏ — nên giữ), lớp
này là **không bao giờ chạy tới**; giữ nó là giữ một dòng mà không ai chứng minh
được còn đúng. Lý do ghi tại chỗ ở cả hàm lẫn tệp test.

> **Bài học ghi lại:** "phá code mà test vẫn xanh" có HAI nghĩa khác nhau, và
> phải phân biệt trước khi xử lý — *test yếu* (sửa test) hay *mã thừa* (gỡ mã).
> Cách phân biệt: hỏi có đường chạy nào chạm tới lớp đó không. A3 có (ba lớp giữ
> chữ ký, phá cả ba thì đỏ) → giữ. Ở đây không có → gỡ.

#### Test — 5 ca mới

`lib/hooks/useTrangTheoPhamVi.interaction.test.tsx`: đổi CLB thì về trang 1 · người
dùng không thấy số trang cũ với CLB mới · đổi bộ lọc cũng về trang đầu · cùng CLB
thì không đá về trang 1 · **MỌI màn có `<Pagination>` đều phải dùng hook này**
(đọc mã nguồn).

**Bốn lần phá code:** ba đỏ đúng chỗ (bỏ reset · `veTrangDau` không về 1 · một
màn quay lại `useState(1)`), một xanh và đó chính là phát hiện "lớp thừa" ở trên.

Tổng test **611 → 616**.

### Đợt rà soát thứ hai ✅ — một lỗi TIỀN: bấm nhanh là ghi trùng

Đợt này nhắm vào chỗ dự án tự coi là nguy hiểm nhất — tiền và phạm vi CLB — và đi
trọn luồng quầy với mock: mở ca → bán → đối soát → đóng ca.

#### Phần đi qua sạch, ghi lại để lần sau khỏi kiểm lại

**Khoá cache có phạm vi CLB đúng.** `keys.*.list(params)` mang cả `locationId`
trong khoá; `datLich.hlv` cố ý KHÔNG mang (HLV không đứng hai CLB cùng lúc, phải
nhìn toàn hệ thống) và có chú thích tại chỗ; `banHangQuay.caDangMo(locationId)`
tách theo CLB. Không thấy chỗ nào dữ liệu CLB này lọt sang CLB kia.

**Số học đối soát quầy đúng từng đồng.** Mở ca 500.000 ₫, bán 215.000 ₫ tiền mặt
+ 150.000 ₫ chuyển khoản:

| Màn hiện | Kiểm |
|---|---|
| Tiền đầu ca 500.000 ₫ | ✓ |
| Tiền mặt bán được 215.000 ₫ | ✓ |
| Chuyển khoản (không vào két) 150.000 ₫ | ✓ **không** cộng vào két |
| Tổng doanh thu 365.000 ₫ | = 215 + 150 ✓ |
| Tiền mặt phải có trong két 715.000 ₫ | = 500 + 215 ✓ |

Nhập đếm được 700.000 → hiện **"Thiếu 15.000 ₫."**, ô Ghi chú chuyển thành bắt
buộc ("Lệch két thì phải ghi lý do."), nút Đóng ca xám lại. Đúng cả ba.

#### 🐞 LỖI · Bấm nhanh nút ghi là tạo NHIỀU bản ghi

Bỏ một mặt hàng 50.000 ₫ vào giỏ rồi bấm "Thu" **ba lần thật nhanh**:

```
số giao dịch trước:  2
số giao dịch sau:    5      ← thêm BA
tiền: [215.000, 150.000, 50.000, 50.000, 50.000]
```

Khách trả một lần, sổ quầy có ba. Đây là tiền, và ở quầy thì cảnh này rất thật:
máy chậm, người thu ngân đã quen bấm lại khi màn chưa phản hồi — thói quen mà
chính lỗi "im lặng" ở đợt rà trước còn nuôi thêm.

**Không phải chỗ nào quên `disabled`.** Cả 12 nút ghi đều đã viết
`disabled={… || submitting}` — đúng ý, nhưng **không đủ**: `submitting` là
`mutation.isPending`, mà nó chỉ bật lên SAU khi React vẽ lại. Mọi cú bấm rơi vào
khe giữa "bấm lần đầu" và "vẽ xong" đều đi lọt. Nghĩa là lỗi này có ở **mọi** nút
ghi của dự án, không riêng quầy: ghi phiếu thu hợp đồng, lập hợp đồng, mở ca,
thêm hội viên.

**Đã vá một chỗ cho cả 23 mutation** — `lib/query/motLuot.ts`, bọc ở tầng hook:

```ts
return useMotLuot(useMutation({ … }));
```

⚠ **Khoá tới KHUNG HÌNH KẾ TIẾP, không phải một khoảng thời gian tự đặt.** Khoá
này chỉ có nhiệm vụ che đúng cái khe trước lần vẽ lại; vẽ xong thì
`disabled={submitting}` tiếp quản cho tới khi mutation kết thúc. Khoá lâu hơn là
chặn cả lần bấm lại HỢP LỆ — người dùng bấm "Thu" lần nữa vì lần đầu mất mạng thì
phải cho đi. Có test canh đúng vế đó.

⚠ **KHÔNG phải debounce.** Debounce làm trễ lời gọi ĐẦU TIÊN; ở quầy thì lần bấm
đầu phải đi ngay, chỉ những lần thừa mới bị bỏ. Cũng có test canh — thử biến nó
thành debounce thì đỏ.

**Kiểm lại trên app:** cùng thao tác, bấm **bốn** lần → đúng **một** giao dịch.

#### Test — 5 ca mới

`lib/query/motLuot.interaction.test.tsx`: ba bấm chỉ một bản ghi · bấm lại sau
khung hình thì phải đi · lần đầu không bị hoãn · vẫn là mutation dùng bình thường
· **MỌI `useMutation` đều phải được bọc** (đọc mã nguồn).

Ca cuối cùng khuôn với ca "mọi `useMutation` phải có `onError`" và ca "mọi kho có
`quen()` phải nối vào cửa": thêm mutation mới mà quên bọc thì đường thuận vẫn
chạy đúng, chỉ có sổ sách thừa bản ghi khi người dùng bấm nhanh — và không ai
truy ra được vì sao.

**Bốn lần phá code, lần nào cũng đúng test tương ứng đỏ:** bỏ khoá · khoá vĩnh
viễn không nhả · biến thành debounce · một nhóm quên bọc.

Tổng test **606 → 611**.

> **Ba đợt rà, ba lỗi cùng một họ.** Mutation không báo lỗi · hồ sơ người trước
> sống trong cache · bấm nhanh ghi trùng. Cả ba đều là **thứ không nhìn thấy ở
> đường thuận**: bấm một lần, mạng tốt, một người dùng — mọi thứ đúng. Chúng chỉ
> hiện ra ở đường thứ hai (bị từ chối, đổi tài khoản, bấm vội), mà đường đó không
> ai bấm thử. Đó là lý do cả ba lần vá đều kèm **một ca đọc mã nguồn** bắt buộc
> mọi mutation/kho mới phải đi qua cùng một cửa — hàng rào duy nhất chống việc
> "người sau thêm cái mới rồi quên".

### Đợt rà soát lỗi ✅ — hai lỗi thật, và một lỗi hoá ra chỉ là triệu chứng

Đợt này không thêm tính năng nào: chạy app với mock rồi cố tình dựng những cảnh
mà test chưa với tới. Ra hai lỗi thật, cả hai đều thuộc loại **im lặng** — thứ
không ai báo vì màn không nói gì cả.

#### 🐞 LỖI 1 · 23 mutation ở SÁU nhóm không có nhánh báo lỗi

A3 tìm ra chuyện này ở nhóm Hợp đồng và vá riêng cho nhóm đó. Rà lại thì hoá ra
nó là **hệ thống**: mọi màn chỉ hiện `fieldErrors` (lỗi 400 gắn vào từng ô), nên
tất cả những thứ khác đều rơi vào im lặng —

- **403** không đủ quyền (mock có 12 chỗ trả 403);
- **409** dữ liệu đã đổi ở máy khác — HLV trùng lịch, buổi đã huỷ, buổi đã đầy;
- **404** bản ghi vừa bị người khác xoá;
- **mất mạng**.

**Dựng lại được trên app đang chạy:** mở một buổi tập, bỏ chỗ đang giữ bằng một
lời gọi API khác (giả người dùng thứ hai), rồi bấm "Chốt" trên màn cầm dữ liệu
cũ. Mạng ghi `POST …/chot → 404`; màn hình **không đổi một chữ**: không toast,
không câu lỗi, nút hết mờ. Người ở quầy đọc ra là "bấm mà không có gì xảy ra".

**Đã vá ở tầng dùng chung** — `lib/query/baoLoi.ts`, gắn vào cả 23 mutation
(6 nhóm). Hai nhánh cố ý tách:

| Loại lỗi | Làm gì | Vì sao |
|---|---|---|
| có **fieldErrors** | IM | form đã gắn câu vào đúng ô; toast nữa là nói hai lần và kéo mắt ra khỏi chỗ cần sửa |
| có `detail`/`title` | hiện **nguyên văn** | backend mới là chỗ biết chuyện gì hỏng |
| `ApiError` trống | dịch khoá nó giữ | xem `lib/api/errors.ts` |
| lỗi mạng | câu chung | "Failed to fetch" không phải câu cho người dùng |

> ⚠ **Xét theo `fieldErrors`, KHÔNG theo `isValidation`.** Mock (và .NET) trả cả
> **409 kèm `errors`** — HLV trùng lịch là ca thật — mà `isValidation` chỉ đúng
> với 400. Lấy nhầm điều kiện là ca đó bị báo hai lần. Có test canh.

Kiểm lại đúng cảnh cũ: nay hiện **"Không tìm thấy chỗ."** — câu của backend.

#### 🐞 LỖI 2 · Hồ sơ NGƯỜI TRƯỚC sống trong cache qua lần đổi tài khoản

Nặng hơn lỗi 1, và tìm ra khi đang đi tìm thứ khác.

Ở quầy dùng chung một máy: người trước đăng xuất, người sau đăng nhập **ngay trên
cùng tab**. Backend đổi phiên đúng, nhưng màn hình vẫn là của người trước:

```
/api/auth/me trả  →  Trần Sales · staff · một CLB
thanh trên hiện   →  "Phạm Giám Đốc" · "PĐ" · có ô "Tất cả CLB"
```

**Nhấn F5 thì đúng lại ngay** — chính chỗ đó chỉ mặt thủ phạm.

**Nguyên nhân:** `QueryClient` tạo MỘT LẦN cho mỗi lần gắn (`useState` ở
`app/providers.tsx`), mà đăng xuất rồi đăng nhập đều là điều hướng phía client —
không có lần gắn mới nào. Cache `keys.session` (`staleTime` 5 phút) sống nguyên,
và `useQuery` ưu tiên dữ liệu đã cache hơn `initialData` mà layout server truyền
xuống.

**Hệ quả nặng hơn "hiện nhầm tên":** `useSession()` nuôi `<Can>`, `hasMinRole()`
và phạm vi CLB. Nghĩa là **cả lớp "ẩn nút" chạy trên hồ sơ người trước** — người
sau thấy menu, nút và ô "Tất cả CLB" của cấp cao hơn. Backend vẫn từ chối (đã
thử: 403), nên **không phải lỗ hổng bảo mật**; đúng như quy ước "frontend chỉ ẩn
nút, backend mới giữ luật". Nhưng nó là cùng họ với lỗi thừa hưởng CLB ở A4, chỉ
sâu hơn một tầng — và ở quầy thì người sau thao tác dưới tên người trước trên màn.

**Đã vá** — `lib/query/donPhien.ts`, hai cửa khớp với hai cửa đã có ở A4:

| Cửa | Dọn gì |
|---|---|
| nút Đăng xuất | cache + mọi kho theo người dùng (kể cả ngôn ngữ) |
| màn Đăng nhập mở ra | cache + CLB đang chọn, GIỮ ngôn ngữ — phủ nốt đường hết phiên |

> ⚠ **Xoá SẠCH cache, đừng chỉ xoá riêng khoá `session`.** Mọi thứ trong đó đều
> là dữ liệu của người trước: danh sách hội viên theo CLB của họ, hợp đồng họ
> được xem. Xoá sạch là cách duy nhất không phải nhớ danh sách. Có test canh.

**Kiểm lại trên app:** giám đốc (toàn hệ thống) → đăng xuất → nhân viên bán hàng
đăng nhập trên cùng tab, không F5 → thanh trên hiện đúng `Trần Sales · TS`, ô chọn
CLB chỉ còn `VFL Quận 1`.

#### ✅ Lỗi thứ ba hoá ra chỉ là TRIỆU CHỨNG — và suýt "sửa" nhầm

Trong lúc rà, thấy tài khoản `staff` vẫn hiện "Thêm nhân viên", "Thêm sản phẩm",
"Tạo buổi" — trong khi backend trả 403 cho cả ba. Nhìn thì đúng là lớp "ẩn nút"
bị bỏ sót ở năm màn (chỉ `HopDongScreen` dùng `<Can>`), và định bọc `<Can>` vào
từng nút.

**May là kiểm lại trước khi sửa.** Sau khi vá lỗi 2, chạy lại đúng kịch bản đó:

- menu tự ẩn "Nhân viên" và "Sản phẩm" (`navigation.ts` đọc phiên);
- "Tạo buổi" biến mất khỏi màn Đặt lịch;
- "Thêm hội viên" vẫn còn — đúng, `staff` được phép, backend trả 201.

Tức là lớp "ẩn nút" **vốn đã đúng ở mọi màn**; nó chỉ đang được nuôi bằng hồ sơ
của người trước. Bọc thêm `<Can>` là chữa triệu chứng, và tệ hơn: mỗi lần bọc là
một lần **tự quyết cấp bậc** cho một hành động mà hợp đồng API (mục 5) còn là giả
định — đoán sai thì ẩn mất nút của người ĐÁNG ĐƯỢC dùng, hỏng nặng hơn hiện thừa.

> **Bài học ghi lại:** gặp nhiều triệu chứng cùng lúc thì tìm một nguyên nhân
> chung trước khi vá từng chỗ. Ở đây một lỗi cache giải thích cả ba màn.

#### Một câu hỏi để lại cho đội .NET

Ma trận phân quyền (`lib/auth/capabilities.ts`, hiện trên màn Nhân viên cho người
vận hành đối chiếu) **không có dòng nào cho việc XẾP LỊCH**, trong khi backend
đòi cấp `leader`. Ma trận đã tự ghi nó là "bản sao để hiển thị, không phải nguồn
sự thật", nên **không tự thêm dòng** — thêm là tự quyết chính sách. Khi .NET chốt
danh sách quyền thì bổ sung một lượt.

#### Ba tệp test mới / mở rộng

| Tệp | Ca | Canh gì |
|---|---|---|
| `lib/query/baoLoi.interaction.test.tsx` | 7 | 404/409/403 không im · câu backend nguyên văn · có field thì im (kể cả 409) · dịch khoá · lỗi mạng · theo ngôn ngữ · **MỌI `useMutation` phải có `onError`** (đọc mã nguồn) |
| `components/auth/LogoutButton.interaction.test.tsx` | +1 | cache người trước bị xoá, không chỉ kho trình duyệt |
| `app/dang-nhap/LoginForm.interaction.test.tsx` | +1 | cache cũng hết khi màn đăng nhập mở ra (đường hết phiên) |

Ca đọc mã nguồn là ca đắt nhất: thêm một mutation mới mà quên nhánh lỗi thì không
test nào khác thấy được — đường thuận vẫn chạy đúng, chỉ đường TỪ CHỐI mới im, mà
đường đó thì không ai bấm thử. Cùng khuôn với `khoaDaDung.test.ts` và ca "mọi kho
có `quen()` phải nối vào cửa" của A4.

Kèm một tiện ích nhỏ: `toast.dismissAll()`. Hàng đợi toast sống ở module scope nên
qua được cả lần gắn lại `<Toaster />`; trong test thì toast của ca trước đọng sang
ca sau và làm ca sau đỏ vì lý do chẳng liên quan — đã dính thật một lần.

**Mười lần phá code, lần nào cũng đúng test tương ứng đỏ:** bỏ nhánh báo lỗi của
một nhóm · xét `isValidation` thay cho `fieldErrors` · nuốt câu backend · đưa
thẳng `err.message` lên màn · im với mọi `ApiError` · đăng xuất không xoá cache ·
màn đăng nhập không xoá cache · chỉ xoá riêng khoá `session` · nút Đăng xuất quên
gọi cửa dọn · màn đăng nhập quên gọi cửa dọn.

Tổng test **597 → 606**.

### `packages/xlsx-writer` · Xuất Excel ✅ — gói port thứ ba, và là gói nặng nhất

Mục 8 xếp món này "để sau cùng" vì nó nặng. Nay bảng A hết việc và mọi thứ khác
đều chờ bên ngoài, nên đây là phần lớn nhất còn LÀM ĐƯỢC NGAY.

**Port từ `commercial-console.html` ~3418–3800 (`VXL`).** Giữ nguyên lý do bản cũ
tự viết engine thay vì dùng SheetJS: bản miễn phí **không ghi được màu nền / tô
đậm** khi xuất, mà đó đúng là thứ tệp mẫu của kế toán cần.

#### Chia ba tầng, và đó là khác biệt lớn nhất so với bản cũ

Bản cũ trộn phép dựng XML, đóng gói ZIP và thao tác DOM trong cùng một hàm nên
**không thử được gì**. Nay:

| Tệp | Việc | Test |
|---|---|---|
| `zip.ts` | CRC-32 + đóng gói PKZIP (STORE), trả `Uint8Array` | 12 |
| `xlsx.ts` | tên cột, thoát XML, ngày → serial, dựng workbook | 21 |
| `mau-xml.ts` | `styles.xml` + `theme1.xml` chép NGUYÊN VĂN + bảng `STYLE` | — |
| `taiVe.ts` | dựng `Blob`, tạo thẻ `<a>`, thu hồi URL | (chạm DOM) |

`dungXlsx()` trả BYTE chứ không trả `Blob` — nhờ vậy test được ở node, và về sau
dùng lại được ở phía server nếu cần gửi tệp qua email.

#### Năm cái bẫy, mỗi cái một test

| Bẫy | Vì sao nó âm thầm |
|---|---|
| **Tên cột không phải cơ số 26 thường** | Excel đánh A..Z rồi AA..AZ, không có "chữ số 0". Quên trừ 1 là cột 27 ra "AZ" — chỉ lộ ra ở báo cáo rộng, nơi không ai soi tay hết |
| **Quên thoát ký tự XML** | Tên hội viên có `&` là tệp hỏng HẲN, Excel từ chối mở. Đây là dữ liệu người dùng gõ nên chuyện có thật |
| **Ngày ghi thành chữ** | Excel canh trái, không lọc theo khoảng ngày được, không dùng được hàm ngày. Mốc phải là **1899-12-30** |
| **Tên sheet dài quá 31 ký tự** | Excel TỪ CHỐI MỞ workbook, không phải cắt bớt |
| **`rId` lệch với danh sách sheet** | Cứng hoá `rId2` cho styles thì một sheet vẫn chạy, hai sheet trở lên mới hỏng — lỗi chờ tới lúc có báo cáo nhiều tab |

Cộng thêm bốn bẫy của tầng ZIP: sai biến thể CRC · tràn số 32 bit (thiếu `>>> 0`
là CRC ra số ÂM) · đo độ dài bằng KÝ TỰ thay vì BYTE · offset bảng thư mục cộng
thiếu phần dữ liệu.

#### Mốc ngoài ở đâu cũng có — không so với chính hàm vừa viết

Đây là chỗ dễ viết test tự lừa mình nhất, nên mọi con số then chốt đều lấy từ
ngoài:

| Kiểm gì | Mốc ngoài |
|---|---|
| CRC-32 | giá trị kiểm chuẩn công bố: `"123456789"` → `CBF43926`; và đối chiếu **`zlib.crc32` của Node** trên mọi mẫu, kể cả chữ tiếng Việt |
| Tên cột | `XFD` là cột cuối cùng Excel có (16384) |
| Serial ngày | `2024-01-01` → **45292**, con số Excel hiện khi đổi ô ngày sang định dạng Số |
| Chỉ số style | soi ĐÚNG Ô trong `cellXfs`: ô tiền phải là `numFmtId="164"`, ô ngày `167`, ô điện thoại `49` (Text — không thì Excel ăn mất số 0 đầu) |

#### Kiểm bằng TRÌNH GIẢI NÉN THẬT, không chỉ bằng test của chính mình

Dựng một tệp `.xlsx` thật ra đĩa rồi mở bằng `System.IO.Compression.ZipFile` của
.NET — một bộ đọc ZIP hoàn toàn độc lập:

- **8/8 phần giải nén được**, cỡ khớp;
- **8/8 phần phân tích được thành XML hợp lệ**;
- bảng quan hệ đúng: `rId1`,`rId2` → hai sheet · `rId3` → styles · `rId4` → theme;
- `dimension` ra `A1:E4`, đúng bảng 4 dòng 5 cột;
- chữ tiếng Việt về nguyên vẹn (`Mã HĐ`, `Nguyễn Văn An`);
- **`Công ty A&B <thử>` đọc lại đúng nguyên văn** — chứng minh phép thoát XML
  chạy thông cả chuỗi, chứ không chỉ đúng trong test;
- ngày thành số serial (`46266`) mang style ngày, tiền giữ kiểu số mang style
  tiền — tức là Excel sẽ cộng được cột tiền và lọc được cột ngày.

> ⚠ **Chưa mở bằng chính Excel** — máy không có. Đây là giới hạn của lần kiểm
> này; trước khi giao cho kế toán dùng thật thì mở một tệp bằng Excel là đủ.

#### 🐞 Lôi ra một lỗi HẠ TẦNG TEST: ngưỡng 5 giây mặc định

Chạy cả bộ nhiều lần thì thỉnh thoảng **một** tệp `*.interaction.test.tsx` đỏ với
`Test timed out in 5000ms` — mỗi lần một tệp khác nhau, mà chạy riêng tệp đó thì
luôn xanh. Không phải test sai: máy dự án chạy jsdom chậm gấp 3–5 lần khi bộ nhớ
eo hẹp (cùng họ với ghi chú về worker jsdom), và mấy ca nặng — nhất là ca bấm
trọn 5 bước hợp đồng — chạm đúng ngưỡng mặc định của Vitest.

Đã nâng `testTimeout` lên **15 giây** trong `vitest.config.mts`, kèm lý do tại
chỗ. Chạy lại bốn lượt liên tiếp: xanh cả bốn. **Đừng hạ lại xuống 5 giây** —
triệu chứng rất dễ đổ tại nhầm cho tệp test vừa thêm.

#### Phá code — 12 lần, và hai lần XANH đều giải thích được

**Mười lần đỏ đúng test tương ứng:** sai biến thể CRC · bỏ `>>> 0` · đo độ dài
bằng ký tự · offset cộng thiếu · tên cột quên trừ 1 · quên thoát `&` · sai mốc
ngày · cứng hoá `rId2` · bỏ cắt tên sheet · ghi số thành chữ.

**Lần xanh thứ nhất — ca yếu thật, đã sửa.** Chèn một `<xf>` vào GIỮA bảng style
không làm test đỏ, vì ca cũ chỉ ĐẾM số `<xf>`. Đếm suông thì thêm một cái ở giữa
vẫn qua. Đã đổi sang soi ĐÚNG Ô mà từng tên style trỏ tới; chèn lại thì đỏ.

**Lần xanh thứ hai — đột biến tương đương Ở MÚI GIỜ CỦA ĐỘI.** Đổi `Date.UTC(...)`
thành giờ địa phương vẫn xanh ở múi +07, vì `Math.round` hấp thụ độ lệch dưới nửa
ngày — mà mọi múi giờ trong khoảng ±12h đều nằm dưới ngưỡng đó. Chạy lại đúng bộ
test ấy với `TZ=Pacific/Kiritimati` (+14) thì **ĐỎ**. Vẫn giữ `Date.UTC` vì nó nói
đúng ý (ngày lịch, không phải một thời điểm) và không phụ thuộc vào việc phép làm
tròn còn nằm đó hay không. Đã ghi giới hạn này ngay trong tệp test.

#### CHƯA làm, và vì sao — phần chart

Bản cũ còn dựng `chart1.xml` + `drawing1.xml` (biểu đồ cột thật, không phải ảnh)
cho tệp "Mẫu Chuẩn hóa Dữ liệu Schema v2.3". **Chưa port**, có chủ ý: màn dùng nó
— trung tâm báo cáo — thuộc Phase sau và CHƯA DỰNG. Port một bộ sinh biểu đồ cho
màn chưa tồn tại là đoán mò hình dạng dữ liệu, và không có gì để kiểm.

Phần nền đã sẵn sàng: thêm chart chỉ là thêm hai phần vào danh sách tệp và một
quan hệ `drawing` ở sheet — chỗ nối đã có, xem `dungXlsx()`.

Tổng test **564 → 597**.

### A3 · Test tương tác cho `HopDongScreen` ✅ — bấm trọn 5 bước, và lôi ra một lỗi thật

Món cuối của bảng A, và là màn nặng nhất: nó nối máy trạng thái (`hop-dong.ts`),
bốn hook ghi, hai ngăn kéo, hộp xác nhận và khung ký. Từng mảnh đã có test riêng
— `hop-dong.test.ts` phủ luật chuyển tiếp, `ThuTienForm.interaction.test.tsx` phủ
ô nhập tiền, `StepHopDong.test.tsx` phủ thanh 5 bước. **Thứ chưa ai canh là phần
NỐI chúng lại**: bấm một nút có gọi đúng endpoint với đúng thân không, backend
trả hợp đồng mới thì màn có vẽ lại theo không, hộp xác nhận có chặn đúng chỗ
không.

#### 🐞 LỖI THẬT: backend từ chối mà màn KHÔNG NÓI GÌ

Bốn mutation của nhóm Hợp đồng **không có nhánh `onError`**. Backend trả 409 khi
trạng thái đã đổi ở máy khác — chuyện được chờ đợi, `api.ts` ghi hẳn ra — vậy mà
màn im: hộp xác nhận đứng nguyên, nút hết mờ, không một câu nào. Người ở quầy đọc
ra là **"bấm mà không có gì xảy ra"** nên bấm tiếp.

Đây đúng loại lỗi mà chỉ test tương tác mới lôi ra được: test hàm thuần không có
backend để mà từ chối, còn test render không bấm.

**Đã vá — `useBaoLoi()` dùng chung cho cả bốn mutation, hai nhánh cố ý tách:**

| Loại lỗi | Làm gì | Vì sao |
|---|---|---|
| 400 kèm field (`isValidation`) | **IM** | form đã gắn câu lỗi vào đúng ô; toast nữa là nói hai lần và che mất chỗ cần sửa |
| Có `detail`/`title` từ backend | hiện **NGUYÊN VĂN** | backend mới là chỗ biết chuyện gì hỏng |
| `ApiError` không câu nào | dịch khoá nó mang theo (`loi.maSo`) | xem lượt `components` |
| Lỗi mạng | một câu chung (`loi.khongLuuDuoc`) | "Failed to fetch" không phải câu cho người dùng |

#### Máy chủ giả phải CÓ TRẠNG THÁI, không phải bảng câu trả lời cố định

Trả cùng một hợp đồng cho mọi lần gọi là test đi hết 5 bước mà **không chứng minh
được gì**: màn sẽ "đúng" kể cả khi nó gửi sai bước. Máy chủ giả ở đây tự áp
chuyển tiếp như backend .NET sẽ làm, nên màn gửi sai `den` thì bước sau lệch và
test đỏ.

Khuôn giả `next/navigation` chép từ `LogoutButton.interaction.test.tsx` (lượt A4);
`@/lib/api` thay bằng `importActual` + đè `api`, **giữ nguyên lớp `ApiError` thật**
vì màn đọc `err.fieldErrors`.

> ⚠ **`<Toaster />` phải có trong khung dựng test.** Bản thật đặt nó ở
> `app/layout.tsx`; thiếu nó thì mọi câu báo lỗi rơi vào hư không và test tưởng
> màn im lặng — đúng lúc đang đi tìm chuyện màn có im lặng hay không.

> ⚠ **ĐỪNG ĐẾM SỐ DIALOG để biết hộp xác nhận đã mở chưa.** Radix gắn
> `aria-hidden` lên phần còn lại khi một modal mở chồng lên, mà `getAllByRole`
> bỏ qua thứ bị ẩn — nên số dialog "nhìn thấy được" LUÔN bằng 1, mở hay chưa
> cũng vậy. Nhận ra hộp xác nhận bằng ô ghi chú `#hd-ghi-chu`, thứ chỉ nó mới có,
> và tra ngăn kéo thẳng bằng `querySelectorAll` chứ không qua vai trò.

#### Sáu ca

| Ca | Canh gì |
|---|---|
| Trọn 5 bước | báo giá → chốt bán → thu đủ → xác minh → phát hành → ký giấy → hiệu lực, rồi soi lại **thứ tự thân request** |
| Chưa thu đủ | thu một nửa thì nút đi tiếp phải KHOÁ, và không lời gọi nào đi ra |
| Huỷ không lý do | hộp thoại ở nguyên, `daNhan` rỗng; điền lý do rồi mới gửi kèm `ghiChu` |
| Ký trên màn | ký thật vào khung → lưu → **ảnh chỉ đi kèm bước `da-ky`**, bước `dang-hieu-luc` sau đó phải sạch |
| Bước báo giá | chỉ hiện "Chốt bán", không hiện nút của bước xa hơn |
| Backend trả 409 | màn KHÔNG tự nhảy bước, và **phải hiện câu của backend** |

#### Phá code — và ba lần XANH đầu tiên đều dạy được một điều

Đợt đầu 6 lần phá thì **3 lần test vẫn xanh**. Cả ba đều đáng ghi lại, vì mỗi lần
là một loại khác nhau:

**1 · Ca yếu thật — đã sửa.** "Ảnh chữ ký chỉ đi kèm bước ký": kiểm ở ba bước
TRƯỚC bước ký thì không chứng minh được gì, vì lúc đó **chưa có chữ ký nào tồn
tại** nên thân request rỗng dù mã có sai. Phải đi thêm bước **SAU** bước ký mới
phân biệt được. Đã thêm bước "Kích hoạt" vào ca đó.

**2 · Đột biến tương đương — không sửa, ghi lại.** Ngay cả sau khi sửa, bỏ riêng
điều kiện `den === 'da-ky'` vẫn xanh. Lý do: chữ ký được đặt lại ở **ba** chỗ độc
lập (`moXacNhan` đặt lại mỗi lần mở hộp, `onSuccess` xoá sau khi gửi, và chính
điều kiện đó). Phá cả ba cùng lúc thì ca test đỏ — nên khẳng định KHÔNG rỗng, chỉ
là mỗi lớp một mình đều đủ. **Đừng gỡ lớp nào với lý do "thừa"**, cùng bài học đã
ghi ở `docDaLuu()` của kho ngôn ngữ.

**3 · Đúng tầng, sai chỗ tìm.** Mở thêm cạnh nhảy cóc `bao-gia → da-phat-hanh`
trong `CHUYEN_TIEP` không làm test màn đỏ, vì `buocKeTiep()` dùng `.find()` nên
nút chính không đổi. Kiểm lại thì **`hop-dong.test.ts` bắt được ngay** — luật của
bảng chuyển tiếp thuộc về test hàm thuần, không phải test màn. Hai tầng chia việc
đúng như thiết kế; không nhồi luật xuống tầng UI.

**Bảy lần phá còn lại đều đúng test tương ứng đỏ:** bỏ chặn "huỷ phải có lý do" ·
bỏ luật "chưa thu đủ thì không đi tiếp" · bỏ `onError` của mutation chuyển bước ·
nhánh báo lỗi nuốt câu của backend · ký xong không gửi ảnh đi · phá cả ba lớp giữ
chữ ký · (và ca 1 sau khi sửa).

#### Đã kiểm chứng trên app đang chạy — dựng đúng cảnh 409

Không đợi may rủi: mở ngăn chi tiết HD0001, rồi **gọi thẳng API chuyển bước** để
giả cảnh "máy khác vừa chốt bán", sau đó bấm "Chốt bán" trên màn đang cầm dữ liệu
cũ.

- Trước lượt này: không có gì xảy ra, không câu nào.
- Nay: toast **"Không chuyển được từ cho-thu-tien sang cho-thu-tien."** (câu của
  mock, hiện nguyên văn) và hộp xác nhận **ở nguyên** để người dùng thấy có
  chuyện.

> ⚠ Câu 409 của **mock** ghi mã trạng thái thô (`cho-thu-tien`) chứ không phải
> nhãn. Đó là chữ của mock, không phải của frontend — nhưng khi đội .NET viết câu
> thật thì nên nhắc họ dùng nhãn người đọc được, vì frontend cố ý hiện nguyên văn.

Tổng test **558 → 564**, tệp interaction **10 → 11**.

### Bước 14 · Chuẩn bị chuyển đổi ✅ (phần vận hành còn chờ backend)

- **`TRIEN-KHAI.md`** — sổ tay ngày mở: biến môi trường, kiểm tra trước khi mở,
  cách diễn tập bằng mock, theo dõi gì trong ngày đầu, đường lùi, và những chỗ
  còn thiếu mà người vận hành phải biết trước (chữ ký tay, in phiếu, 12b).
- **`npm run kiem-tra`** — `tsc --noEmit` → `eslint .` → `next build`,
  tuần tự, đỏ ở đâu dừng ở đó.
- **`GET /api/suc-khoe`** — 4 test. Không cần đăng nhập, trả lời đúng một câu
  hỏi: web có gọi được .NET không. Gọi `/auth/me` KHÔNG kèm token nên
  `backendStatus: 401` là bình thường (backend sống và đang kiểm xác thực); chỉ
  lỗi mạng / quá 2 giây mới là chết. **Không lộ `DOTNET_API_URL`, không trả
  nguyên văn lỗi mạng** — có test khẳng định, vì endpoint này ai gọi cũng được.
- **`npm run mock`** — mock .NET đã chuyển từ thư mục tạm vào `tools/`, xem mục 6.3.
- **`/thu-nghiem` ĐÃ XOÁ khi bàn giao** (mục 0a) — trang thử bộ component
  (Bước 3) trước đây trả 404 khi `NODE_ENV=production` vì có nút gây lỗi cố ý
  để thử `ErrorBoundary`. Khi designer giao bộ layout mới, dựng lại một trang
  tương tự là việc vài chục phút.
- **Test render cho các màn có logic lúc vẽ** — xem bảng ở phần "Dọn nợ" bên trên.

⚠ **Bản thật phải chạy HTTPS**: cookie phiên bật cờ `secure` khi
`NODE_ENV=production`; chạy HTTP thì trình duyệt bỏ cookie và không ai đăng nhập
được.

---

### Giám sát ca quầy ✅ — và vì sao phải dựng lại ngay sau bản đầu

**Vấn đề người vận hành nêu:** bán vé ngày tại quầy chưa có cơ chế giám sát ca,
và giao dịch không có chỗ nào để đối chiếu. Đúng như vậy: `caDangMo()` chỉ trả
ca của CHÍNH người đang đăng nhập, ca đóng xong là frontend không còn đường nào
lấy lại, và không màn nào nhìn được ca của người khác.

> ⚠ **Chỗ lưu trữ là việc của đội .NET.** Frontend làm ba phần: chốt hợp đồng API
> mà backend phải trả (mục 5), mock diễn tập đủ dữ liệu, và toàn bộ màn giám sát
> chạy thật trên đó. Không bàn schema — đúng phạm vi ở mục 1.

#### Bản đầu — và cái nó bỏ sót

Bản đầu coi "ca" là một phiên thu ngân tuỳ ý: mở lúc nào cũng được, và mỗi ca
được đối soát RIÊNG LẺ. Dựng xong mới biết **lễ tân chia 2 ca một ngày, có nơi
3 ca**, nối tiếp nhau trên cùng một két. Mô hình cũ mù đúng ba thứ mà chỉ
ca-nối-ca mới sinh ra:

| Bỏ sót | Vì sao nguy hiểm |
|---|---|
| **BÀN GIAO** — tiền đếm cuối ca sáng phải bằng tiền đầu ca chiều | Đây là lỗ hổng lớn nhất. Ca sáng khớp két của nó, ca chiều khớp két của nó, **không ca nào "sai"** — mà tiền vẫn hụt ở khớp nối. Đối soát từng ca riêng lẻ KHÔNG BAO GIỜ nhìn thấy |
| **KHOẢNG TRỐNG** — cả ca chiều không ai mở ca | Két vẫn có tiền, khách vẫn mua vé, không ai chịu trách nhiệm. Bảng chỉ liệt kê ca ĐÃ CÓ nên khoảng trống là vô hình |
| **CHỒNG LẤN** — hai thu ngân cùng mở ca trên một két | Tiền của người này rơi vào đối soát của người kia |

#### Bản dựng lại — `khungCa.ts`, hàm thuần, 28 test

Khung ca chuẩn là DỮ LIỆU, không phải logic rải rác: `KHUNG_2_CA` (sáng
06:00–14:00 · chiều 14:00–22:00) và `KHUNG_3_CA` (thêm đêm 22:00–06:00). Màn cho
chuyển 2 ca ↔ 3 ca để đối chiếu.

> ⚠ **GIỜ TRONG KHUNG LÀ GIẢ ĐỊNH — cần vận hành chốt.** Sai giờ thì ca xếp nhầm
> khung và bảng "khung trống" báo sai. Sửa một chỗ: `features/ban-hang-quay/khungCa.ts`.

Bốn cái bẫy đã có test, mỗi cái phá code để kiểm chứng test đỏ đúng chỗ:

1. **Khung vắt qua nửa đêm** (22:00 → 06:00) phải xét bằng HOẶC và độ dài phải
   cộng bù 24 giờ. Trừ thẳng ra −960 phút → ca đêm luôn "chạy quá khung".
2. **Ngày làm việc ≠ ngày trên lịch.** Ca đêm mở 23:00 ngày 04 và người mở 01:00
   ngày 05 là CÙNG một ca của ngày 04. Lấy ngày lịch là chuỗi bàn giao đứt đôi.
3. **Lệch bàn giao KHÔNG CÓ NGƯỠNG.** Lệch két vài nghìn còn có thể do trả tiền
   thừa; tiền đầu ca sau khác tiền cuối ca trước thì luôn nghĩa là đếm sai hoặc
   ai đó cầm đi. Đặt ngưỡng ở đây là mở đúng một khe vừa đủ để rút đều đặn.
4. **Khung CHƯA TỚI GIỜ không phải khung trống.** 8h sáng mà đã kêu "ca chiều
   không ai trực" thì ngày nào cũng báo động, và người vận hành sẽ học cách phớt
   lờ cả bảng.

#### Màn hình — ba cách nhìn cùng một dữ liệu

| Tab | Trả lời câu gì |
|---|---|
| **Theo ngày** (mặc định) | Mạch tiền của CẢ NGÀY tại một CLB: ca sáng → mũi tên bàn giao → ca chiều, khung nào không ai trực thì hiện thành ô gạch chéo đúng vị trí của nó |
| **Ca** | Bảng phẳng để lọc và so nhanh nhiều ca |
| **Sổ giao dịch** | Từng phiếu, **GIỮ CẢ PHIẾU ĐÃ HUỶ** kèm lý do — dấu vết của mẫu gian lận "bấm bán → thu tiền → huỷ phiếu", thứ đối soát tiền mặt không bao giờ thấy |

Dấu hiệu cần chú ý gộp từ HAI TẦNG và khử trùng: tầng ca (lệch két không lý do ·
lệch lớn · huỷ nhiều phiếu) và tầng chuỗi (lệch bàn giao · chồng giờ · chạy quá
khung · ngoài khung).

#### 🐞 Một lỗi thật do test tương tác lôi ra

Bộ lọc "chỉ ca cần chú ý" ban đầu chỉ xét dấu hiệu TẦNG CA, nên nó **giấu mất
đúng ca lệch bàn giao** — ca ấy tự nó khớp két hoàn hảo. Cái nút "chỉ hiện thứ
đáng ngờ" lọc chính xác thứ đáng ngờ nhất ra khỏi màn. Đã sửa: dựng chuỗi TRƯỚC,
lọc SAU, và lọc theo NGÀY chứ không theo ca — cắt một mắt xích giữa chuỗi là
mạch bàn giao đứt và con số lệch mất nghĩa (`giamSat.ts::ngayCanChuY`).

#### Vá kèm — hai lỗ hổng cũ của nhóm Quầy

- **"Lệch két thì phải ghi lý do" từng chỉ nằm trong component.** `types.ts` khai
  nó là quy tắc thiết kế, `DoiSoatCa.tsx` tự tính một biến để chặn nút, còn hàm
  thuần và mock thì không biết gì — gọi thẳng API là đóng được ca lệch mà không
  giải thích một chữ. Mà "lệch không ai giải thích" lại đúng là dấu hiệu màn giám
  sát dựa vào. Nay luật nằm ở `quay.ts::viSaoKhongDongDuocCa()` có test, và mock
  trả **400** y như backend thật phải làm.
- **Mock ghi giờ bằng `toISOString()`**, tức giờ UTC: mọi mốc lệch 7 tiếng so với
  thứ frontend hiển thị. Vô hại khi chỉ xem danh sách, nhưng với "ca mở quá lâu"
  và khung ca thì ca vừa mở đã bị báo bỏ quên. Đã đổi sang giờ địa phương.

#### Quy mô

`features/ban-hang-quay/` thêm `giamSat.ts` (**32 test**) · `khungCa.ts`
(**28 test**) · `GiamSatCaScreen` + 6 component + **10 test tương tác**. Mock có
7 ca dựng sẵn phủ đúng từng dấu hiệu, kể cả ca "hai bên đều khớp mà tiền vẫn
hụt". Quyền: mục menu từ cấp `leader`, còn **mock trả 403 cho `staff`** — ẩn nút
không phải hàng rào (quy ước 3, mục 4.3).


---

### Mở ca · Chuyển ca · Chốt ngày ✅ — ba cơ chế vận hành

Yêu cầu của người vận hành, và là phần khiến mô hình ca trở nên khép kín: giám
sát chỉ có nghĩa khi dữ liệu nó đọc được sinh ra đúng cách ngay từ đầu.

#### 1 · Mở ca lấy GIỜ THẬT, muộn thì cảnh báo chứ không chặn

Giờ mở ca do server đóng dấu lúc bấm nút; màn không gửi giờ lên và không có ô
nào sửa được. Bấm muộn hơn giờ khung thì **vẫn mở được**, nhưng:

- màn mở ca cảnh báo **trước khi bấm** — "Bạn mở ca muộn 25 phút, hệ thống ghi
  lại độ muộn này";
- thanh trạng thái ca gắn nhãn "Mở muộn 25 phút" suốt phiên, để người nhận ca
  sau và người giám sát đều thấy;
- tờ chốt ngày đếm số ca mở muộn.

> ⚠ **Cố ý KHÔNG chặn.** Không cho mở ca vì tới muộn là đẩy lễ tân vào chỗ bán
> chui không có ca: tiền vào túi, không phiếu, không dấu vết nào. Ghi lại thì
> vừa mở được vừa truy được. Dung sai 15 phút — dưới mức đó không kêu, nếu không
> ngày nào cũng báo động và người ta học cách phớt lờ.

#### 2 · Chuyển ca — MỘT thao tác, và là chỗ bịt lỗ hổng lớn nhất

Ca sáng đối soát xong bấm **"Chốt ca & chuyển sang Ca chiều"**: hệ thống chốt ca
đang chạy rồi mở ngay ca kế tiếp trong cùng một lần gọi.

> ⚠ **`POST /ca/:id/chuyen-ca` KHÔNG nhận `tienDauCa`.** Tiền đầu ca sau LÀ tiền
> đếm của ca trước, do backend gán. Đây chính là chỗ bịt lỗ hổng đã tìm ra ở
> phần Giám sát ca: khi hai con số ấy do hai người gõ độc lập thì tiền bốc hơi ở
> khớp nối mà **không ca nào "sai" cả**. Nối cứng lại thì lệch bàn giao chỉ còn
> sinh ra được khi ai đó mở ca thủ công — và đó là việc phải giải thích.

Hai điều khác đã có test:

- **Chuyển ca kế thừa MỌI luật của đóng ca**, kể cả "lệch thì bắt buộc ghi lý
  do". Thiếu là mở một đường vòng: cứ bấm "Chuyển ca" thay vì "Đóng ca" là thoát
  được yêu cầu giải thích, và số lệch trôi sang ca sau.
- **Ca cuối ngày KHÔNG có nút chuyển ca** — `khungKeTiep()` trả `null` chứ không
  quay vòng về ca sáng. Quay vòng là bấm lúc 22h mở luôn ca sáng, và ngày làm
  việc không bao giờ kết thúc.

Nút **"Đóng ca"** vẫn còn, nhưng nay là lối phụ: đóng mà không bàn giao cho ai —
dùng khi quầy nghỉ. Màn nói rõ khác biệt đó ngay dưới nút.

#### 3 · Chốt ngày — tên gọi và cơ chế

**Tên chọn là "Chốt ngày"** thay vì "Kết ngày": *chốt* là từ nghiệp vụ chuẩn đã
quen (chốt sổ, chốt ca), còn *kết thúc* dễ bị đọc thành "thoát phần mềm". Đổi
tên chỉ là sửa một khoá i18n (`quay.chotNgay.*`).

Cơ chế: tổng kết CẢ NGÀY để nhân viên xác nhận rồi mới khoá ngày lại.

| Tờ tổng kết nói gì | Vì sao phải có |
|---|---|
| Tiền mặt đầu ngày → **cuối ngày phải có** → đếm được | Đi theo CHUỖI: tiền đầu ca đầu tiên + tiền mặt cả ngày. Cộng kỳ vọng của từng ca là tiền đầu ngày bị đếm lại ở mỗi lần bàn giao — sai gần gấp đôi |
| Doanh thu tách theo phương thức | Chỉ tiền mặt mới vào két |
| **Khối "Cần giải trình"** — lệch két, lệch bàn giao, phiếu huỷ, ca mở muộn, ca không ai trực | Người trực quầy ký vào tờ này. Giấu mấy dòng đó đi thì chữ ký thành vô nghĩa. Ngày sạch thì khối này KHÔNG hiện — đừng bắt người ta đọc lướt qua bốn số 0 mới tới nút |

Ba luật, có test và mock chặn y hệt:

1. **Còn ca đang mở thì không chốt** — chốt một con số sẽ đổi ngay sau đó còn tệ
   hơn không chốt, vì nó tạo cảm giác đã xong.
2. **Chốt xong là KHOÁ**: không mở thêm ca cho ngày đó (mock trả 409). Màn nói
   điều này TRƯỚC khi bấm, không phải sau.
3. **Không chốt lại lần hai** — hai bản xác nhận cho một ngày thì không ai biết
   bản nào là thật.

> ⚠ **Chưa chốt với vận hành:** ai được chốt ngày (hiện tại: bất kỳ ai trực
> quầy), và ai được MỞ LẠI một ngày đã chốt khi phát hiện sai — frontend hiện
> chưa có đường mở lại, cố ý, vì đó phải là quyền của quản lý và phải để lại dấu
> vết. Xem mục 7.0.

#### 🐞 Một nhánh code chết, do chính đợt thử răng của test lôi ra

`soPhutMoMuon()` bản đầu có nhánh `tre >= doDaiKhung ? 0 : tre`, tự nhận là
chống "mở sớm bị tính thành muộn 23 tiếng". Phá code để kiểm chứng test thì
**không test nào chết** khi bỏ nhánh ấy — vì nó không bao giờ chạy: khung chứa
thời điểm nào thì khung ấy đã bắt đầu trước thời điểm đó rồi. Đã xoá và ghi lại
lý do ngay tại chỗ. Code chết giả dạng lá chắn còn tệ hơn không có: lần sau đọc
lại sẽ tưởng trường hợp đó đã được xử lý.

#### Quy mô

`chuyenCa.ts` — **25 test**, đã phá code 7 kiểu để kiểm chứng. `ChotNgayPanel`
(**8 test render**) · nút chuyển ca trong `DoiSoatCa` (**7 test tương tác**) ·
cảnh báo mở muộn trong `MoCaForm`. Mock có ba endpoint mới kèm đủ luật chặn, đã
thử bằng tay hết cả bảy đường: chuyển ca đúng · chuyển ca lệch không lý do → 400
· ca cuối ngày → 409 · chốt khi còn ca mở → 409 · chốt hai lần → 409 · mở ca sau
khi chốt → 409 · chốt ngày sạch → 201.


---

### Mốc bảo trì · rà soát toàn dự án 02/09/2026 ✅

Rà soát định kỳ, KHÔNG đụng nghiệp vụ. Sau khi làm, `npm run kiem-tra` vẫn
xanh nguyên: **733/733 test (84 tệp)**, `npm audit` **0 vulnerabilities**,
`npm run i18n-con-lai` vẫn **42 chuỗi** (đúng bộ đã giải trình ở mục 6.2).

**1 · Nâng phụ thuộc — chỉ bản vá và bản nhỏ, không đổi bản lớn.**

| Gói | Từ | Lên | Vì sao |
|---|---|---|---|
| `next` + `eslint-config-next` | 16.3.3 | **16.3.4** | bản vá cùng dòng 16.3 |
| `@tanstack/react-query` | 5.102.6 | **5.102.8** | bản vá |
| `lucide-react` | 1.34.0 | **1.39.0** | bản nhỏ, chỉ thêm icon |

**Cố ý KHÔNG nâng bốn thứ sau** — mỗi thứ là một mốc riêng, làm chung là không
biết cái nào làm vỡ cái gì:

| Gói | Đang | Mới nhất | Vì sao hoãn |
|---|---|---|---|
| `react` / `react-dom` (+ `@types`) | 18.3.1 | 19.2.8 | Quyết định ở mục 2 là GIỮ React 18. Next 16 vẫn nhận `^18.2.0`. React 19 đổi `useRef`, `forwardRef`, hành vi `ref` — phải chạy lại toàn bộ 11 tệp test tương tác |
| `tailwindcss` | 3.4.19 | 4.3.3 | Bản 4 đổi hẳn cách cấu hình (CSS-first, bỏ `tailwind.config.ts`). Toàn bộ token của dự án nằm trong tệp đó — xem Bước 1–2 |
| `typescript` | 5.9.3 | 7.0.2 | Bản lớn; `eslint-config-next` và `@typescript-eslint` phải hỗ trợ trước |
| `eslint` | 9.39.5 | 10.9.1 | `eslint-config-next@16` mới chỉ chốt ESLint 9 |

**2 · `README.md` — thay bản mặc định của `create-next-app`.** Từ đầu dự án
tới giờ nó vẫn là bản sinh sẵn: nói về phông Geist (dự án dùng Inter), về deploy
lên Vercel, không nhắc gì tới mock, tới `npm run kiem-tra`, tới ba quy ước bắt
buộc. Bản mới chỉ tóm tắt và trỏ về **tài liệu này** + `TRIEN-KHAI.md` — mọi
con số vẫn ở một chỗ.

**3 · Xoá hai tệp phông chết.** `src/app/fonts/GeistVF.woff` và
`GeistMonoVF.woff` là rác của `create-next-app`; không tệp nào trong `src`
tham chiếu tới (`layout.tsx` nạp Inter qua `next/font/google`).

**4 · Sửa bốn con số đã lệch trong chính tài liệu này** — quy mô code/test, kích
thước mock, phiên bản Next ở ba chỗ, và câu "không còn `eslint-disable` nào
trong dự án" (thực tế còn hai dòng, cả hai đều chính đáng và đã ghi lý do tại
chỗ). Đo lại bằng lệnh, không đếm bằng trí nhớ:

```bash
find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*.test.*" | xargs wc -l | tail -1
find src -type f -name "*.test.ts*" | xargs wc -l | tail -1
```

**5 · LỖI NẶNG NHẤT TỪNG LỌT LƯỚI — `layout.tsx` mất `<Providers>`.**

Phát hiện khi mở app thật chứ không phải khi chạy `kiem-tra`: mọi trang chết ở
lần vẽ đầu với `No QueryClient set, use QueryClientProvider to set one`, bắt
đầu từ `/dang-nhap` — tức là **không ai vào được hệ thống**.

Nguyên do: `src/app/layout.tsx` bị thay bằng một bản CŨ (thời Bước 1–2) chỉ
còn:

```tsx
<html lang="vi" className={inter.variable}>
  <body>{children}</body>
</html>
```

Mất `<Providers>` (QueryClient + kho ngôn ngữ), mất `<Toaster>`, và `lang`
quay về hằng `"vi"` — xoá luôn thành quả của A5. Không rõ bản cũ quay lại bằng
đường nào; `git status` không giúp được gì vì **cả dự án vẫn chưa có commit nào
ngoài commit khởi tạo** (xem cảnh báo cuối mục này). Đã dựng lại đúng bản đủ.

⚠ **Điều đáng sợ hơn bản thân lỗi: `npm run kiem-tra` VẪN XANH suốt thời gian
đó.** `tsc` không thấy sai kiểu, `eslint` không thấy luật nào vỡ,
`next build` dựng thành công (bản rút gọn vẫn hợp lệ), và **không một test nào
chạm tới khung gốc**. Cổng chất lượng mù đúng chỗ chết người nhất — app hỏng
100% mà bốn công cụ đều báo xanh.

Đã bịt bằng `src/app/layout.test.tsx` — **2 test**, và đã kiểm chứng có "răng"
bằng cách đặt lại đúng bản hỏng: cả hai đỏ đúng lý do (`No QueryClient set` và
`lang="vi"`), rồi khôi phục. Hai ca cố tình khẳng định HÀNH VI chứ không phải
hình dạng HTML:

| Ca | Bắt được gì |
|---|---|
| BẪY 1 | Con của layout render một component gọi `useQueryClient()`. Thiếu `<Providers>` là ném ngay — đúng lỗi người dùng gặp |
| BẪY 2 | Cookie ngôn ngữ `en` thì `<html lang="en">`. Bản ghi cứng `"vi"` là đỏ |

**Bài học cho lần sau:** `kiem-tra` xanh KHÔNG có nghĩa app chạy. Trước khi
bàn giao hay trước ngày mở, vẫn phải mở `/dang-nhap` bằng mắt — đã ghi vào
`TRIEN-KHAI.md` mục 2.

**Ngoài lỗi trên, không tìm thấy lỗi mới.** Hai quy ước kiểm được bằng máy vẫn
đúng: không có `fetch` nào ngoài `lib/api/client.ts` và
`lib/server/dotnet.ts`; không có `@ts-ignore` / `@ts-expect-error` nào
trong `src`. Vùng chưa dò vẫn là vùng đã ghi ở mục 7.0 — **bàn phím / trình
đọc màn hình** và **màn hẹp**; rà soát này không thay cho đợt rà soát thứ tư ấy.

⚠ **RỦI RO LỚN NHẤT CỦA DỰ ÁN LÚC NÀY, không phải kỹ thuật:** git chỉ có đúng
một commit `Initial commit from Create Next App`. Toàn bộ ~23.700 dòng code +
test + tài liệu đang nằm trong working tree chưa lưu. Chính vì thế mà khi
`layout.tsx` mất nội dung, không có bản nào để so hay để phục hồi —
`git diff` chỉ so được với bản `create-next-app`. **Commit đi.**

---

## 4. Kiến trúc & quy ước — PHẢI TUÂN THEO

### 4.1 Khuôn thư mục feature

5 nhóm đã dựng đều theo đúng hình này. **Bước 12 và 13 copy y hệt:**

```
src/features/<tên>/
├── types.ts          kiểu + hằng nhãn tiếng Việt (LABEL / ORDER)
├── <nghiệp-vụ>.ts    ← HÀM THUẦN cho quy tắc nghiệp vụ, có test riêng
├── <nghiệp-vụ>.test.ts
├── api.ts            object `<tên>Api` — NƠI DUY NHẤT biết đường dẫn endpoint
├── api.test.ts       khẳng định từng endpoint gọi đúng path + payload
├── hooks/            useQuery / useMutation, toàn bộ logic gọi API
├── components/       THUẦN TRÌNH BÀY, nhận props, KHÔNG gọi API
├── <Tên>Screen.tsx   container client: wiring hook ↔ component, máy trạng thái panel
└── index.ts          cửa công khai — feature khác chỉ import từ đây
```

Trang đặt ở `app/(app)/<đường-dẫn>/page.tsx` — **server component mỏng**, chỉ
`<PageHeader>` + `<XScreen />`.

### 4.2 Tách hàm thuần cho quy tắc nghiệp vụ — quan trọng nhất

Ba module đã chứng minh giá trị: `san-pham/gia.ts`, `dat-lich/lich.ts`,
`ban-hang-quay/quay.ts` — mỗi cái là một quy tắc tính tiền / xếp lịch viết
thành hàm thuần, không import React, để màn hình chỉ còn việc vẽ.

**Quy tắc bắt buộc:** quy tắc nghiệp vụ mới → **hàm thuần trước, giao diện sau**.
Hàm thuần nằm cạnh nhóm nghiệp vụ (`features/<x>/<ten>.ts`), không import React,
và **không xuất qua `features/<x>/index.ts`** (xem quy tắc 5 ở mục 4.3).

> Bản bàn giao không kèm bộ test (mục 0a). Nếu đội tiếp nhận gắn khung test vào,
> đây là quy trình đã dùng và nên lặp lại:
> 1. Viết test cho từng bẫy, **đặt tên test theo bẫy** (`BẪY 1 — ...`).
> 2. **Kiểm chứng test có "răng"**: cố tình phá code (đổi `<` thành `<=`, xoá
>    dòng `filter`), chạy lại, xác nhận test đỏ, rồi khôi phục.
> 3. Chỗ dính tiền thì đối chiếu với một nguồn NGOÀI (sổ cái, bảng giá), đừng
>    đối chiếu với chính hàm vừa viết.
>
> Ba module trên từng có 19 / 36 / 20 test theo đúng quy trình này, và chính
> bước "phá cho đỏ" đã moi ra hai lỗ hổng thật ở `dat-lich` — mục 3 kể lại.

### 4.3 Bốn quy tắc code

1. **Không `fetch` ngoài** `lib/api/client.ts` (client) và `lib/server/dotnet.ts` (server).
2. **Component trong `components/` không gọi API** — nhận props và render.
3. **Khoá cache khai báo trong `lib/query/keys.ts`.** Sự kiện nghiệp vụ khai trong
   `AFFECTED_BY`, gọi qua `invalidateAffected(qc, 'tênSựKiện')`.
4. **Kiểm tra quyền ở frontend chỉ để ẩn nút.** Bảo mật thật ở backend.
5. **Module hàm thuần KHÔNG import qua `features/<x>/index.ts`** — cửa công khai
   kéo theo màn hình `.tsx`, tức là kéo React vào tầng đáng ra chỉ có phép tính.
   Nhập thẳng module: `@/features/san-pham/gia`,
   `@/features/ban-hang-quay/types`. (Trước Bước 13 đây còn là điều kiện BẮT
   BUỘC vì Vitest chưa dịch được JSX; nay `vitest.config.mts` đã bật
   `oxc: { jsx: 'automatic' }` nên không còn chặn, nhưng quy ước vẫn giữ.)

`AFFECTED_BY` hiện có:
```ts
hoiVienThayDoi   → [hoiVien, tongQuan]
nhanVienThayDoi  → [nhanVien, tongQuan]
sanPhamThayDoi   → [sanPham, khuyenMai, tongQuan]
khuyenMaiThayDoi → [khuyenMai, tongQuan]
datLichThayDoi   → [datLich, tongQuan]
banHopDong       → [hopDong, hoiVien, congNo, tongQuan]   ← Bước 12 dùng
banVeQuay        → [banHangQuay, congNo, tongQuan]
```

### 4.4 Giao diện — ba quy tắc

1. Token theo nghĩa: `bg-brand`, không `bg-cyan-700`.
2. Viết class thẳng vào JSX. Lặp nhiều tệp → bọc component. **Đừng** tạo `.btn`,
   `.card` trong `globals.css`.
3. **Checkbox/radio KHÔNG dùng class `.field`** — `w-full` sẽ kéo thành khung dài.

### 4.5 Ánh xạ class cũ khi bóc màn

| Cũ | Mới |
|---|---|
| `.card` | `<Card>` |
| `.pill`, `.pill.ok/.warn/.bad` | `<Pill tone="…">` |
| `.btn-primary` `.btn-ghost` `.btn-sm` | `<Button variant size>` |
| `.grid2` | `grid grid-cols-1 gap-2.5 md:grid-cols-2` |
| `.row` | `flex flex-wrap items-end gap-2` |
| `.muted` | `text-muted` |
| `.hidden` | render có điều kiện, bỏ hẳn class |
| `.modal` | `<Drawer>` hoặc `<ConfirmDialog>` |
| `.step` `.totals` `.chip` `.ribbon` | bọc component riêng khi bóc màn Hợp đồng |

### 4.6 Cách bóc một màn cũ

Không đọc tuần tự — code cũ trộn markup, logic và gọi dữ liệu trong cùng một hàm.
Bóc ra bốn thứ trước khi viết code:

1. **Cây thành phần** — màn chia thành khối nào, khối nào lồng khối nào
2. **State cục bộ** — bộ lọc, tab, modal đang mở, form đang nhập
3. **Dữ liệu cần** — màn hiển thị trường gì
4. **Hành động** — nút nào làm gì, xác nhận ở đâu, xong thì màn đổi ra sao

---

## 5. Hợp đồng API — GIẢ ĐỊNH, chưa chốt với đội .NET

⚠ **Toàn bộ endpoint dưới đây do frontend tự đặt.** Khi backend chốt, sửa trong
`features/*/api.ts` và `lib/auth/types.ts` — không chỗ nào khác.

Client gọi `/api/*` của Next; proxy `app/api/[...path]` chuyển thẳng sang .NET
kèm `Authorization: Bearer`.

```
POST   /auth/login            {email,password} → {accessToken,refreshToken,expiresIn,user}
POST   /auth/refresh          {refreshToken}   → như trên
POST   /auth/logout           {refreshToken}
GET    /auth/me                                → UserProfile

GET    /hoi-vien              ?page&pageSize&search&trangThai&locationId → Paged<HoiVien>
GET    /hoi-vien/:id
POST   /hoi-vien
PUT    /hoi-vien/:id
PATCH  /hoi-vien/:id/trang-thai      {trangThai}

GET    /nhan-vien             ?page&pageSize&search&vaiTro&trangThai&locationId
GET    /nhan-vien/:id
POST   /nhan-vien
PUT    /nhan-vien/:id
PATCH  /nhan-vien/:id/vai-tro        {vaiTro, allLocations}
PATCH  /nhan-vien/:id/trang-thai     {trangThai}

GET    /san-pham              ?page&pageSize&search&loai&trangThai&locationId
GET    /san-pham/:id
POST   /san-pham
PUT    /san-pham/:id
PATCH  /san-pham/:id/gia-san         {giaSan}      ← chỉ director+, backend PHẢI kiểm
PATCH  /san-pham/:id/trang-thai      {trangThai}
GET    /khuyen-mai
POST   /khuyen-mai
PUT    /khuyen-mai/:id
PATCH  /khuyen-mai/:id/kich-hoat     {kichHoat}

GET    /dat-lich/tuan         ?tuNgay&locationId&loai&hlvId → Buoi[]
GET    /dat-lich/hlv/:hlvId   ?tuNgay  → KhoangBuoi[]  ← MỌI CLB, không lọc theo CLB
GET    /dat-lich/huan-luyen-vien ?locationId
GET    /dat-lich/buoi/:id
POST   /dat-lich/buoi                ← backend PHẢI trả 409 khi trùng lịch HLV
PUT    /dat-lich/buoi/:id
PATCH  /dat-lich/buoi/:id/huy
POST   /dat-lich/buoi/:id/giu-cho    {hoiVienId}
POST   /dat-lich/buoi/:id/cho/:choId/chot
DELETE /dat-lich/buoi/:id/cho/:choId
POST   /dat-lich/buoi/:id/hang-cho   {hoiVienId}
DELETE /dat-lich/buoi/:id/hang-cho/:choDoiId

GET    /ban-hang-quay/ca-dang-mo     ?locationId → CaThuNgan | null
POST   /ban-hang-quay/ca             {locationId,tienDauCa}
POST   /ban-hang-quay/ca/:id/dong    {tienDemCuoiCa,ghiChu}
GET    /ban-hang-quay/hang           ?locationId
POST   /ban-hang-quay/ca/:id/giao-dich          {dong[],phuongThuc,khachTen?,khachSdt?}
PATCH  /ban-hang-quay/ca/:id/giao-dich/:gdId/huy {lyDo}

GIÁM SÁT CA — MỚI, và là phần GIẢ ĐỊNH NHẤT của cả mục 5:
GET    /ban-hang-quay/ca             ?tuNgay&denNgay&locationId&thuNganId&trangThai
                                     → CaThuNgan[]  (KÈM `giaoDich` từng ca)
GET    /ban-hang-quay/ca/:id         → CaThuNgan

CHUYỂN CA & CHỐT NGÀY — MỚI:
POST   /ban-hang-quay/ca/:id/chuyen-ca  {tienDemCuoiCa,ghiChu?}
                                        → {caDaDong, caMoi}   ⚠ KHÔNG có tienDauCa
GET    /ban-hang-quay/ngay           ?ngay&locationId
                                     → {ngay, locationId, ca[], chotNgay|null}
POST   /ban-hang-quay/chot-ngay      {ngay,locationId,ghiChu?} → ChotNgay
```

**Bốn luật của ba endpoint trên, backend PHẢI tự giữ** (mock đã chặn y hệt, đã
thử bằng tay cả bảy đường — xem mục 3):

| Luật | Mã trả về |
|---|---|
| **`chuyen-ca` gán `tienDauCa` của ca mới = `tienDemCuoiCa` của ca cũ** — không nhận từ client | — (đây là hình dạng endpoint, không phải lỗi) |
| `chuyen-ca` khi lệch két mà `ghiChu` rỗng | 400 + `errors.ghiChu` |
| `chuyen-ca` ở ca CUỐI ngày (không còn khung sau) | 409 |
| Chốt ngày khi còn ca đang mở · chốt lần hai · mở ca mới sau khi ngày đã chốt | 409 |

⚠ **`chuyen-ca` phải NGUYÊN TỬ**: đóng được mà mở hỏng là quầy đứng hình giữa
ca — không ca nào đang chạy, mà tiền thì đã bàn giao trên giấy.

⚠ **`GET /ngay` cho THU NGÂN gọi** (khác `GET /ca` cần cấp `leader`): họ phải
nhìn được cả chuỗi bàn giao của CLB mình mới xác nhận nổi tờ chốt ngày, kể cả ca
của người trực ca kia. Vẫn cắt theo CLB được giao.

**Bốn điều đội .NET phải chốt cho hai endpoint giám sát** (frontend đã dựng xong
màn và mock diễn tập theo đúng giả định này, xem mục 3):

| Điểm | Frontend đang giả định | Vì sao quan trọng |
|---|---|---|
| **Trả kèm `giaoDich`** | `GET /ca` trả mỗi ca kèm TOÀN BỘ giao dịch của nó | Đối soát tính TỪ giao dịch, không tin số tổng backend gửi kèm. Hai đường tính độc lập ra hai số khác nhau nghĩa là có chỗ sai — `giamSat.test.ts` canh đúng điều đó. Nếu số ca một ngày lớn thì bàn phân trang, ĐỪNG bỏ `giaoDich` |
| **Quyền chặn ở backend** | `staff` gọi vào → **403**, không phải danh sách rỗng | Danh sách rỗng nói dối: người xem tưởng "hôm nay không có ca nào". Mock đã trả 403 đúng như vậy |
| **Cắt theo CLB được giao** | Người không có cờ toàn hệ thống chỉ nhận ca của CLB mình, kể cả khi tự sửa `locationId` trên URL | Ô chọn CLB ở frontend chỉ là tiện lợi |
| **Lọc theo NGÀY MỞ ca** | Khoảng ngày áp lên `moLuc`, không phải `dongLuc` | Ca đêm mở 22h hôm trước, đóng 2h sáng hôm sau vẫn thuộc về ngày MỞ — đúng như cách thu ngân giao ca. Lọc theo giờ đóng là hai ngày cùng sai |
| **Khung ca chuẩn** | Frontend đang giữ khung giờ (2 ca / 3 ca) như HẰNG SỐ trong `khungCa.ts` | Nếu mỗi CLB một khung khác nhau thì khung phải theo `Location` từ backend, không thể là hằng ở frontend. Hỏi sớm — đổi sau là đổi cả cách gom ngày |

Và một luật cũ nay đã BẬT ở cả hàm thuần lẫn mock, backend thật phải làm y vậy:

```
POST /ban-hang-quay/ca/:id/dong   → 400 nếu tienDemCuoiCa ≠ kỳ vọng mà ghiChu rỗng
                                    errors: { ghiChu: [...] }
```

Phần còn lại của hợp đồng API — Hợp đồng và Dashboard:

```
GET    /hop-dong             ?page&pageSize&search&trangThai&locationId → Paged<HopDong>
GET    /hop-dong/:id
POST   /hop-dong                     {hoiVienId,locationId,dong[],khuyenMai?,ngayBatDau?,ngayKetThuc?,ghiChu?}
PUT    /hop-dong/:id                 ← chỉ khi còn 'bao-gia', backend PHẢI kiểm
POST   /hop-dong/:id/chuyen-trang-thai  {den,ghiChu?,chuKy?}  ← MỘT cửa cho mọi bước
POST   /hop-dong/:id/thanh-toan      {soTien,phuongThuc,ghiChu?} → HopDong đã cập nhật

GET    /tong-quan/tom-tat     ?tuNgay&denNgay&locationId → TomTatTongQuan
GET    /tong-quan/doanh-thu   ?tuNgay&denNgay&locationId → DiemDoanhThu[]  ← được trả THƯA
GET    /tong-quan/top-san-pham ?tuNgay&denNgay&locationId&gioiHan
GET    /tong-quan/hom-nay     ?locationId → HomNay
```

**Backend PHẢI tự kiểm bốn luật của hợp đồng** (frontend chỉ chặn sớm):

| Vi phạm | Mã trả về |
|---|---|
| Chuyển trạng thái không có trong bảng `CHUYEN_TIEP` | 409 |
| Phát hành / gửi xác minh khi chưa thu đủ | 409 |
| **Người lập tự xác minh hợp đồng của mình** (tách nhiệm) | 403 |
| Dòng bán dưới giá sàn · thu quá số còn phải thu | 400 + `errors` |
| **`chuKy` không phải `data:image/png;base64,…`** (đường dẫn, SVG) | 400 + `errors` |
| **`chuKy` gửi kèm ở bước khác `da-ky`** | 400 + `errors` |

Không có endpoint "so sánh hai kỳ" cho Dashboard: frontend gọi `/tong-quan/tom-tat`
hai lần (kỳ này và kỳ trước cùng độ dài) rồi tự so.

**Lỗi:** mọi 4xx trả ProblemDetails (RFC 7807). Lỗi field đặt trong
`errors: { tenField: ["thông điệp"] }` — `ApiError.fieldErrors` sẽ tự gắn vào ô
nhập tương ứng.

**`UserProfile`:**
```ts
{ id, fullName, email, role, locations: Location[], allLocations: boolean }
```

**`Location` mang theo tài khoản nhận chuyển khoản** — mới, backend .NET phải trả:
```ts
{ id, name, shortName?, taiKhoanNhanTien?: { bin, soTaiKhoan, tenChuTaiKhoan } }
```
`bin` là mã 6 chữ số của NAPAS. Thiếu trường này thì màn thu tiền không hiện mã
QR và nói rõ "CLB này chưa cấu hình tài khoản" — không rơi về tài khoản nào khác.
Đây là thay đổi CÓ CHỦ Ý so với hệ cũ (mỗi máy tự lưu trong `localStorage`); xem
mục 3.

---

## 6. Nợ kỹ thuật & việc chưa làm

### 6.1 Không dùng shadcn/ui — khác v1

v1 chốt dùng `npx shadcn@latest add …`. **Thực tế đã không dùng**, lý do: class
của shadcn giả định hệ CSS-var riêng (`bg-background`, `text-foreground`) không
khớp bộ token theo nghĩa của dự án; thêm vào sẽ tạo **hệ style thứ hai**.

Giá trị thật của shadcn là ARIA của Radix — đã lấy trực tiếp:
`@radix-ui/react-dialog` → `Drawer` + `ConfirmDialog`.

**Cân nhắc lại nếu Bước 12/13 cần** `command`, `calendar`, `popover` — lúc đó
copy code shadcn rồi **thay class sang token của dự án**, đừng lấy nguyên.

### 6.2 Chưa làm

| Việc | Ghi chú |
|---|---|
| ~~**i18n**~~ | ✅ **XONG** (mục 3). Công cụ còn báo **11 chuỗi**, đều là câu cho lập trình viên hoặc mã định dạng (31 chuỗi của trang thử `thu-nghiem` đã đi cùng trang đó khi bàn giao — mục 0a). Đo bằng `npm run i18n-con-lai`. |
| **`packages/`** | ✅ `signature-pad`, `vietqr` và `xlsx-writer` xong. Còn `cccd-scan` (cần chốt việc thêm phụ thuộc lúc chạy) và `gsheets` (cần Google client ID của vận hành). Xem mục 8. |
| **~~Mã QR ở quầy bán vé~~** | ✅ Đã gắn. Nội dung chuyển khoản là mã CA — xem lưu ý ở mục 3. |
| **~~Mutation không có nhánh báo lỗi~~** | ✅ Đã vá ở tầng dùng chung `lib/query/baoLoi.ts` cho cả 23 mutation (mục 3). Trước đó 403/409/404/mất mạng đều im lặng. |
| **~~Hồ sơ người trước sống trong cache~~** | ✅ Đã vá — `lib/query/donPhien.ts` xoá cache ở cả hai cửa đăng xuất / đăng nhập (mục 3). Trước đó đổi tài khoản trên cùng tab là màn giữ tên và quyền của người trước tới khi F5. |
| **Ma trận phân quyền thiếu dòng XẾP LỊCH** | `lib/auth/capabilities.ts` không có mục nào cho việc xếp lịch, trong khi backend đòi cấp `leader`. Ma trận tự ghi nó là "bản sao để hiển thị"; **không tự thêm dòng** — chờ .NET chốt danh sách quyền rồi bổ sung một lượt. Xem mục 3. |
| **~~Bấm nhanh nút ghi tạo bản ghi trùng~~** | ✅ Đã vá — `lib/query/motLuot.ts` bọc cả 23 mutation (mục 3). Trước đó bấm "Thu" ba lần ở quầy là ba giao dịch cho một lần khách trả tiền. |
| **~~Đổi CLB khi đang ở trang 2 làm mất danh sách~~** | ✅ Đã vá — `lib/hooks/useTrangTheoPhamVi.ts` cho cả bốn màn phân trang (mục 3). Trước đó màn báo "không khớp bộ lọc" oan và không có đường quay lại trang 1. |
| **So sánh của "Tháng này"** | Kỳ trước = "cùng số ngày liền trước" (02/09 so với 30–31/08). Nhãn "so với kỳ trước" không sai, nhưng nếu vận hành muốn so **cùng kỳ tháng trước** thì đó là đổi ý sản phẩm — cần người quyết. Xem mục 3. |
| **Chữ ký Bên A** | Hội viên (Bên B) ký được rồi. Chữ ký đại diện CLB/CEO ở hệ cũ lấy từ cấu hình thương hiệu của CLB — phần cấu hình đó chưa port. |
| **~~Test tương tác~~** | ✅ Đã đủ — 11 tệp, 83 ca, **kể cả bấm trọn 5 bước hợp đồng qua `HopDongScreen`** (mục 3). Quy ước giữ nguyên: chỉ viết test render cho component CÓ LOGIC LÚC VẼ; component chỉ xếp chữ thì đừng viết cho có. |
| **~~`quen()` chưa nối vào Đăng xuất~~** | ✅ Hai cửa ở `lib/storage/quenPhien.ts` (mục 3): nút Đăng xuất dọn cả CLB lẫn ngôn ngữ TRƯỚC lời gọi mạng; màn đăng nhập dọn CLB, phủ nốt đường hết phiên `/api/auth/thoat`. Luật: CLB không sống sót qua trang đăng nhập, ngôn ngữ chỉ dừng ở lần đăng xuất có chủ ý. |
| **~~Advisory~~** | ✅ Hết. Next 16.3.4 → `npm audit` báo **0 vulnerabilities**. |
| **In phiếu / biên lai** | Quầy chưa có. Cần chốt khổ giấy máy in nhiệt trước. |
| **~~`LocationProvider` tắt luật lint~~** | ✅ Đã chuyển sang `useSyncExternalStore`. Cả dự án còn đúng HAI dòng `eslint-disable`, cả hai có lý do ghi ngay tại chỗ: `LoginForm.tsx` (`exhaustive-deps` — đưa `donPhien` vào phụ thuộc là xoá cache sau mỗi lần gõ phím) và `HopDongDetail.tsx` (`no-img-element` — ảnh chữ ký là data URL, `next/image` không tối ưu được). Xem mục 3. |

### 6.3 Mock backend — ĐÃ NẰM TRONG REPO

```bash
npm run mock     # tools/mock-dotnet.mjs, cổng 5099
```

Node thuần, không phụ thuộc, ~1.210 dòng. Trước đây mock nằm trong thư mục tạm của
phiên chat nên mất sau mỗi lần; nay đã chuyển vào `tools/` để mọi người dùng
chung.

Phủ **ĐỦ MỌI MÀN** của mục 5: auth · hội viên · sản phẩm + khuyến mãi · hợp đồng
· tổng quan · bán vé ngày tại quầy · nhân viên · đặt lịch. Không còn màn nào chưa
diễn tập được — việc A2 của bảng 7.0 đã hết.

Ba phần cuối (nhân viên, sản phẩm, đặt lịch) đều bổ sung **xen vào lúc chuyển
i18n cho nhóm tương ứng**, vì chuyển xong mà không mở màn lên bấm thì không kiểm
được bản dịch bằng mắt. Cách đó cũng lôi ra một khiếm khuyết có sẵn: mock chỉ có
danh sách nên ngăn chi tiết của Hội viên và Sản phẩm LUÔN trả 404 — không ai để ý
vì trước đó chưa có việc gì bắt phải mở nó ra.

Phần Đặt lịch tự kiểm đúng những luật mà `lich.ts` chỉ CẢNH BÁO sớm ở frontend:
HLV trùng lịch → 409, giờ kết thúc không sau giờ bắt đầu → 400, PT mà sức chứa
khác 1 → 400, đặt chỗ khi buổi huỷ / đã đầy → 409. Dữ liệu mẫu sinh theo **tuần
chứa hôm nay** nên mở màn lên là thấy buổi ngay, và HLV lấy thẳng từ `NHAN_VIEN`
để hai màn khớp nhau thay vì bịa một danh sách riêng.

Phần chi tiết/thêm/sửa/giá sàn của sản phẩm và phần thêm/sửa/bật-tắt khuyến mãi
bổ sung lúc chuyển i18n cho nhóm Sản phẩm, cùng lý do với nhóm Hội viên: mock chỉ
có danh sách nên ngăn chi tiết LUÔN trả 404. Giá sàn tự kiểm hai luật — chưa phải
Giám đốc → 403, đặt cao hơn giá niêm yết → 400 kèm `errors.giaSan`.

Phần nhân viên thêm vào lúc chuyển i18n cho nhóm đó, vì không mở màn lên bấm thì
không kiểm được bản dịch bằng mắt. Nó **tự kiểm đủ ba chiều phân quyền**: tự đổi
vai trò của chính mình → 403, đổi người ngang hoặc cao cấp hơn → 403, gán vai trò
vượt cấp mình → 403, gán cờ toàn hệ thống khi chưa phải Giám đốc → 403, email
trùng → 400 kèm `errors.email`. Ba người đầu trong dữ liệu mẫu **trùng `id` với
ba tài khoản đăng nhập** — có vậy mới thử được nhánh "không tự đổi vai trò của
chính mình". Và bộ lọc theo CLB **không loại người mang cờ toàn hệ thống**, nếu
không thì Giám đốc biến mất khỏi danh sách ngay khi chọn một CLB cụ thể.

Phần chi tiết/thêm/sửa hội viên bổ sung lúc chuyển i18n cho nhóm Hội viên: trước
đó mock chỉ có danh sách, nên ngăn chi tiết trên màn LUÔN trả 404 mà không ai để
ý — vì chưa có việc gì bắt phải mở nó ra.

Phần quầy thêm vào lúc gắn mã QR chuyển khoản, và cũng **tự kiểm** như phần hợp
đồng: mở ca chồng nhau → 409 (tiền của ca này rơi vào đối soát của ca kia), giỏ
rỗng → 400, huỷ giao dịch không ghi lý do → 400, và **huỷ là bút toán đảo** —
giữ nguyên dòng, gắn cờ `daHuy`, không xoá.

Ba tài khoản (mật khẩu bất kỳ) thay cho biến môi trường `ROLE=` của bản cũ:
`sale@vfl.vn` (staff) · `ketoan@vfl.vn` (accountant) · `gd@vfl.vn` (director,
toàn hệ thống). Ba tài khoản riêng biệt mới thử được quy tắc **tách nhiệm** —
một biến môi trường đổi vai trò thì không, vì `id` người dùng vẫn là một.

Mock **tự kiểm** các quy tắc quan trọng để chứng minh frontend không phải nơi giữ
luật: sai bảng chuyển trạng thái → 409, chưa thu đủ → 409, người lập tự xác minh
→ 403, dưới giá sàn → 400, thu quá số còn phải thu → 400. Lỗi trả ProblemDetails
có `errors` để thử gắn lỗi vào ô nhập.

⚠ Dữ liệu trong RAM, "token" là chuỗi `tok:<email>` không ký. **Đừng bao giờ trỏ
bản dựng thật vào mock.**

Đặt `DOTNET_API_URL` trong `.env.local` (đã có `.env.example`).

Mock cũng kiểm hai luật mới của chữ ký (mục 5): `chuKy` không phải PNG nhúng →
400, `chuKy` gửi kèm ở bước khác `da-ky` → 400. **Cả hai kiểm TRƯỚC khi động vào
bản ghi** — đặt sau `hd.trangThai = den` thì hợp đồng đã sang trạng thái mới
trước lúc trả 400, người dùng thấy lỗi mà chứng từ đã đi tiếp. Lỗi này đã dính
thật một lần lúc dựng, sửa rồi và có ghi chú tại chỗ.

### 6.4 Tệp gốc hệ cũ — ĐÃ TÌM ĐƯỢC

```
C:\Users\Admin\Downloads\Alpha-Management-Deploy\alpha-deploy\
```

Có đủ `commercial-console.html` (12.478 dòng), `alpha-management-crm.html`,
`marketing-os.html`, `bod-sales-report.html`, `cccd-scanner.js`, `alpha-brand.js`.

Đây là thứ chặn các mục 4, 5 và phần lớn mục 8 trong bảng 7.0 trước đây. **Nên
chép vào một chỗ cả đội với tới được** — hiện nó chỉ nằm trên máy một người, và
thư mục `Downloads` không phải nơi giữ bản gốc của thứ đang được port dần.

---

## 7. Các bước còn lại

### 7.0 Kế hoạch — làm gì tiếp

Chia theo thứ tự CÓ LÀM ĐƯỢC NGAY hay không, vì đó mới là thứ quyết định lấy
việc nào lên bàn.

#### A · Làm được ngay, không chờ ai — **ĐÃ HẾT VIỆC**

| # | Việc | Trạng thái |
|---|---|---|
| ~~A1~~ | ~~i18n toàn bộ~~ | ✅ (mục 3) |
| ~~A2~~ | ~~Mock phủ đủ mọi màn~~ | ✅ |
| ~~A3~~ | ~~Test tương tác `HopDongScreen`~~ | ✅ — lôi ra lỗi mutation không báo lỗi |
| ~~A4~~ | ~~Đăng xuất dọn máy cho người sau~~ | ✅ — cả hai đường ra |
| ~~A5~~ | ~~Nhớ ngôn ngữ trong cookie~~ | ✅ — `<html lang>` đúng từ byte đầu |
| ~~A6~~ | ~~`packages/xlsx-writer`~~ | ✅ — phần chart chưa port, có lý do ở mục 8 |
| ~~A7~~ | ~~Ba đợt rà soát lỗi~~ | ✅ — 5 lỗi thật, xem mục 3 |
| ~~A8~~ | ~~Giám sát ca quầy + sổ giao dịch~~ | ✅ — theo yêu cầu vận hành. Dựng lại theo 2–3 ca/ngày, lôi ra 3 lỗ hổng, xem mục 3 |

**Không còn món nào vừa làm được ngay vừa đáng làm.** Mọi việc dưới đây đều chờ
một người khác quyết hoặc một hệ thống khác sẵn sàng — nên thứ tự bên dưới không
phải "làm gì trước" mà là **"đi đòi cái gì trước"**.

#### Việc cần ĐI ĐÒI, theo thứ tự

**1 · Đội .NET chốt hợp đồng API (mục 5) — chặn nhiều nhất.**
Toàn bộ mục 5 hiện là GIẢ ĐỊNH do frontend tự đặt. Chưa chạy với backend thật thì
chưa biết nó sai chỗ nào, và mọi thứ ở bảng B, C1, D1 đều nằm sau nó. **Nếu chỉ
đòi được một thứ thì đòi cái này.**

Đi kèm, hỏi luôn ba câu đã tích lại trong lúc làm:

| Câu hỏi | Vì sao cần |
|---|---|
| Danh sách quyền chính thức | `lib/auth/capabilities.ts` thiếu hẳn dòng XẾP LỊCH, trong khi mock đòi cấp `leader`. Ma trận đang hiện cho người vận hành đối chiếu — sai là họ tin nhầm |
| Câu lỗi 409/403 viết cho AI đọc | Frontend cố ý hiện NGUYÊN VĂN `detail`/`title`. Mock đang trả mã trạng thái thô (`"Không chuyển được từ cho-thu-tien sang cho-thu-tien."`) — bản thật nên dùng nhãn người đọc được |
| `taiKhoanNhanTien` theo từng CLB | Gói `vietqr` xong và đã test, mock đang trả tài khoản BỊA. Không có số thật thì không bật được (B2) |

**1b · Vận hành chốt KHUNG GIỜ CA — mới, và rẻ nhất trong tất cả.**
Màn Giám sát ca đang chạy trên khung giả định: ca sáng 06:00–14:00, ca chiều
14:00–22:00 (và ca đêm 22:00–06:00 nếu CLB chạy 3 ca). Sai giờ thì ca xếp nhầm
khung và bảng "khung trống" báo sai — mà sửa chỉ là đổi vài con số trong
`features/ban-hang-quay/khungCa.ts`. **Hỏi luôn: mỗi CLB một khung riêng hay
toàn hệ thống dùng chung một khung?** Nếu riêng thì khung phải theo `Location`
từ backend, và đó là việc của đội .NET (mục 5).

**2 · Vận hành quyết ba việc nhỏ mà chặn thật.**
`cccd-scan` chờ chốt có thêm Tesseract (WASM hàng chục MB) hay không; `gsheets`
chờ Google client ID; C2/C3/C4 như bảng cũ. Ba món này **không tốn công sức của
frontend, chỉ tốn một cuộc họp**.

**3 · Chốt cách so sánh của "Tháng này".**
Hiện là "cùng số ngày liền trước" — 02/09 so với 30–31/08, tức đầu tháng so với
cuối tháng. Nhãn "so với kỳ trước" không sai, nhưng nếu vận hành đọc nó như "cùng
kỳ tháng trước" thì con số đang gây hiểu nhầm. Sửa mất 1 giờ, quyết mất 5 phút.

#### Nếu muốn frontend làm tiếp trong lúc chờ

Xếp theo **giá trị trên công sức**, không phải theo thứ tự lộ trình:

| Việc | Công | Được gì |
|---|---|---|
| **Rà soát đợt bốn** | 0,5–1 ngày | Ba đợt trước ra 5 lỗi thật, đợt nào cũng ra. Còn hai vùng chưa dò: **bàn phím / trình đọc màn hình** (Tab, Esc, focus trap) và **màn hẹp** (quầy hay dùng máy tính bảng) |
| **Chart cho `xlsx-writer`** | 2–3 ngày | Chỉ đáng làm khi trung tâm báo cáo được dựng — trước đó là đoán hình dạng dữ liệu |
| **`cccd-scan` phần THUẦN** | 1 ngày | Tách phân tích chuỗi QR của CCCD + bảng MRZ thành hàm thuần có test, KHÔNG đụng camera và KHÔNG thêm phụ thuộc. Làm được ngay mà không cần chờ quyết định; phần cần camera để sau |
| ~~Bước 12b~~ | — | **Đừng.** Quy tắc của chính lộ trình: 12a phải chạy thật một thời gian trước |

> **Đề nghị:** nếu chưa đòi được gì từ hai đội kia, làm **`cccd-scan` phần thuần**
> — đó là món duy nhất còn lại vừa có ích vừa không cần ai gật đầu.

#### B · Chờ đội .NET

| # | Việc | Chờ gì |
|---|---|---|
| B1 | **Chạy thử 12a với backend thật** — một CLB, vài hợp đồng | backend dựng xong các endpoint ở mục 5 |
| B2 | **Bật mã QR chuyển khoản dùng thật** | backend trả `taiKhoanNhanTien` theo từng CLB (mục 5). Gói `vietqr` đã xong và đã test; mock đang trả tài khoản BỊA |

#### C · Chờ vận hành quyết định

| # | Việc | Chờ gì |
|---|---|---|
| C1 | **Bước 14 · mở cho CLB đầu tiên** | B1 + HTTPS + chốt lịch. Đọc `TRIEN-KHAI.md` trước |
| C2 | **Số tài khoản thật của từng CLB** + quét thử bằng app ngân hàng | vận hành cấp số, kèm mã BIN của NAPAS |
| C3 | **Ký màn hay ký giấy** | pháp chế. Ký trên màn hiện là TUỲ CHỌN, có sẵn nút "Ký giấy" |
| C4 | **In phiếu / biên lai quầy** | chốt khổ giấy máy in nhiệt (3–4 ngày làm) |

#### D · Chờ thời gian

| # | Việc | Chờ gì |
|---|---|---|
| D1 | **Bước 12b · ngoại lệ hợp đồng** | 12a phải chạy thật một thời gian — quy tắc của chính lộ trình, đừng phá |

#### E · Còn lại của `packages/` (mục 8)

~~`xlsx-writer`~~ ✅ **XONG** (mục 3) — món nặng nhất, và là phần cuối cùng làm
được mà không chờ ai. Hai gói còn lại **KHÔNG phải chờ công sức, mà chờ MỘT QUYẾT
ĐỊNH**:

| Gói | Chờ gì | Vì sao không tự làm |
|---|---|---|
| `cccd-scan` | **chốt việc thêm phụ thuộc lúc chạy** | Cần jsQR + Tesseract (bộ nhận dạng chữ, kèm WASM hàng chục MB). Dự án hiện có ĐÚNG HAI phụ thuộc lúc chạy ngoài React/Next, và cả hai đều nhỏ. Thêm Tesseract là đổi hẳn cỡ gói tải về của mọi người dùng — quyết định của cả đội, không phải của người port. Ngoài ra nó cần CAMERA THẬT để kiểm, không kiểm bằng test được |
| `gsheets` | **Google client ID + phạm vi quyền, từ vận hành** | Chạy bằng OAuth trên trình duyệt; không có client ID thì không chạy nổi một lần nào để biết đã port đúng chưa. Cùng loại với C2 (số tài khoản thật) |

Chưa món nào cấp thiết. Nếu chọn làm `cccd-scan` thì tách được ngay phần thuần —
phân tích chuỗi QR của CCCD và bảng MRZ — làm hàm thuần có test, để phần cần
camera lại sau; đó cũng là cách `signature-pad` đã đi.

---

**Ba nguyên tắc không đổi, áp cho mọi việc trên:**

1. Quy tắc nghiệp vụ mới → **hàm thuần + test TRƯỚC**, rồi mới tới UI (mục 4.2),
   và phải kiểm chứng test có "răng" bằng cách cố tình phá code.
2. Một mốc nâng framework **KHÔNG** đi kèm bước nghiệp vụ.
3. Chỗ nào đụng tiền thì test phải đối chiếu với **mốc ngoài**, không phải với
   chính hàm vừa viết — xem cách `vietqr` làm ở mục 3.

---

### Bước 12 · Hợp đồng — 5–6 tuần ⚠ **NẶNG NHẤT**

Nguồn: `commercial-console.html` ~1242–1740. **Làm cuối vì đây là chỗ tiền chạy qua.**

Chia hai đợt. **Đừng gộp** — 12a phải chạy thật một thời gian trước khi làm 12b.

#### 12a · Luồng thuận — ✅ ĐÃ DỰNG XONG (xem mục 3)

> Phần dưới giữ nguyên làm hồ sơ thiết kế. Đối chiếu với code thật trong
> `src/features/hop-dong/` trước khi sửa.

```
báo giá → thu đủ → kế toán xác minh → phát hành → ký → kích hoạt
```

Đây là **máy trạng thái**, không phải form nhiều bước. Mỗi chuyển trạng thái có
điều kiện riêng và người có quyền riêng.

**Việc đầu tiên, trước khi viết UI:** dựng `features/hop-dong/hop-dong.ts` —
module hàm thuần cho máy trạng thái, kèm test. Theo đúng quy trình mục 4.2.

```ts
type TrangThaiHopDong =
  | 'bao-gia' | 'cho-thu-tien' | 'cho-xac-minh'
  | 'da-phat-hanh' | 'da-ky' | 'dang-hieu-luc'
  | 'da-huy' | 'tam-dung';

chuyenTiepDuoc(tu, den): boolean          // bảng chuyển trạng thái hợp lệ
viSaoKhongChuyenDuoc(hd, den, actor): string | null
tinhTongHopDong(dong[], khuyenMai?): { tamTinh, giam, tong }
conPhaiThu(hd): Vnd                       // tổng - đã thu
daThuDu(hd): boolean
```

**Các bẫy phải có test riêng — dự đoán từ kinh nghiệm Bước 9/10/11:**

1. **Không nhảy cóc trạng thái.** `bao-gia` → `da-ky` phải bị chặn. Bảng chuyển
   tiếp là nguồn sự thật duy nhất, đừng rải `if` khắp component.
2. **Không phát hành khi chưa thu đủ.** `conPhaiThu(hd) > 0` → chặn. Đây là bẫy
   mất tiền trực tiếp.
3. **Chỉ kế toán trở lên (`accountant` = 35) mới xác minh** — và **người lập hợp
   đồng không được tự xác minh hợp đồng của mình**, kể cả khi đủ cấp bậc. Đây là
   nguyên tắc tách nhiệm (segregation of duties), không phải phân quyền thường.
4. **Giá bán không được dưới giá sàn** — tái dùng `viPhamGiaSan()` từ
   `features/san-pham/gia.ts`, đừng viết lại.
5. **Làm tròn tiền** — dùng `roundVnd()` từ `lib/format/money.ts`. Chốt sớm: làm
   tròn ở từng dòng hay ở tổng? Hai cách cho kết quả khác nhau.
6. **Trạng thái suy ra vs trạng thái lưu** — như `trangThaiKhuyenMai()` ở Bước 9
   (suy từ ngày) và `trangThaiBuoi()` ở Bước 10. Hợp đồng hết hạn nên **suy từ
   ngày**, không lưu, nếu không sẽ có bản ghi `dang-hieu-luc` đã quá hạn 3 tháng.

**Component cần dựng:** `<StepHopDong>` (thanh 5 bước — thay `.step` cũ),
`<BangTongTien>` (thay `.totals`), `<DongSanPham>` chọn sản phẩm + số lượng +
giá (dùng `MoneyInput` đã có).

**Endpoint dự kiến:** `/hop-dong` (list/detail/create/update),
`/hop-dong/:id/chuyen-trang-thai {den, ghiChu}`, `/hop-dong/:id/thanh-toan`.

#### 12b · Ngoại lệ (2–3 tuần)

Chỉ bắt đầu khi 12a đã chạy thật. Gồm: trả góp/công nợ · sửa-huỷ giao dịch đã ghi
· huỷ hoá đơn · kế toán trả lại · chia hoa hồng nhiều sales · đổi gói · tạm dừng ·
chuyển nhượng.

**Nguyên tắc:** mọi thao tác ở 12b đều là **ghi bút toán đảo**, không sửa đè bản
ghi cũ. Đã áp dụng ở Bước 11 (huỷ giao dịch giữ nguyên dòng, gắn cờ `daHuy` +
`lyDoHuy`) — giữ đúng cách đó.

`ConfirmDialog` đã có sẵn và **bắt buộc nhập lý do** như luồng huỷ giao dịch ở
Bước 11 (`ban-hang-quay/BanHangQuayScreen.tsx` — copy mẫu đó).

---

### Bước 13 · Dashboard — ✅ ĐÃ DỰNG XONG (xem mục 3)

> Phần dưới giữ nguyên làm hồ sơ thiết kế. Code thật ở `src/features/tong-quan/`.

Nguồn: `commercial-console.html` ~2693–3020. Tổng hợp từ tất cả nên **phải làm
sau cùng**.

- Trang đã có sẵn placeholder tại `app/(app)/tong-quan/page.tsx`
- Khoá cache `keys.tongQuan.all` đã khai; **mọi `AFFECTED_BY` đều đã invalidate
  nhánh này** → dashboard tự làm mới khi bất kỳ nghiệp vụ nào đổi
- Phân quyền: `bao-cao.clb` (leader+) vs `bao-cao.toan-he-thong` (director+) đã
  khai trong `lib/auth/capabilities.ts`
- Số liệu phải tôn trọng CLB đang chọn (`useLocationScope()`), trừ khi người dùng
  có cờ `allLocations`

**Đã chốt: không dùng thư viện biểu đồ** — vẽ bằng div + token, xem mục 3.

---

### Bước 14 · Chuyển đổi — 2 tuần · **phần chuẩn bị đã xong**

Sổ tay ngày mở: **`TRIEN-KHAI.md`** — biến môi trường, kiểm tra trước khi mở,
cách diễn tập bằng mock, theo dõi gì trong ngày đầu, đường lùi, và danh sách
những chỗ còn thiếu mà người vận hành phải biết trước.

Công cụ đã dựng kèm:
- `npm run kiem-tra` — `tsc --noEmit` → `eslint .` → `next build`,
  chạy tuần tự, đỏ ở đâu dừng ở đó.
- `GET /api/suc-khoe` — không cần đăng nhập, trả lời đúng một câu hỏi: web có
  gọi được backend .NET không. **Không lộ `DOTNET_API_URL` và không trả nguyên
  văn lỗi mạng** (có test khẳng định điều đó). `backendStatus: 401` là BÌNH
  THƯỜNG — nó gọi `/auth/me` không kèm token, 401 nghĩa là backend sống.
- `npm run mock` — xem mục 6.3.

Phần còn lại của Bước 14 phụ thuộc ngày backend .NET sẵn sàng và quyết định vận
hành, không phải việc của frontend:
- Mở cho **một CLB trước**, một tuần không sự cố thì mở toàn hệ thống
- **Giữ đường lùi về bản cũ ít nhất hai tuần**
- ⚠ Bản thật **phải chạy HTTPS**: cookie phiên bật cờ `secure` khi
  `NODE_ENV=production`, chạy HTTP thì trình duyệt bỏ cookie và không ai đăng
  nhập được

---

## 8. `packages/` — port nguyên văn, đừng viết lại

Hàm thuần, đã chạy đúng trong sản xuất. Copy sang, thêm type, viết unit test.
Tệp gốc ở mục 6.4. Gói đầu tiên đã port xong.

| Gói | Nguồn | Ghi chú |
|---|---|---|
| `signature-pad` | ~11993–12022 + ~12245–12252 | ✅ **XONG** — `src/packages/signature-pad`, 39 test, đã gắn vào bước "ký", **đã chuyển i18n**. Xem mục 3 |
| `vietqr` | ~12025–12070 | ✅ **XONG** — `src/packages/vietqr`, 47 test, đã gắn vào bước thu tiền của hợp đồng, **đã chuyển i18n**. Có chuỗi mẫu đã QUÉT ĐƯỢC THẬT làm mốc. Xem mục 3 |
| `cccd-scan` | `cccd-scanner.js` | jsQR + Tesseract MRZ + quét tiếp sức. **Chờ chốt việc thêm phụ thuộc lúc chạy** — xem bảng E ở mục 7.0 |
| `gsheets` | ~3828–4270 | OAuth + Sheets API, sổ hợp đồng dùng chung. **Chờ Google client ID của vận hành** — xem bảng E ở mục 7.0 |
| `xlsx-writer` | ~3418–3800 | ✅ **XONG** — `src/packages/xlsx-writer`, 33 test, đã kiểm bằng trình giải nén thật (mục 3). CHƯA port phần **chart / drawing**: màn dùng nó (trung tâm báo cáo) thuộc Phase sau, chưa dựng |

**Bài học từ gói đầu tiên:** "port nguyên văn, đừng viết lại" áp cho THUẬT TOÁN
(phép co ảnh, ngưỡng xoá nền, TLV/CRC), không áp cho phần chạm DOM — đoạn DOM
của bản cũ có ba lỗi thật (mất nét khi đổi cỡ, mờ trên màn mật độ cao, trình
nghe `window` không bao giờ gỡ). Chép nguyên là chép cả ba sang bản mới.

**Nó cũng không cấm chuyển i18n.** Lượt chuyển `packages` (mục 3) đổi chỗ LẤY
chữ — hàm thuần trả khoá, màn mới dịch — mà không sửa một dòng thuật toán nào.
Gói port thứ ba trở đi cứ làm vậy.

---

## 9. Ba chi tiết dễ quên

**Phông chữ:** `Inter({ subsets: ['latin', 'vietnamese'] })` — thiếu subset
`vietnamese` thì chữ có dấu rơi về phông dự phòng. *(đã làm)*

**Select và Dark Mode:** máy bật dark mode làm popup `<select>` đổi nền tối trong
khi chữ vẫn sáng → chữ tàng hình. Lỗi này **đã gặp thật** trong bản cũ. Đã chặn
bằng `select { color-scheme: light }`. *(đã làm)*

**Ô nhập checkbox/radio:** rule `w-full` của `.field` sẽ kéo chúng thành khung
dài. Bản cũ phải vá tay 20 chỗ vì lỗi này. *(đã tránh, có chú thích tại chỗ)*

**Thêm một cái nữa, học được ở Bước 10:** đừng dùng `toISOString()` để lấy ngày —
nó quy về UTC, ở múi +7 thì 0h ngày 1 thành 17h ngày trước đó. Dùng `toIsoDate()`
trong `lib/format/date.ts`. Lỗi này từng làm một kịch bản kiểm thử "pass" nhầm.

---

## 10. Lệnh hay dùng

```bash
npm run dev          # dev server, cổng 3000
npm run mock         # backend .NET giả, cổng 5099 — xem mục 6.3
npm run kiem-tra     # tsc → lint → build, chạy trước khi bàn giao / trước ngày mở
npm run build        # chỉ build
npm run i18n-con-lai # đếm chuỗi tiếng Việt chưa đưa vào lib/i18n
npm run lint         # `eslint .` — Next 16 đã bỏ `next lint`
npx tsc --noEmit     # xoá tsconfig.tsbuildinfo trước nếu kết quả có vẻ cũ
```

> ⚠ **Đừng chạy `next build` và `next dev` cùng lúc** — hỏng cache `.next`, dev
> server sẽ ném `Cannot find module './xxx.js'`. Gặp thì `rm -rf .next` rồi khởi
> động lại.

---

## 11. Câu mở đầu cho đoạn chat mới

Chép nguyên khối dưới đây, thay dòng **VIỆC CẦN LÀM** cho khớp, rồi dán tài liệu
này ngay sau đó.

> Tôi đang chuyển frontend hệ thống VFL Alpha Management sang **Next.js 16 App
> Router + React 18 + TypeScript strict + Tailwind**. Backend do đội khác viết
> bằng .NET, **tôi chỉ lo frontend** — không bàn schema, không thiết kế API,
> không lo di trú dữ liệu.
>
> Đã xong: Bước 1–11, **Bước 12a (Hợp đồng — luồng thuận)**, **Bước 13
> (Dashboard)**, hai mốc nâng Next (14→15→16), phần chuẩn bị Bước 14
> (`TRIEN-KHAI.md`, `npm run kiem-tra`, `/api/suc-khoe`, `npm run mock`),
> **test tương tác (jsdom + RTL)**, ba gói port **`signature-pad`** (bước "ký"),
> **`vietqr`** (mã QR chuyển khoản ở hợp đồng + quầy) và **`xlsx-writer`** (xuất
> Excel), **i18n ĐÃ XONG TOÀN BỘ**
> (hạ tầng + bộ chuyển ngôn ngữ + bảy nhóm nghiệp vụ + bộ component nền + ba gói
> port + nhóm `app`; ngôn ngữ nhớ trong **cookie** nên server dựng HTML đúng ngôn
> ngữ ngay từ byte đầu), và **mock phủ đủ mọi màn**.
> `npm run kiem-tra` đang xanh (tsc → eslint → build), 0 advisory. Bộ test đã
> gỡ khi dọn kho để bàn giao — xem mục 0a.
> Tệp gốc `commercial-console.html` đã có — xem mục 6.4.
>
> **VIỆC CẦN LÀM:** _(bảng đầy đủ ở mục 7.0)_
> - **Không còn việc nào làm được mà không chờ bên ngoài.** Bảng A xong; gói
>   `xlsx-writer` — phần lớn nhất còn lại — cũng xong. Hai gói cuối
>   (`cccd-scan`, `gsheets`) chờ QUYẾT ĐỊNH: thêm phụ thuộc Tesseract, và Google
>   client ID. Còn lại chờ đội .NET (B), vận hành (C), thời gian (D). Xem bảng E
>   ở mục 7.0.
>
> Quy ước bắt buộc, đọc mục 4 trước khi viết code. Ba điều hay quên nhất:
> 1. Quy tắc nghiệp vụ mới → **hàm thuần TRƯỚC**, rồi mới tới UI (mục 4.2); hàm
>    thuần không import React. Nếu có gắn test thì phải kiểm chứng test có
>    "răng" bằng cách cố tình phá code.
> 2. Không `fetch` ngoài `lib/api/client.ts` và `lib/server/dotnet.ts`; component
>    trong `components/` không gọi API.
> 3. Kiểm tra quyền ở frontend **chỉ để ẩn nút** — backend .NET mới là nơi giữ luật.
>
> Chạy thử không cần backend thật: `npm run mock` rồi `npm run dev`.
>
> [dán tài liệu này]
