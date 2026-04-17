import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, EMPTY, forkJoin, of, startWith, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper';

import { BookingService } from '../../../core/services/booking.service';
import { CourtService } from '../../../core/services/court.service';
import { UserAdminService } from '../../../core/services/user-admin.service';
import { BookingType, BookingVisibility } from '../../../core/models/booking.models';
import type { CourtResponse } from '../../../core/models/court.models';
import type { UserListItem } from '../../../core/models/user.models';

@Component({
  selector: 'app-nueva-reserva',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatStepperModule,
  ],
  templateUrl: './nueva-reserva.component.html',
  styleUrl: './nueva-reserva.component.scss',
})
export class NuevaReservaComponent {
  private readonly bookingService = inject(BookingService);
  private readonly courtService = inject(CourtService);
  private readonly userService = inject(UserAdminService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly BookingType = BookingType;
  readonly BookingVisibility = BookingVisibility;

  // ── Formularios por paso ───────────────────────────────────────────────────

  readonly step1 = this.fb.group({
    courtId: ['', Validators.required],
    date: [null as Date | null, Validators.required],
  });

  readonly step2 = this.fb.group({
    startTime: ['', Validators.required],
  });

  readonly step3 = this.fb.group({
    visibility: [BookingVisibility.Open as BookingVisibility, Validators.required],
  });

  // ── Señales reactivas derivadas de formularios ─────────────────────────────

  readonly bookingVisibility = toSignal(
    this.step3.controls.visibility.valueChanges.pipe(startWith(BookingVisibility.Open)),
    { initialValue: BookingVisibility.Open },
  );

  // ── Datos ─────────────────────────────────────────────────────────────────

  readonly courts = signal<CourtResponse[]>([]);
  readonly courtsLoading = signal(true);

  readonly slots = signal<string[]>([]);
  readonly slotsLoading = signal(false);
  readonly slotsError = signal(false);

  readonly users = signal<UserListItem[]>([]);
  readonly usersLoading = signal(false);
  readonly userFilter = signal('');

  readonly selectedUserIds = signal<Set<string>>(new Set());

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly minDate = new Date();

  constructor() {
    this.courtService.getCourts(1, 100).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.courtsLoading.set(false);
        return EMPTY;
      }),
    ).subscribe(({ courts }) => {
      this.courts.set(courts.filter(c => c.active));
      this.courtsLoading.set(false);
    });
  }

  // ── Métodos de carga ───────────────────────────────────────────────────────

  onStepChange(event: StepperSelectionEvent): void {
    if (event.selectedIndex === 1) {
      this.loadSlots();
    }
    if (event.selectedIndex === 3 && this.bookingVisibility() !== BookingVisibility.Open) {
      this.loadUsers();
    }
  }

  loadSlots(): void {
    const courtId = this.step1.controls.courtId.value;
    const date = this.step1.controls.date.value;
    if (!courtId || !date) return;

    this.slotsLoading.set(true);
    this.slotsError.set(false);
    this.step2.controls.startTime.reset('');
    this.slots.set([]);

    this.courtService.getCourtSlots(courtId, this.toDateString(date)).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.slotsError.set(true);
        this.slotsLoading.set(false);
        return EMPTY;
      }),
    ).subscribe(slots => {
      this.slots.set(slots);
      this.slotsLoading.set(false);
    });
  }

  loadUsers(): void {
    if (this.users().length > 0) return;
    this.usersLoading.set(true);

    this.userService.getUsers(1, 100).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.usersLoading.set(false);
        return EMPTY;
      }),
    ).subscribe(({ users }) => {
      this.users.set(users);
      this.usersLoading.set(false);
    });
  }

  // ── Invitados ──────────────────────────────────────────────────────────────

  filteredUsers(): UserListItem[] {
    const filter = this.userFilter().toLowerCase();
    if (!filter) return this.users();
    return this.users().filter(u =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.membershipId}`.toLowerCase().includes(filter),
    );
  }

  toggleUser(userId: string): void {
    this.selectedUserIds.update(set => {
      const next = new Set(set);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUserIds().has(userId);
  }

  onFilterChange(event: Event): void {
    this.userFilter.set((event.target as HTMLInputElement).value);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  submit(): void {
    if (this.submitting() || this.step1.invalid || this.step2.invalid || this.step3.invalid) return;

    this.submitting.set(true);
    this.submitError.set(null);

    const invitees = [...this.selectedUserIds()];

    this.bookingService.createBooking({
      courtId: this.step1.controls.courtId.value!,
      date: this.toDateString(this.step1.controls.date.value!),
      startTime: this.step2.controls.startTime.value!,
      visibility: this.step3.controls.visibility.value!,
    }).pipe(
      switchMap(booking => {
        if (invitees.length === 0) return of(null);
        return forkJoin(
          invitees.map(userId =>
            this.bookingService.inviteParticipant(booking.id, { userId }).pipe(
              catchError(() => of(null)),
            ),
          ),
        );
      }),
      catchError(() => {
        this.submitError.set('No se pudo crear la reserva. Intentá de nuevo.');
        this.submitting.set(false);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.submitting.set(false);
      this.router.navigate(['/reservas']);
    });
  }

  goBack(): void {
    this.router.navigate(['/reservas']);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private toDateString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
