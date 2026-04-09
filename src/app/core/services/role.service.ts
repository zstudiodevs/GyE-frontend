import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse, PaginationMeta } from '../models/api.models';
import type { Role, CreateRoleRequest, UpdateRoleRequest } from '../models/role.models';

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

  /** GET /api/Roles/{id} — Obtiene los datos básicos de un rol. */
  getRole(id: string): Observable<Role> {
    return this.http.get<ApiResponse<Role>>(`${this.baseUrl}/api/Roles/${id}`).pipe(
      map(r => r.data!),
    );
  }

  /**
   * GET /api/Roles/{id}/permissions — Devuelve los IDs de los permisos asignados al rol.
   * Maneja todas las formas posibles de respuesta del backend.
   */
  getRolePermissionIds(id: string): Observable<string[]> {
    return this.http.get<any>(`${this.baseUrl}/api/Roles/${id}/permissions`).pipe(
      map((r): string[] => {
        // Normalizar a array plano sin importar el wrapper
        let items: any[];
        if (Array.isArray(r)) items = r;
        else if (Array.isArray(r?.data)) items = r.data;
        else if (Array.isArray(r?.data?.items)) items = r.data.items;
        else items = [];

        // Extraer el ID — el campo puede llamarse id, permissionId, etc.
        return items
          .map((p: any) => p?.id ?? p?.permissionId ?? p?.Id ?? p?.PermissionId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0);
      }),
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
