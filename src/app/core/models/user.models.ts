import { Role } from './role.models';

// ── Entidad ───────────────────────────────────────────────────────────────────

/** Representa a un socio del club tal como lo devuelve el backend. */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  birthDate: string; // ISO date: YYYY-MM-DD
  membershipId: string;
  roles: Role[];
}

// ── Requests ──────────────────────────────────────────────────────────────────

/** POST /api/Users */
export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate: string; // ISO date: YYYY-MM-DD
  password: string;
  membershipId: string;
}

/** PUT /api/Users/{id} */
export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate: string; // ISO date: YYYY-MM-DD
  roleIds: string[];
}
