# Chuyển đổi sang bản Next.js — sổ tay ngày mở (Bước 14)

> Tài liệu này là phần **chuẩn bị** của Bước 14 trong `BAN-GIAO-LO-TRINH-FRONTEND-v3.md`.
> Nó chỉ nói về frontend. Ngày mở thật sự còn phụ thuộc backend .NET đã sẵn sàng
> chưa — phần đó không thuộc phạm vi tài liệu này.

## 0. Nguyên tắc, chốt trước khi bàn lịch

1. **Mở cho MỘT câu lạc bộ trước.** Một tuần không sự cố thì mới mở toàn hệ thống.
2. **Giữ đường lùi về bản cũ ít nhất hai tuần.** Bản cũ (4 web app tĩnh) không
   được tắt, không được xoá, không được đổi cấu hình trong thời gian đó.
3. **Không mở vào ngày chốt sổ.** Hợp đồng và ca quầy là chỗ tiền chạy qua; nếu
   phải lùi thì lùi vào ngày ít giao dịch nhất.

## 1. Biến môi trường

Chỉ có một biến, và **chỉ server đọc nó** (`src/lib/server/dotnet.ts`):

```
DOTNET_API_URL=https://<địa-chỉ-backend-.NET>
```

- Không thêm tiền tố `NEXT_PUBLIC_` — trình duyệt không được biết địa chỉ này.
- Trình duyệt luôn gọi `/api/*` của chính Next; Next mới gắn `Authorization:
  Bearer` rồi chuyển tiếp. Token nằm trong cookie `httpOnly`, JavaScript không
  chạm tới.
- Chép `.env.example` thành `.env.local` cho máy phát triển. Môi trường thật đặt
  biến ở nơi chạy ứng dụng, **không commit**.

⚠ Cookie phiên đặt cờ `secure` khi `NODE_ENV=production` → **bản thật phải chạy
HTTPS**, nếu không trình duyệt bỏ cookie và không ai đăng nhập được.

## 2. Kiểm tra trước khi mở

```bash
npm run kiem-tra
```

Chạy tuần tự `tsc --noEmit` → `eslint .` → `next build`. Đỏ ở bước nào thì
dừng ở đó, đừng mở.

Kiểm bằng tay thêm bốn việc:

- **Mở `/dang-nhap` bằng mắt và đăng nhập thử.** Không bỏ qua bước này dù
  `kiem-tra` xanh: đã có lần `layout.tsx` mất `<Providers>`, app chết 100%
  ở lần vẽ đầu (`No QueryClient set`) mà mọi công cụ trong `kiem-tra` đều báo
  xanh — `tsc`, `eslint` và `next build` không nhìn thấy lớp layout gốc hỏng.
  Nguyên tắc: **cổng chất lượng xanh không có nghĩa app chạy.**
- `npm audit` — hiện đang **0 vulnerabilities** (Next 16.3.4); xác nhận vẫn sạch
  trước khi mở.
- Vào `/api/suc-khoe` trên môi trường thật — xem mục 4.
- Đăng nhập thử bằng một tài khoản thật của mỗi vai trò: `staff`, `accountant`,
  `manager`. Ba vai trò này nhìn thấy ba màn khác nhau.

## 3. Diễn tập khi backend chưa sẵn sàng

```bash
npm run mock     # backend .NET giả, cổng 5099
npm run dev      # cửa sổ khác
```

`tools/mock-dotnet.mjs` phủ auth · hội viên · sản phẩm · khuyến mãi · hợp đồng ·
tổng quan · bán vé ngày tại quầy, và **tự kiểm các quy tắc quan trọng** (chuyển
trạng thái sai → 409, chưa thu đủ → 409, người lập tự xác minh → 403, dưới giá
sàn → 400, mở ca chồng nhau → 409, huỷ giao dịch không ghi lý do → 400). Ba tài
khoản, mật khẩu bất kỳ:

