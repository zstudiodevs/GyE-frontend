import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError as rxCatchError, EMPTY as rxEMPTY } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/services/auth.service';
import { AuthStoreService } from '../../core/services/auth-store.service';
import type { UpdateMeRequest } from '../../core/models/auth.models';
import type { UserProfile } from '../../core/models/user.models';

@Component({
  selector: 'app-perfil',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent {
  private readonly authService = inject(AuthService);
  readonly authStore = inject(AuthStoreService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phoneNumber: [''],
    birthDate: new FormControl<Date | null>(null),
    email: [{ value: '', disabled: true }],
  });

  readonly saving = signal(false);
  readonly isDirty = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);

  /** Perfil con datos frescos del servidor (roles como strings). Null hasta la primera respuesta. */
  readonly profile = signal<UserProfile | null>(null);

  readonly fullName = this.authStore.fullName;
  readonly initials = computed(() => {
    const u = this.authStore.user();
    if (!u) return '';
    return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
  });
  readonly displayRoles = computed(() => this.profile()?.roles ?? this.authStore.user()?.roles.map(r => r.name) ?? []);

  constructor() {
    const local = this.authStore.user();
    if (local) this.patchForm(local);

    this.authService.getMe().pipe(
      rxCatchError(() => {
        this.loadError.set('No se pudo obtener el perfil actualizado del servidor.');
        return rxEMPTY;
      }),
      takeUntilDestroyed(),
    ).subscribe(profile => {
      this.profile.set(profile);
      this.authStore.patchUserFields(profile);
      this.patchForm(profile);
    });

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.isDirty.set(this.form.dirty);
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving() || !this.isDirty()) return;

    this.saving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const { firstName, lastName, phoneNumber, birthDate } = this.form.getRawValue();
    const request: UpdateMeRequest = {
      firstName: firstName!,
      lastName: lastName!,
      phoneNumber: phoneNumber ?? '',
      birthDate: this.dateToIso(birthDate),
    };

    this.authService.updateMe(request).subscribe({
      next: (profile: UserProfile) => {
        this.profile.set(profile);
        this.authStore.patchUserFields(profile);
        this.patchForm(profile);
        this.saving.set(false);
        this.successMessage.set('Perfil actualizado correctamente.');
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('No se pudo actualizar el perfil. Intentá de nuevo.');
      },
    });
  }

  resetForm(): void {
    const p = this.profile();
    if (p) {
      this.patchForm(p);
    } else {
      const u = this.authStore.user();
      if (u) this.patchForm(u);
    }
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private patchForm(data: Pick<UserProfile, 'firstName' | 'lastName' | 'phoneNumber' | 'birthDate' | 'email'>): void {
    this.form.patchValue({
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      birthDate: this.isoToDate(data.birthDate),
      email: data.email,
    });
    this.form.markAsPristine();
    this.isDirty.set(false);
  }

  private isoToDate(iso: string): Date | null {
    if (!iso) return null;
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private dateToIso(date: Date | null): string {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
