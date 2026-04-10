import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, firstValueFrom, map, of, tap } from 'rxjs';
import type { Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { AuthStoreService } from './auth-store.service';
import { AuthTokens, LoginRequest, RefreshRequest, UpdateMeRequest } from '../models/auth.models';
import type { ApiResponse } from '../models/api.models';
import type { UserProfile } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AuthStoreService);
  private readonly baseUrl = environment.apiUrl;

  /** Autentica al usuario y persiste la sesión en el store. */
  login(request: LoginRequest): Observable<AuthTokens> {
    return this.http.post<ApiResponse<AuthTokens>>(`${this.baseUrl}/api/Auth/login`, request).pipe(
      map(r => r.data!),
      tap(tokens => this.store.setSession(tokens)),
    );
  }

  /**
   * Solicita nuevos tokens usando el refresh token almacenado.
   * Actualiza la sesión completa en el store (access token, refresh token y usuario).
   */
  refresh(): Observable<AuthTokens> {
    const refreshToken = this.store.refreshToken();
    if (!refreshToken) {
      throw new Error('No hay refresh token disponible.');
    }
    const body: RefreshRequest = { refreshToken };
    return this.http.post<ApiResponse<AuthTokens>>(`${this.baseUrl}/api/Auth/refresh`, body).pipe(
      map(r => r.data!),
      tap(tokens => this.store.setSession(tokens)),
    );
  }

  /** Obtiene el perfil del usuario autenticado desde el backend. */
  getMe(): Observable<UserProfile> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.baseUrl}/api/Auth/me`).pipe(
      map(r => r.data!),
    );
  }

  /** Actualiza los datos del perfil del usuario autenticado. */
  updateMe(request: UpdateMeRequest): Observable<UserProfile> {
    return this.http.put<ApiResponse<UserProfile>>(`${this.baseUrl}/api/Auth/me`, request).pipe(
      map(r => r.data!),
    );
  }

  /** Cierra la sesión limpiando el store y el localStorage. */
  logout(): void {
    this.store.clearSession();
  }

  /**
   * Llamado en el arranque de la app (APP_INITIALIZER).
   * Si existe un refresh token almacenado, intenta renovar la sesión silenciosamente.
   * Solo limpia la sesión si el backend rechaza el token (401/403).
   * Errores de red o del servidor (5xx) se ignoran para no desloguear al usuario offline.
   */
  initSession(): Promise<void> {
    const token = this.store.refreshToken();
    // Ignorar tokens vacíos o corruptos (e.g. "undefined" guardado por versiones anteriores)
    if (!token || token === 'undefined' || token === 'null') {
      if (!token) return Promise.resolve();
      this.store.clearSession();
      return Promise.resolve();
    }

    return firstValueFrom(
      this.refresh().pipe(
        catchError((err: unknown) => {
          const status = err instanceof HttpErrorResponse ? err.status : 0;
          if (status === 401 || status === 403) {
            // Token expirado o inválido → limpiar sesión
            this.store.clearSession();
          }
          // Para errores de red (0) o 5xx, conservar la sesión (podría ser offline)
          return of(null);
        }),
        map(() => undefined),
      ),
    );
  }
}
