import type { Location } from '@/lib/api/types';

/* Hồ sơ người dùng và hình dạng phản hồi đăng nhập từ .NET.

   Đây là giả định hợp đồng API, đội backend .NET chưa chốt. Khi có hợp đồng
   thật, sửa ở đây, ở 4 route handler trong `app/api/auth/`, và ở
   `lib/auth/server.ts`. */

export type { Location };

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  /** Mã vai trò: ctv | staff | coach | leader | accountant | manager | director | ceo */
  role: string;
  /** Các CLB người này được phép thao tác. */
  locations: Location[];
  /** Cờ "toàn hệ thống" — chỉ Giám đốc / CEO. */
  allLocations: boolean;
}

/** Thân phản hồi của `POST {DOTNET}/auth/login` và `/auth/refresh`. */
export interface DotnetAuthResponse {
  accessToken: string;
  refreshToken: string;
  /** Hạn access token, tính bằng giây. */
  expiresIn: number;
  /** Hạn refresh token, tính bằng giây. Thiếu thì dùng mặc định 30 ngày. */
  refreshExpiresIn?: number;
  user: UserProfile;
}
