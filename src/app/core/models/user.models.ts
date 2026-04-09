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

/**
 * Usuario tal como lo devuelve GET /api/Users (listado).
 * El backend devuelve `roles` como array de nombres (strings), no objetos Role.
 */
export interface UserListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  birthDate: string; // ISO date: YYYY-MM-DD
  membershipId: string;
  roles: string[];
}

/**
 * Perfil del usuario autenticado devuelto por GET /api/Auth/me y PUT /api/Auth/me.
 * Difiere de `User` en que `roles` es una lista de nombres (strings), no objetos `Role`.
 */
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  birthDate: string; // ISO date: YYYY-MM-DD
  membershipId: string;
  roles: string[];
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
