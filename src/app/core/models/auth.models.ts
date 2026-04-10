import { User } from './user.models';

// ── Requests ──────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RegisterRequest {
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    birthDate: string; // ISO date: YYYY-MM-DD
    password: string;
    membershipId: string;
  };
}

export interface UpdateMeRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  birthDate: string; // ISO date: YYYY-MM-DD
}

// ── Responses ─────────────────────────────────────────────────────────────────

/** data de POST /api/Auth/login y POST /api/Auth/refresh */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}
