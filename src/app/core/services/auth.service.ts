import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, firstValueFrom, map, of, tap } from 'rxjs';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthStoreService } from './auth-store.service';
import { AuthTokens, LoginRequest, RefreshRequest } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AuthStoreService);
  private readonly baseUrl = environment.apiUrl;

  /** Autentica al usuario y persiste la sesión en el store. */
  login(request: LoginRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.baseUrl}/api/Auth/login`, request).pipe(
      tap(tokens => this.store.setSession(tokens)),
    );
  }

  /**
   * Solicita un nuevo par de tokens usando el refresh token almacenado.
   * Actualiza la sesión en el store si el backend responde con éxito.
   */
  refresh(): Observable<AuthTokens> {
    const refreshToken = this.store.refreshToken();
    if (!refreshToken) {
      throw new Error('No hay refresh token disponible.');
    }
    const body: RefreshRequest = { refreshToken };
    return this.http.post<AuthTokens>(`${this.baseUrl}/api/Auth/refresh`, body).pipe(
      tap(tokens => this.store.setSession(tokens)),
    );
  }

  /** Cierra la sesión limpiando el store y el localStorage. */
  logout(): void {
    this.store.clearSession();
  }

  /**
   * Llamado en el arranque de la app (APP_INITIALIZER).
   * Si existe un refresh token almacenado, intenta renovar la sesión
   * silenciosamente. Si falla (token expirado), limpia la sesión.
   */
  initSession(): Promise<void> {
    if (!this.store.refreshToken()) return Promise.resolve();

    return firstValueFrom(
      this.refresh().pipe(
        catchError(() => {
          this.store.clearSession();
          return of(null);
        }),
        map(() => undefined),
      ),
    );
  }
}
