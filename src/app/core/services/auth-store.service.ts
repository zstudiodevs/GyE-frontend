import { computed, Injectable, signal } from '@angular/core';

import { AuthTokens } from '../models/auth.models';
import { Role } from '../models/role.models';
import { User } from '../models/user.models';

const STORAGE_USER_KEY = 'gye-user';
const STORAGE_ACCESS_TOKEN_KEY = 'gye-access-token';
const STORAGE_REFRESH_TOKEN_KEY = 'gye-refresh-token';

@Injectable({ providedIn: 'root' })
export class AuthStoreService {
  private readonly _user = signal<User | null>(this.readJson<User>(STORAGE_USER_KEY));
  private readonly _accessToken = signal<string | null>(localStorage.getItem(STORAGE_ACCESS_TOKEN_KEY));
  private readonly _refreshToken = signal<string | null>(localStorage.getItem(STORAGE_REFRESH_TOKEN_KEY));

  /** Usuario autenticado actualmente, o `null` si no hay sesión. */
  readonly user = this._user.asReadonly();

  /** Access token JWT en memoria. Se persiste en `localStorage` para sobrevivir recargas. */
  readonly accessToken = this._accessToken.asReadonly();

  /** Refresh token JWT. Se persiste en `localStorage`. */
  readonly refreshToken = this._refreshToken.asReadonly();

  /** `true` si hay un usuario y un access token válidos en el store. */
  readonly isAuthenticated = computed(() => this._user() !== null && this._accessToken() !== null);

  /** Nombre completo del usuario autenticado, o cadena vacía si no hay sesión. */
  readonly fullName = computed(() => {
    const u = this._user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  /** Lista de roles del usuario autenticado. */
  readonly roles = computed<Role[]>(() => this._user()?.roles ?? []);

  /** `true` si el usuario tiene el rol Administrador. */
  readonly isAdmin = computed(() =>
    this._user()?.roles.some(r => r.name === 'Administrador') ?? false
  );

  /**
   * Almacena la sesión tras un login o refresh exitoso.
   * Persiste el usuario y los tokens en `localStorage`.
   */
  setSession(tokens: AuthTokens): void {
    this._user.set(tokens.user);
    this._accessToken.set(tokens.accessToken);
    this._refreshToken.set(tokens.refreshToken);

    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(tokens.user));
    localStorage.setItem(STORAGE_ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(STORAGE_REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  /**
   * Limpia la sesión actual.
   * Elimina usuario y tokens tanto de los signals como de `localStorage`.
   */
  clearSession(): void {
    this._user.set(null);
    this._accessToken.set(null);
    this._refreshToken.set(null);

    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_ACCESS_TOKEN_KEY);
    localStorage.removeItem(STORAGE_REFRESH_TOKEN_KEY);
  }

  /** Devuelve `true` si el usuario autenticado tiene el rol indicado. */
  hasRole(roleName: string): boolean {
    return this._user()?.roles.some(r => r.name === roleName) ?? false;
  }

  private readJson<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
}
