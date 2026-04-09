import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse, PaginationMeta } from '../models/api.models';
import type { Role, RoleWithPermissions, CreateRoleRequest, UpdateRoleRequest } from '../models/role.models';

export interface RolePage {
  roles: Role[];
  pagination: PaginationMeta;
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** GET /api/Roles — Lista paginada de roles. */
  getRoles(pageNumber = 1, pageSize = 50): Observable<RolePage> {
    const params = new HttpParams()
      .set('PageNumber', pageNumber)
      .set('PageSize', pageSize);

    return this.http.get<ApiResponse<Role[]>>(`${this.baseUrl}/api/Roles`, { params }).pipe(
      map(r => ({
        roles: r.data ?? [],
        pagination: r.pagination!,
      })),
    );
  }

  /** GET /api/Roles/{id} — Obtiene un rol con todos sus permisos asignados. */
  getRole(id: string): Observable<RoleWithPermissions> {
    return this.http.get<ApiResponse<RoleWithPermissions>>(`${this.baseUrl}/api/Roles/${id}/permissions`).pipe(
      map(r => r.data!),
    );
  }

  /** POST /api/Roles — Crea un nuevo rol. */
  createRole(request: CreateRoleRequest): Observable<Role> {
    return this.http.post<ApiResponse<Role>>(`${this.baseUrl}/api/Roles`, request).pipe(
      map(r => r.data!),
    );
  }

  /** PUT /api/Roles/{id} — Actualiza descripción y permisos de un rol. */
  updateRole(id: string, request: UpdateRoleRequest): Observable<Role> {
    return this.http.put<ApiResponse<Role>>(`${this.baseUrl}/api/Roles/${id}`, request).pipe(
      map(r => r.data!),
    );
  }

  /** DELETE /api/Roles/{id} — Elimina un rol. */
  deleteRole(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/api/Roles/${id}`).pipe(
      map(() => undefined),
    );
  }
}