| Email | Vai trò | Dùng để thử |
|---|---|---|
| `sale@vfl.vn` | staff | lập báo giá, thu tiền |
| `ketoan@vfl.vn` | accountant | xác minh & phát hành |
| `gd@vfl.vn` | director | báo cáo toàn hệ thống |

⚠ Mock giữ dữ liệu trong RAM và cấp "token" không ký. **Không bao giờ trỏ bản
dựng thật vào mock.**

## 4. Ngày mở — theo dõi gì

**`GET /api/suc-khoe`** (không cần đăng nhập, không lộ địa chỉ nội bộ):

```json
{ "app": "ok", "backend": "ok", "backendStatus": 401, "doTreMs": 120 }
```

- `200` + `backend: "ok"` — web nói chuyện được với .NET. `backendStatus` là mã
  .NET trả về cho `/auth/me` không kèm token, nên **401 là bình thường**, nghĩa là
  backend sống và đang kiểm tra xác thực.
- `503` + `backend: "khong-goi-duoc"` — không gọi tới nơi trong 2 giây: sai địa
  chỉ, chặn tường lửa, hoặc backend chết.
- `503` + `backend: "khong-cau-hinh"` — thiếu `DOTNET_API_URL` ở nơi chạy.

Ngoài ra, ba thứ đáng nhìn trong ngày đầu:

1. **Vòng lặp đăng nhập.** Nếu thấy trình duyệt nhảy qua lại `/dang-nhap` ↔
   `/tong-quan`, đó là phiên: kiểm HTTPS (cờ `secure`) và đồng hồ máy chủ. Luồng
   đúng là access hết hạn → `/api/auth/lam-moi` → quay lại trang cũ, tối đa hai
   lần chuyển hướng.
2. **409 khi chuyển trạng thái hợp đồng.** Nghĩa là hai người thao tác cùng một
   hợp đồng, hoặc màn đang đọc bản cũ. Bấm lại là hết. 409 dồn dập thì mới là lỗi.
3. **Lệch tiền cuối ca quầy.** Đối chiếu với bảng `VAO_KET`: chỉ tiền mặt vào két.

## 5. Đường lùi

Frontend mới **không ghi gì vào dữ liệu bản cũ** — nó chỉ gọi backend .NET. Lùi
nghĩa là cho người dùng quay lại 4 web app tĩnh:

1. Chuyển tên miền / lối vào về bản cũ.
2. Báo CLB đang chạy thử: từ giờ nhập trên bản cũ.
3. **Đối chiếu dữ liệu đã nhập trên bản mới** trong khoảng thời gian chạy thử —
   phần này là việc của đội backend, frontend không tự làm được.

Giữ nguyên bản dựng cũ trong ít nhất hai tuần kể từ ngày mở.

## 6. Biết trước khi mở — những chỗ còn thiếu

Chi tiết ở mục 6.2 của tài liệu bàn giao. Ba món ảnh hưởng trực tiếp tới người
vận hành trong ngày đầu:

| Thiếu | Nghĩa là gì trên màn hình |
|---|---|
| **In phiếu / biên lai** | Quầy chưa in được. Cần chốt khổ giấy máy in nhiệt trước. |
| **i18n ~600 mục** | Bản tiếng Anh mới phủ phần khung. Người dùng tiếng Việt không ảnh hưởng. |
| **Chữ ký Bên A** | Hội viên (Bên B) ký được trên màn rồi. Chữ ký đại diện CLB/CEO ở hệ cũ lấy từ cấu hình thương hiệu của CLB — phần cấu hình đó chưa port. |


## 6b. Tài khoản nhận chuyển khoản — PHẢI CHUẨN BỊ TRƯỚC NGÀY MỞ

Bước thu tiền của hợp đồng VÀ giỏ hàng ở quầy bán vé nay đều hiện **mã QR
VietQR** mang đúng số tiền. Khách quét là chuyển đúng số, không gõ tay số tài
khoản.

Nội dung chuyển khoản khác nhau ở hai chỗ, và kế toán cần biết:

