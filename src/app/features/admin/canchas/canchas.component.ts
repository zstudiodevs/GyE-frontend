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
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CourtService } from '../../../core/services/court.service';
import type { CourtResponse } from '../../../core/models/court.models';
import {
  CourtDialogComponent,
  type CourtDialogData,
  type CourtDialogResult,
} from './dialogs/court-dialog.component';

@Component({
  selector: 'app-canchas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './canchas.component.html',
  styleUrl: './canchas.component.scss',
})
export class CanchasComponent {
  private readonly courtService = inject(CourtService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly loadPage$ = new Subject<void>();

  readonly courts = signal<CourtResponse[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly togglingId = signal<string | null>(null);

  readonly totalCount = signal(0);
  readonly pageSize = signal(20);
  readonly pageNumber = signal(1);
  readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  readonly displayedColumns = ['estado', 'direccion', 'acciones'];

  constructor() {
    this.loadPage$.pipe(
      switchMap(() =>
        this.courtService.getCourts(this.pageNumber(), this.pageSize()).pipe(
          catchError(() => {
            this.errorMessage.set('No se pudieron cargar las canchas. Intentá de nuevo.');
            this.loading.set(false);
            return EMPTY;
          }),
        ),
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ courts, pagination }) => {
      this.courts.set(courts);
      this.totalCount.set(pagination.totalCount);
      this.loading.set(false);
    });

    this.loadPage$.next();
  }

  loadCourts(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.loadPage$.next();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadCourts();
  }

  openCreateDialog(): void {
    const ref = this.dialog.open<CourtDialogComponent, CourtDialogData, CourtDialogResult>(
      CourtDialogComponent,
      { width: '400px', data: { court: null } },
    );

    ref.afterClosed().pipe(
      filter((result): result is CourtDialogResult => !!result),
      switchMap(result =>
        this.courtService.createCourt({ address: result.address }).pipe(
          catchError(() => EMPTY),
        ),
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(newCourt => {
      this.courts.update(list => [newCourt, ...list]);
      this.totalCount.update(n => n + 1);
    });
  }

  openEditDialog(court: CourtResponse): void {
    const ref = this.dialog.open<CourtDialogComponent, CourtDialogData, CourtDialogResult>(
      CourtDialogComponent,
      { width: '400px', data: { court } },
    );

    ref.afterClosed().pipe(
      filter((result): result is CourtDialogResult => !!result),
      switchMap(result =>
        this.courtService.updateCourt(court.id, { address: result.address }).pipe(
          catchError(() => EMPTY),
        ),
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(updated => {
      this.courts.update(list => list.map(c => c.id === updated.id ? updated : c));
    });
  }

  toggleActive(court: CourtResponse): void {
    this.togglingId.set(court.id);
    const action$ = court.active
      ? this.courtService.deactivateCourt(court.id)
      : this.courtService.activateCourt(court.id);

    action$.pipe(
      catchError(() => {
        this.togglingId.set(null);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.courts.update(list =>
        list.map(c => c.id === court.id ? { ...c, active: !c.active } : c),
      );
      this.togglingId.set(null);
    });
  }
}
