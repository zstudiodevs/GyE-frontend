import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse, PaginationMeta } from '../models/api.models';
import type {
  CourtResponse,
  CreateCourtRequest,
  UpdateCourtRequest,
} from '../models/court.models';

export interface CourtPage {
  courts: CourtResponse[];
  pagination: PaginationMeta;
}

@Injectable({ providedIn: 'root' })
export class CourtService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** GET /api/Courts — Lista paginada de canchas. */
  getCourts(pageNumber = 1, pageSize = 20): Observable<CourtPage> {
    const params = new HttpParams()
      .set('PageNumber', pageNumber)
      .set('PageSize', pageSize);

    return this.http.get<ApiResponse<CourtResponse[]>>(`${this.baseUrl}/api/Courts`, { params }).pipe(
      map(r => ({
        courts: r.data ?? [],
        pagination: r.pagination!,
      })),
    );
  }

  /** GET /api/Courts/{id} — Detalle de una cancha. */
  getCourt(id: string): Observable<CourtResponse> {
    return this.http.get<ApiResponse<CourtResponse>>(`${this.baseUrl}/api/Courts/${id}`).pipe(
      map(r => r.data!),
    );
  }

  /** GET /api/Courts/{id}/slots?date= — Slots horarios disponibles para una fecha. */
  getCourtSlots(id: string, date: string): Observable<string[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/api/Courts/${id}/slots`, { params }).pipe(
      map(r => r.data ?? []),
    );
  }

  /** POST /api/Courts — Crea una nueva cancha. */
  createCourt(req: CreateCourtRequest): Observable<CourtResponse> {
    return this.http.post<ApiResponse<CourtResponse>>(`${this.baseUrl}/api/Courts`, req).pipe(
      map(r => r.data!),
    );
  }

  /** PUT /api/Courts/{id} — Actualiza la dirección de una cancha. */
  updateCourt(id: string, req: UpdateCourtRequest): Observable<CourtResponse> {
    return this.http.put<ApiResponse<CourtResponse>>(`${this.baseUrl}/api/Courts/${id}`, req).pipe(
      map(r => r.data!),
    );
  }

  /** PATCH /api/Courts/{id}/activate — Activa una cancha. */
  activateCourt(id: string): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/api/Courts/${id}/activate`, null).pipe(
      map(() => undefined),
    );
  }

  /** PATCH /api/Courts/{id}/deactivate — Desactiva una cancha. */
  deactivateCourt(id: string): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/api/Courts/${id}/deactivate`, null).pipe(
      map(() => undefined),
    );
  }
}
