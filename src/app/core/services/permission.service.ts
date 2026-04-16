import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/api.models';
import type { Permission } from '../models/role.models';

/** Permisos agrupados por feature, listos para renderizar en el dialog de roles. */
export type PermissionsByFeature = Record<string, Permission[]>;

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** GET /api/Permissions — Lista todos los permisos (sin paginación efectiva: pageSize=200). */
  getAllPermissions(): Observable<Permission[]> {
    const params = new HttpParams()
      .set('PageNumber', 1)
      .set('PageSize', 200);

    return this.http.get<ApiResponse<Permission[]>>(`${this.baseUrl}/api/Permissions`, { params }).pipe(
      map(r => r.data ?? []),
    );
  }

  /**
   * Obtiene todos los permisos y los agrupa por `feature`.
   * El resultado está ordenado: features y permisos dentro de cada feature.
   */
  getPermissionsGroupedByFeature(): Observable<PermissionsByFeature> {
    return this.getAllPermissions().pipe(
      map(permissions => {
        const grouped: PermissionsByFeature = {};
        for (const perm of permissions) {
          if (!grouped[perm.description]) {
            grouped[perm.description] = [];
          }
          grouped[perm.description].push(perm);
        }
        // Ordenar permisos dentro de cada feature por nombre
        for (const feature of Object.keys(grouped)) {
          grouped[feature].sort((a, b) => a.name.localeCompare(b.name));
        }
        return grouped;
      }),
    );
  }
}
