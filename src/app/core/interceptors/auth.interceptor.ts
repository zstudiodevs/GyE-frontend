import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { AuthStoreService } from '../services/auth-store.service';

// ── Shared refresh state ──────────────────────────────────────────────────────
// Module-level so that concurrent requests during a refresh cycle share state.
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

/** Endpoints públicos de autenticación que no deben llevar el token (evita bucles). */
const AUTH_URL_PATTERN = /\/api\/Auth\/(login|refresh|logout|register)/i;

// ── Interceptor ───────────────────────────────────────────────────────────────

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(AuthStoreService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Pasar las rutas de autenticación sin modificar.
  if (AUTH_URL_PATTERN.test(req.url)) {
    return next(req);
  }

  const token = store.accessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError(error => {
      // Solo manejar respuestas 401; propagar el resto.
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // Si ya hay un refresh en curso, encolar esta request hasta que termine.
      if (isRefreshing) {
        return refreshSubject.pipe(
          filter((t): t is string => t !== null),
          take(1),
          switchMap(newToken =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })),
          ),
        );
      }

      // Iniciar el flujo de refresco.
      isRefreshing = true;
      refreshSubject.next(null);

      return authService.refresh().pipe(
        switchMap(tokens => {
          isRefreshing = false;
          refreshSubject.next(tokens.accessToken);
          return next(
            req.clone({ setHeaders: { Authorization: `Bearer ${tokens.accessToken}` } }),
          );
        }),
        catchError(refreshError => {
          isRefreshing = false;
          refreshSubject.next(null);
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
