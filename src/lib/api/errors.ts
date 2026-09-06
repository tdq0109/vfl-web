/* Lỗi API theo chuẩn ProblemDetails (RFC 7807) mà ASP.NET trả về. `fieldErrors`
   phẳng hoá `errors` để gắn thẳng vào ô nhập theo tên field. */

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  /** .NET ValidationProblemDetails: tên field (PascalCase) → danh sách lỗi. */
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails;
  /** Tên field → thông điệp lỗi đầu tiên. Có cả khoá gốc (PascalCase từ .NET)
      lẫn camelCase để khớp tên field trong form. */
  readonly fieldErrors: Record<string, string>;
  readonly traceId: string | undefined;
  /** Khoá i18n cho câu hiện lên màn, khi backend không trả detail lẫn title.
      null nghĩa là câu đến từ backend, cứ hiện nguyên văn message.

      ApiError dựng ngoài React nên không gọi t() ở đây — dịch lúc dựng là đóng
      băng ngôn ngữ theo thời điểm nạp tệp. Lớp lỗi giữ khoá, màn hiện lỗi mới
      dịch. Chỗ trống của khoá này là {ma}, điền bằng status. */
  readonly khoaThongDiep: string | null;

  constructor(status: number, problem: ProblemDetails = {}) {
    const cuaBackend = problem.detail || problem.title;
    super(cuaBackend || `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
    this.khoaThongDiep = cuaBackend ? null : 'loi.maSo';
    this.fieldErrors = flatten(problem.errors);
    this.traceId = typeof problem.traceId === 'string' ? problem.traceId : undefined;
    // Bắt buộc khi kế thừa Error nếu mã bị hạ cấp xuống ES5.
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** 400 kèm ít nhất một lỗi field. */
  get isValidation(): boolean {
    return this.status === 400 && Object.keys(this.fieldErrors).length > 0;
  }
  get isAuth(): boolean {
    return this.status === 401;
  }
  get isForbidden(): boolean {
    return this.status === 403;
  }
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** Lỗi của một field, thử cả tên gốc, camelCase lẫn PascalCase. */
  fieldError(name: string): string | undefined {
    return (
      this.fieldErrors[name] ??
      this.fieldErrors[name.charAt(0).toLowerCase() + name.slice(1)] ??
      this.fieldErrors[name.charAt(0).toUpperCase() + name.slice(1)]
    );
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    let problem: ProblemDetails = {};
    try {
      const data: unknown = await res.json();
      if (data && typeof data === 'object') {
        problem = data as ProblemDetails;
      }
    } catch {
      // body rỗng hoặc không phải JSON — giữ problem rỗng
    }
    return new ApiError(res.status, problem);
  }
}

function flatten(errors: Record<string, string[]> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!errors) return out;
  for (const key of Object.keys(errors)) {
    const list = errors[key];
    const first = Array.isArray(list) ? list[0] : undefined;
    if (!first) continue;
    out[key] = first;
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    if (!(camel in out)) out[camel] = first;
  }
  return out;
}
