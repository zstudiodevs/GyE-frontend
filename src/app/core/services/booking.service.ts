import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiResponse, PaginationMeta } from '../models/api.models';
import type {
  BookingResponse,
  BookingWithParticipantsResponse,
  CreateBookingRequest,
  InviteParticipantRequest,
} from '../models/booking.models';

export interface BookingPage {
  bookings: BookingResponse[];
  pagination: PaginationMeta;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** GET /api/Bookings — Lista paginada de todas las reservas. */
  getBookings(pageNumber = 1, pageSize = 20): Observable<BookingPage> {
    const params = new HttpParams()
      .set('PageNumber', pageNumber)
      .set('PageSize', pageSize);

    return this.http.get<ApiResponse<BookingResponse[]>>(`${this.baseUrl}/api/Bookings`, { params }).pipe(
      map(r => ({
        bookings: r.data ?? [],
        pagination: r.pagination!,
      })),
    );
  }

  /** GET /api/Bookings/my — Reservas del usuario autenticado, paginadas. */
  getMyBookings(pageNumber = 1, pageSize = 20): Observable<BookingPage> {
    const params = new HttpParams()
      .set('PageNumber', pageNumber)
      .set('PageSize', pageSize);

    return this.http.get<ApiResponse<BookingResponse[]>>(`${this.baseUrl}/api/Bookings/my`, { params }).pipe(
      map(r => ({
        bookings: r.data ?? [],
        pagination: r.pagination!,
      })),
    );
  }

  /** GET /api/Bookings/{id} — Detalle de una reserva con participantes. */
  getBooking(id: string): Observable<BookingWithParticipantsResponse> {
    return this.http.get<ApiResponse<BookingWithParticipantsResponse>>(`${this.baseUrl}/api/Bookings/${id}`).pipe(
      map(r => r.data!),
    );
  }

  /** POST /api/Bookings — Crea una nueva reserva. */
  createBooking(req: CreateBookingRequest): Observable<BookingResponse> {
    return this.http.post<ApiResponse<BookingResponse>>(`${this.baseUrl}/api/Bookings`, req).pipe(
      map(r => r.data!),
    );
  }

  /** POST /api/Bookings/{id}/invite — Invita a un socio a una reserva. */
  inviteParticipant(id: string, req: InviteParticipantRequest): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/api/Bookings/${id}/invite`, req).pipe(
      map(() => undefined),
    );
  }

  /** POST /api/Bookings/{id}/accept — El usuario autenticado acepta la invitación. */
  acceptBooking(id: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/api/Bookings/${id}/accept`, null).pipe(
      map(() => undefined),
    );
  }

  /** PATCH /api/Bookings/{id}/cancel — Cancela una reserva. */
  cancelBooking(id: string): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/api/Bookings/${id}/cancel`, null).pipe(
      map(() => undefined),
    );
  }

  /** PATCH /api/Bookings/{id}/complete — Marca una reserva como completada. */
  completeBooking(id: string): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/api/Bookings/${id}/complete`, null).pipe(
      map(() => undefined),
    );
  }

  /** PATCH /api/Bookings/{id}/abandon — El usuario autenticado abandona la reserva. */
  abandonBooking(id: string): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/api/Bookings/${id}/abandon`, null).pipe(
      map(() => undefined),
    );
  }
}
