/* CLB đang chọn — kho ngoài React, để `useSyncExternalStore` đọc.

   Vì sao tách khỏi component: `sessionStorage` là một hệ thống BÊN NGOÀI React.
   Trước đây `LocationProvider` khởi tạo state rồi mới đọc kho trong `useEffect`
   (tránh lệch hydration), nhưng cách đó gọi `setState` trong effect — React 19 /
   eslint-config-next 16 gắn cờ đúng lý do: một lần render thừa mỗi lần gắn.

   `useSyncExternalStore` giải đúng bài này: server và lần render hydrate đầu
   tiên dùng ảnh chụp SERVER (`docTrenServer`), sau khi hydrate xong React tự đọc
   ảnh chụp CLIENT. Không effect, không setState, không lệch hydration.

   Toàn bộ tệp này là hàm thuần hoặc chạm kho, không import React. */

export const MOI_CLB = 'all';

export const STORAGE_KEY = 'vfl.location';

type Listener = () => void;

const listeners = new Set<Listener>();

/** `sessionStorage` khi có, `null` khi chạy ở server hoặc khi trình duyệt chặn
    (chế độ riêng tư, cookie/site data bị khoá). KHÔNG ném — mất chỗ nhớ thì màn
    vẫn phải chạy. */
function kho(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Đăng ký nghe thay đổi. Trả hàm bỏ nghe — đúng chữ ký `useSyncExternalStore`. */
export function dangKy(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* Bản lưu tạm trong bộ nhớ, CHỈ dùng khi trình duyệt chặn ghi.

   Vì sao cần: với `useSyncExternalStore`, KHO LÀ NGUỒN SỰ THẬT — màn hình không
   giữ bản sao nào của lựa chọn. Ghi hỏng mà không có bản tạm này thì lần render
   ngay sau đó đọc lại kho và thấy giá trị cũ, nên ô chọn CLB BẬT NGƯỢC về chỗ
   cũ ngay khi vừa chọn: người dùng bấm mãi không đổi được và không có lời báo
   nào. Lỗi này chỉ lộ ra khi bấm thật vào ô chọn CLB trong lúc trình duyệt chặn
   ghi — đọc mã suông thì thấy hợp lý.

   `ghiDuoc` bắt đầu bằng `true` và chỉ thành `false` sau một lần ghi hỏng thật,
   nên đường chạy bình thường không đụng tới `banTam` — kho vẫn là nguồn sự thật
   duy nhất, không sinh ra hai chỗ nhớ song song lệch nhau. */
let banTam: string | null = null;
let ghiDuoc = true;

/** Ảnh chụp phía client. Trả chuỗi đã lưu, hoặc `null` nếu chưa chọn bao giờ. */
export function docDaLuu(): string | null {
  if (!ghiDuoc) return banTam;
  try {
    return kho()?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return banTam;
  }
}

/** Ảnh chụp phía server — LUÔN `null`. Server không biết người này đã chọn CLB
    nào, và đoán bừa chính là nguồn gốc lệch hydration. */
export function docTrenServer(): null {
  return null;
}

/** Ghi lựa chọn mới rồi báo cho mọi người đang nghe. */
export function luu(id: string): void {
  banTam = id;
  try {
    kho()?.setItem(STORAGE_KEY, id);
    ghiDuoc = true;
  } catch {
    /* Không ghi được vào kho: lựa chọn chỉ sống trong lần tải trang này, nhưng
       PHẢI có hiệu lực ngay — xem ghi chú ở `banTam`. F5 là mất. */
    ghiDuoc = false;
  }
  for (const listener of [...listeners]) listener();
}

/** Quên lựa chọn đã nhớ, đưa kho về đúng trạng thái chưa ai chọn gì.

    Dùng khi đăng xuất — người tiếp theo dùng chung máy ở quầy không nên thừa
    hưởng CLB của người trước. ĐỪNG gọi thẳng hàm này từ màn: đường đăng xuất đi
    qua `lib/storage/quenPhien.ts`, cửa duy nhất dọn mọi kho theo người dùng, và
    có test bắt buộc mọi `quen()` phải nối vào đó. Test tương tác vẫn gọi thẳng
    để mỗi ca bắt đầu sạch. */
export function quen(): void {
  banTam = null;
  ghiDuoc = true;
  try {
    kho()?.removeItem(STORAGE_KEY);
  } catch {
    /* Không xoá được thì bản tạm đã về null rồi, coi như chưa chọn gì. */
  }
  for (const listener of [...listeners]) listener();
}

/** CLB có hiệu lực: lấy giá trị đã lưu nếu còn hợp lệ, không thì về mặc định.

   Hai lý do một giá trị đã lưu trở nên không hợp lệ:
     · người dùng bị rút quyền ở CLB đó (không còn trong `options`);
     · người dùng mất cờ "toàn hệ thống" nhưng kho vẫn nhớ 'all'.
   Cả hai đều là chuyện có thật khi quản lý đổi vai trò giữa hai phiên làm việc. */
export function clbHieuLuc(
  daLuu: string | null,
  options: readonly { id: string }[],
  allowAll: boolean,
): string {
  const macDinh = allowAll ? MOI_CLB : (options[0]?.id ?? MOI_CLB);
  if (!daLuu) return macDinh;
  if (daLuu === MOI_CLB) return allowAll ? MOI_CLB : macDinh;
  return options.some((o) => o.id === daLuu) ? daLuu : macDinh;
}
