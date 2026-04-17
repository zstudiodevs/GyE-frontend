import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { catchError, EMPTY, Subject, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { BookingService } from '../../core/services/booking.service';
import { AuthStoreService } from '../../core/services/auth-store.service';
import { BookingStatus, BookingType, BookingVisibility } from '../../core/models/booking.models';
import type { BookingResponse } from '../../core/models/booking.models';

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    NgTemplateOutlet,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.scss',
})
export class MisTurnosComponent {
  private readonly bookingService = inject(BookingService);
  private readonly authStore = inject(AuthStoreService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadPage$ = new Subject<void>();

  readonly bookings = signal<BookingResponse[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly cancellingId = signal<string | null>(null);
  readonly abandoningId = signal<string | null>(null);

  readonly totalCount = signal(0);
  readonly pageSize = signal(20);
  readonly pageNumber = signal(1);

  readonly BookingStatus = BookingStatus;
  readonly BookingType = BookingType;
  readonly BookingVisibility = BookingVisibility;

  constructor() {
    this.loadPage$.pipe(
      switchMap(() =>
        this.bookingService.getMyBookings(this.pageNumber(), this.pageSize()).pipe(
          catchError(() => {
            this.errorMessage.set('No se pudieron cargar tus turnos. Intentá de nuevo.');
            this.loading.set(false);
            return EMPTY;
          }),
        ),
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ bookings, pagination }) => {
      this.bookings.set(bookings);
      this.totalCount.set(pagination.totalCount);
      this.loading.set(false);
    });

    this.loadPage$.next();
  }

  loadMyBookings(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.loadPage$.next();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadMyBookings();
  }

  upcoming(): BookingResponse[] {
    const now = new Date();
    return this.bookings().filter(b => {
      if (b.status === BookingStatus.Cancelled) return false;
      return new Date(`${b.date}T${b.startTime}`) >= now;
    });
  }

  past(): BookingResponse[] {
    const now = new Date();
    return this.bookings().filter(b => {
      if (b.status === BookingStatus.Cancelled) return true;
      return new Date(`${b.date}T${b.startTime}`) < now;
    });
  }

  isCreator(booking: BookingResponse): boolean {
    return booking.creatorId === this.authStore.user()?.id;
  }

  canCancel(booking: BookingResponse): boolean {
    if (!this.isCreator(booking)) return false;
    if (booking.status !== BookingStatus.Pending && booking.status !== BookingStatus.Confirmed) return false;
    const bookingTime = new Date(`${booking.date}T${booking.startTime}`);
    return bookingTime > new Date(Date.now() + 60 * 60 * 1000);
  }

  canAbandon(booking: BookingResponse): boolean {
    if (this.isCreator(booking)) return false;
    if (booking.status !== BookingStatus.Pending && booking.status !== BookingStatus.Confirmed) return false;
    const bookingTime = new Date(`${booking.date}T${booking.startTime}`);
    return bookingTime > new Date(Date.now() + 60 * 60 * 1000);
  }

  onCancel(booking: BookingResponse): void {
    this.cancellingId.set(booking.id);
    this.bookingService.cancelBooking(booking.id).pipe(
      catchError(() => {
        this.cancellingId.set(null);
        return EMPTY;
      }),
    ).subscribe(() => {
      this.cancellingId.set(null);
      this.bookings.update(list =>
        list.map(b => b.id === booking.id ? { ...b, status: BookingStatus.Cancelled } : b),
      );
    });
  }

  onAbandon(booking: BookingResponse): void {
    this.abandoningId.set(booking.id);
    this.bookingService.abandonBooking(booking.id).pipe(
      catchError(() => {
        this.abandoningId.set(null);
        return EMPTY;
      }),
    ).subscribe(() => {
      this.abandoningId.set(null);
      this.bookings.update(list => list.filter(b => b.id !== booking.id));
    });
  }

  statusLabel(status: BookingStatus): string {
    const labels: Record<BookingStatus, string> = {
      [BookingStatus.Pending]: 'Pendiente',
      [BookingStatus.Confirmed]: 'Confirmado',
      [BookingStatus.Cancelled]: 'Cancelado',
      [BookingStatus.Completed]: 'Completado',
      [BookingStatus.Abandoned]: 'Abandonado',
    };
    return labels[status] ?? 'Desconocido';
  }

  typeLabel(type: BookingType): string {
    const labels: Record<BookingType, string> = {
      [BookingType.DosVsDos]: 'Doble (2v2)',
    };
    return labels[type] ?? 'Desconocido';
  }

  visibilityLabel(visibility: BookingVisibility): string {
    const labels: Record<BookingVisibility, string> = {
      [BookingVisibility.Open]: 'Abierto',
      [BookingVisibility.Closed]: 'Cerrado',
    };
    return labels[visibility] ?? 'Desconocido';
  }

  navigateToNueva(): void {
    this.router.navigate(['/reservas', 'nueva']);
  }
}