| Màn | Nội dung chuyển khoản | Đối chiếu theo |
|---|---|---|
| Hợp đồng | mã hợp đồng, ví dụ HD0004 | từng hợp đồng |
| Quầy bán vé | **mã ca**, ví dụ CA001 | **cả ca**, không tới từng giao dịch |

⚠ Ở quầy chỉ đối chiếu được tới CA. Tiền về trước khi giao dịch được ghi nên lúc
dựng mã chưa có mã giao dịch nào tồn tại. Tổng chuyển khoản của ca đã tách sẵn
khỏi tiền mặt trong phiếu đối soát cuối ca, nên đối chiếu theo ca là làm được.

Nhưng nó chỉ chạy khi **backend .NET trả `taiKhoanNhanTien` cho từng CLB**
(`bin`, `soTaiKhoan`, `tenChuTaiKhoan`). Thiếu thì màn nói thẳng *"CLB này chưa
cấu hình tài khoản nhận chuyển khoản"* và không hiện mã — cố ý như vậy, thà
không có mã còn hơn có mã trỏ sai chỗ.

**Ba việc phải làm trước ngày mở:**

1. **Vận hành cung cấp số tài khoản thật của từng CLB** — kèm mã BIN của NAPAS.
   Tra bảng, đừng đoán; danh sách ngân hàng biết được nằm ở
   `src/packages/vietqr/vietqr.ts`.
2. **Đội .NET trả trường đó theo từng CLB**, không phải một tài khoản dùng chung.
3. **Quét thử bằng ứng dụng ngân hàng thật, ít nhất một mã cho mỗi CLB.** Xem
   ứng dụng có hiện đúng tên chủ tài khoản, đúng số tiền, và **không cho sửa số
   tiền** hay không. Đây là việc năm phút và nó chặn đúng loại sai đắt nhất.

⚠ **Đây là thay đổi so với bản cũ.** Bản cũ để mỗi máy tự cấu hình ngân hàng rồi
nhớ trong trình duyệt của máy đó. Một quầy gõ nhầm một chữ số là tiền chảy vào
tài khoản người lạ và không ai đối chiếu được. Nay chỉ backend giữ số tài khoản.

## 6c. Chữ ký tay — chốt với pháp chế trước ngày mở

**Chữ ký tay ĐÃ CÓ** (`packages/signature-pad`). Bước "ký" nay có khung ký: hội
viên ký bằng chuột hoặc ngón tay, hoặc tải ảnh chữ ký có sẵn lên. Ảnh lưu vào
hợp đồng dưới dạng PNG nhúng, nền đã đục trong.

⚠ **Ký trên màn là TUỲ CHỌN, không bắt buộc.** Cạnh bên có nút **"Ký giấy — chỉ
ghi nhận"** đi đúng đường cũ (chỉ ghi trạng thái + ngày). Trước ngày mở phải chốt
với vận hành và pháp chế: CLB này ký màn hay ký giấy. Muốn ép ký màn thì thêm
điều kiện vào `features/hop-dong/hop-dong.ts` — đừng sửa ở component.

Việc cần làm trong ngày đầu, liên quan chữ ký: mở một hợp đồng ở bước ký, ký
thử, xem ảnh chữ ký có hiện lại đúng sau khi F5 không — và thử trên đúng cái máy
tính bảng / điện thoại mà quầy sẽ dùng, vì đó là nơi thao tác ngón tay thật.

Việc thứ hai: **quét thử mã QR chuyển khoản bằng ứng dụng ngân hàng thật** — xem
mục 6b.

Ngoài ra **Bước 12b (ngoại lệ hợp đồng)** chưa làm: chưa sửa/huỷ được phiếu thu
đã ghi, chưa huỷ được hợp đồng sau khi phát hành, chưa có trả góp. Trước khi mở,
phải thống nhất với kế toán rằng những ca đó tạm thời xử lý ngoài hệ thống — và
đó cũng là lý do 12a cần chạy thật một thời gian trước khi dựng 12b.
