import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, EMPTY, Subject, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { RoleService } from '../../../core/services/role.service';
import type { Role } from '../../../core/models/role.models';

@Component({
  selector: 'app-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    MatPaginatorModule,
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent {
  private readonly roleService = inject(RoleService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly loadPage$ = new Subject<void>();

  readonly roles = signal<Role[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly totalCount = signal(0);
  readonly pageSize = signal(20);
  readonly pageNumber = signal(1);
  readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  readonly displayedColumns = ['nombre', 'descripcion', 'acciones'];

  constructor() {
    this.loadPage$.pipe(
      switchMap(() =>
        this.roleService.getRoles(this.pageNumber(), this.pageSize()).pipe(
          catchError(() => {
            this.errorMessage.set('No se pudieron cargar los roles. Intentá de nuevo.');
            this.loading.set(false);
            return EMPTY;
          }),
        ),
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ roles, pagination }) => {
      this.roles.set(roles);
      this.totalCount.set(pagination.totalCount);
      this.loading.set(false);
    });

    this.loadPage$.next();
  }

  loadRoles(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.loadPage$.next();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadRoles();
  }

  openCreateDialog(): void {
    this.router.navigate(['/admin/roles/new']);
  }

  openEditDialog(role: Role): void {
    this.router.navigate(['/admin/roles', role.id, 'edit']);
  }
}
