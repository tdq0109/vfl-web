import { VUNG_LANG, maTranQR } from './ma-tran';

/* Vẽ mã QR VietQR ra SVG.

   Dùng SVG chứ không phải canvas vì mã QR rồi sẽ phải in (phiếu thu, hợp đồng),
   mà canvas in ra là ảnh bitmap răng cưa. SVG thì sắc ở mọi khổ giấy và không
   cần useEffect nào — vẽ thẳng trong lần render đầu, kể cả trên server.

   Màu cố định đen trên trắng, không dùng token. Đây là ngoại lệ có chủ ý: máy
   quét cần tương phản thật giữa ô tối và ô sáng, đúng chiều tối trên sáng. Token
   màu có thể đổi khi designer giao bộ mới hoặc đảo lại nếu có chế độ tối, mà mã
   QR bị đảo màu thì phần lớn ứng dụng ngân hàng không đọc nổi. Vùng lặng trắng
   quanh mã cũng vì lý do đó, không phải để cho thoáng. */

const MAU_O_TOI = '#000000';
const MAU_NEN = '#FFFFFF';

interface Props {
  /** Chuỗi payload từ `chuoiVietQR()`. Chuỗi hỏng thì component không vẽ gì. */
  chuoi: string;
  /** Nhãn cho trình đọc màn hình — nói rõ quét ra cái gì. */
  label: string;
  className?: string;
}

/** Gộp các ô tối liền nhau trên cùng một hàng thành MỘT thẻ `rect`.

    Một mã cỡ vừa có hơn một nghìn ô tối; mỗi ô một thẻ là hơn một nghìn nút DOM
    cho một hình vuông bé xíu. Gộp theo hàng cắt đi phần lớn số đó mà hình vẽ ra
    y hệt. */
function daiOToi(dong: readonly boolean[]): { tu: number; dai: number }[] {
  const dai: { tu: number; dai: number }[] = [];
  let tu = -1;
  for (let i = 0; i <= dong.length; i += 1) {
    if (dong[i]) {
      if (tu < 0) tu = i;
    } else if (tu >= 0) {
      dai.push({ tu, dai: i - tu });
      tu = -1;
    }
  }
  return dai;
}

export function MaQR({ chuoi, label, className }: Props) {
  const luoi = maTranQR(chuoi);
  /* Chuỗi hỏng → không vẽ gì. Xem bẫy 1 ở `ma-tran.ts`: một mã QR sai nhìn
     không khác gì mã đúng, nên thà để trống còn hơn mời khách quét. */
  if (!luoi) return null;

  const soO = luoi.length;
  const canh = soO + VUNG_LANG * 2;

  return (
    <svg
      viewBox={`0 0 ${canh} ${canh}`}
      role="img"
      aria-label={label}
      className={className}
      shapeRendering="crispEdges"
    >
      <rect width={canh} height={canh} fill={MAU_NEN} />
      {luoi.map((dong, hang) =>
        daiOToi(dong).map(({ tu, dai }) => (
          <rect
            key={`${hang}-${tu}`}
            x={tu + VUNG_LANG}
            y={hang + VUNG_LANG}
            width={dai}
            height={1}
            fill={MAU_O_TOI}
          />
        )),
      )}
    </svg>
  );
}
