import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, filter, Subject, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { UserAdminService } from '../../../core/services/user-admin.service';
import type { UserListItem } from '../../../core/models/user.models';
import {
  UserRolesDialogComponent,
  type UserRolesDialogData,
  type UserRolesDialogResult,
} from './dialogs/user-roles-dialog.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    MatPaginatorModule,
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent {
  private readonly userAdminService = inject(UserAdminService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly loadPage$ = new Subject<void>();

  readonly users = signal<UserListItem[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly togglingId = signal<string | null>(null);

  readonly totalCount = signal(0);
  readonly pageSize = signal(20);
  readonly pageNumber = signal(1);
  readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  readonly displayedColumns = ['estado', 'nombre', 'socio', 'email', 'roles', 'acciones'];

  constructor() {
    this.loadPage$.pipe(
      switchMap(() =>
        this.userAdminService.getUsers(this.pageNumber(), this.pageSize()).pipe(
          catchError(() => {
            this.errorMessage.set('No se pudieron cargar los usuarios. Intentá de nuevo.');
            this.loading.set(false);
            return EMPTY;
          }),
        ),
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ users, pagination }) => {
      this.users.set(users);
      this.totalCount.set(pagination.totalCount);
      this.loading.set(false);
    });

    this.loadPage$.next();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.loadPage$.next();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  toggleActive(user: UserListItem): void {
    this.togglingId.set(user.id);
    const action$ = user.isActive
      ? this.userAdminService.deactivateUser(user.id)
      : this.userAdminService.activateUser(user.id);

    action$.pipe(
      catchError(() => {
        this.togglingId.set(null);
        return EMPTY;
      }),
    ).subscribe(() => {
      this.users.update(list =>
        list.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u)
      );
      this.togglingId.set(null);
    });
  }

  initials(user: UserListItem): string {
    return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  }

  openRolesDialog(user: UserListItem): void {
    const isMobile = window.innerWidth < 768;
    this.dialog.open<UserRolesDialogComponent, UserRolesDialogData, UserRolesDialogResult>(
      UserRolesDialogComponent,
      {
        data: { user },
        width: isMobile ? '100vw' : '520px',
        maxWidth: '100vw',
        height: isMobile ? '100dvh' : 'auto',
        maxHeight: isMobile ? '100dvh' : '90dvh',
        panelClass: isMobile ? 'dialog-fullscreen' : '',
      },
    ).afterClosed().pipe(
      filter((result): result is UserRolesDialogResult => !!result),
    ).subscribe(({ updatedUser }) => {
      this.users.update(list =>
        list.map(u => u.id === updatedUser.id ? updatedUser : u)
      );
    });
  }
}
