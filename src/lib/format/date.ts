/* Ngày giờ, làm việc theo giờ địa phương. Không bao giờ dùng toISOString() để
   lấy ngày: nó quy về UTC, ở múi giờ +7 thì 0h ngày 1 thành 17h ngày trước. */

export type DateInput = Date | string | number;

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Nhận Date / mốc thời gian / chuỗi và trả Date, hoặc null nếu không đọc
    được. Chuỗi 'YYYY-MM-DD' được dựng thành 0h địa phương, không phải 0h UTC. */
function asDate(value: DateInput): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const s = value.trim();
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m && m[1] && m[2] && m[3]) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → 'YYYY-MM-DD' theo giờ địa phương. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** → 'DD/MM/YYYY'. Trả '—' nếu rỗng hoặc không đọc được. */
export function fmtDate(value: DateInput | null | undefined): string {
  const d = value == null ? null : asDate(value);
  if (!d) return '—';
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Trả 'DD/MM/YYYY HH:mm' theo giờ địa phương. */
export function fmtDateTime(value: DateInput | null | undefined): string {
  const d = value == null ? null : asDate(value);
  if (!d) return '—';
  return `${fmtDate(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 'DD/MM/YYYY' người dùng nhập → 'YYYY-MM-DD'. null nếu sai định dạng hoặc
    ngày không có thật (31/02). */
export function vnDateToIso(input: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input.trim());
  if (!m || !m[1] || !m[2] || !m[3]) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Thứ Hai của tuần chứa `date`, ở 0h địa phương. */
export function mondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = d.getDay(); // 0 = Chủ nhật
  d.setDate(d.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return d;
}

/** Ngày đầu và ngày cuối của tháng chứa `date`, ở 0h địa phương. */
export function monthBounds(date: Date): { start: Date; end: Date } {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
  };
}

/** `date` cộng thêm `days` ngày (âm để lùi), giữ nguyên giờ-phút-giây. */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}
