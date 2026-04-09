import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse, PaginationMeta } from '../models/api.models';
import type { User, UserListItem } from '../models/user.models';
import type { Role } from '../models/role.models';

export interface UserPage {
  users: UserListItem[];
  pagination: PaginationMeta;
}

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** GET /api/Users — Lista paginada de usuarios. */
  getUsers(pageNumber = 1, pageSize = 20): Observable<UserPage> {
    const params = new HttpParams()
      .set('PageNumber', pageNumber)
      .set('PageSize', pageSize);

    return this.http.get<ApiResponse<UserListItem[]>>(`${this.baseUrl}/api/Users`, { params }).pipe(
      map(r => ({
        users: r.data ?? [],
        pagination: r.pagination!,
      })),
    );
  }

  /** GET /api/Users/{id} — Obtiene un usuario por id. */
  getUser(id: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/api/Users/${id}`).pipe(
      map(r => r.data!),
    );
  }

  /** PATCH /api/Users/{id}/activate — Activa un usuario. */
  activateUser(id: string): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/api/Users/${id}/activate`, null).pipe(
      map(() => undefined),
    );
  }

  /** PATCH /api/Users/{id}/deactivate — Desactiva un usuario. */
  deactivateUser(id: string): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/api/Users/${id}/deactivate`, null).pipe(
      map(() => undefined),
    );
  }

  /** GET /api/Users/{id}/roles — Obtiene los roles asignados a un usuario. */
  getUserRoles(id: string): Observable<Role[]> {
    return this.http.get<ApiResponse<Role[]>>(`${this.baseUrl}/api/Users/${id}/roles`).pipe(
      map(r => r.data ?? []),
    );
  }

  /**
   * PUT /api/Users/{id} — Actualiza los roles de un usuario.
   * El endpoint requiere todos los campos del usuario; se pasan los datos actuales
   * junto con los nuevos roleIds.
   */
  updateUserRoles(user: UserListItem, roleIds: string[]): Observable<UserListItem> {
    const body = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      birthDate: user.birthDate,
      roleIds,
    };
    return this.http.put<ApiResponse<UserListItem>>(`${this.baseUrl}/api/Users/${user.id}`, body).pipe(
      map(r => r.data!),
    );
  }
}
