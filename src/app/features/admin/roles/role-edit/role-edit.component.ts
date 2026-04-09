import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RoleService } from '../../../../core/services/role.service';
import { PermissionService } from '../../../../core/services/permission.service';
import type { PermissionsByFeature } from '../../../../core/services/permission.service';

@Component({
  selector: 'app-role-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './role-edit.component.html',
  styleUrl: './role-edit.component.scss',
})
export class RoleEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roleService = inject(RoleService);
  private readonly permissionService = inject(PermissionService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly roleId = this.route.snapshot.paramMap.get('id');
  readonly isEditing = !!this.roleId;
  readonly roleName = signal('');

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
  });

  readonly permissionsByFeature = signal<PermissionsByFeature>({});
  readonly featureNames = computed(() => Object.keys(this.permissionsByFeature()).sort());
  readonly selectedPermissionIds = signal<Set<string>>(new Set());

  /** Snapshot inmutable del estado inicial — se usa para detectar cambios en permisos. */
  private initialPermissionIds = new Set<string>();

  readonly loadingData = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  /** Señal que se actualiza cada vez que el formulario cambia — permite que hasChanges sea computed. */
  private readonly formValues = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  // ── Computed signals ──────────────────────────────────────────────────────

  readonly featureStats = computed(() => {
    const stats: Record<string, { total: number; selected: number }> = {};
    for (const [feature, perms] of Object.entries(this.permissionsByFeature())) {
      const selected = perms.filter(p => this.selectedPermissionIds().has(p.id)).length;
      stats[feature] = { total: perms.length, selected };
    }
    return stats;
  });

  readonly totalSelected = computed(() =>
    this.featureNames().reduce((sum, f) => sum + (this.featureStats()[f]?.selected ?? 0), 0)
  );

  readonly hasPermissionChanges = computed(() => {
    const current = this.selectedPermissionIds();
    if (current.size !== this.initialPermissionIds.size) return true;
    for (const id of current) {
      if (!this.initialPermissionIds.has(id)) return true;
    }
    return false;
  });

  readonly hasChanges = computed(() => {
    this.formValues(); // lectura para que el computed se invalide al cambiar el form
    return this.form.dirty || this.hasPermissionChanges();
  });

  // ── Constructor ───────────────────────────────────────────────────────────

  constructor() {
    this.loadData();
  }

  // ── Carga de datos ────────────────────────────────────────────────────────

  private loadData(): void {
    if (!this.isEditing) {
      // Creación: solo necesitamos la lista completa de permisos
      this.permissionService.getPermissionsGroupedByFeature().pipe(
        catchError(() => {
          this.loadError.set('No se pudieron cargar los permisos disponibles. Intentá de nuevo.');
          this.loadingData.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(allPerms => {
        this.permissionsByFeature.set(allPerms);
        this.loadingData.set(false);
      });
      return;
    }

    // Edición: 1) rol con sus permisos asignados → 2) todos los permisos del sistema
    this.roleService.getRole(this.roleId!).pipe(
      catchError(() => {
        this.loadError.set('No se pudieron cargar los datos del rol. Intentá de nuevo.');
        this.loadingData.set(false);
        return EMPTY;
      }),
      switchMap(role => {
        // Poblar formulario
        this.roleName.set(role.name);
        this.form.patchValue({ name: role.name, description: role.description });
        this.form.markAsPristine();

        // Guardar snapshot de IDs asignados
        const assignedIds = (role.permissions ?? []).map(p => p.id);
        this.initialPermissionIds = new Set(assignedIds);
        this.selectedPermissionIds.set(new Set(assignedIds));

        // Traer TODOS los permisos del sistema para construir la lista completa
        return this.permissionService.getPermissionsGroupedByFeature().pipe(
          catchError(() => {
            this.loadError.set('No se pudieron cargar los permisos disponibles. Intentá de nuevo.');
            this.loadingData.set(false);
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(allPerms => {
      this.permissionsByFeature.set(allPerms);
      this.loadingData.set(false);
    });
  }

  // ── Helpers de estado ─────────────────────────────────────────────────────

  isPermissionSelected(permId: string): boolean {
    return this.selectedPermissionIds().has(permId);
  }

  isFeatureFullySelected(feature: string): boolean {
    const s = this.featureStats()[feature];
    return !!s && s.total > 0 && s.selected === s.total;
  }

  isFeaturePartiallySelected(feature: string): boolean {
    const s = this.featureStats()[feature];
    return !!s && s.selected > 0 && s.selected < s.total;
  }

  // ── Mutaciones ────────────────────────────────────────────────────────────

  togglePermission(permId: string): void {
    this.selectedPermissionIds.update(set => {
      const next = new Set(set);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  }

  toggleFeature(feature: string, checked: boolean): void {
    const perms = this.permissionsByFeature()[feature] ?? [];
    this.selectedPermissionIds.update(set => {
      const next = new Set(set);
      for (const p of perms) {
        if (checked) next.add(p.id);
        else next.delete(p.id);
      }
      return next;
    });
  }

  // ── Acciones ──────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/admin/roles']);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    const permissionIds = Array.from(this.selectedPermissionIds());

    const save$ = this.isEditing
      ? this.roleService.updateRole(this.roleId!, {
          description: this.form.value.description!,
          permissionIds,
        })
      : this.roleService.createRole({
          name: this.form.value.name!,
          description: this.form.value.description!,
          permissionIds,
        });

    save$.pipe(
      catchError(() => {
        this.saveError.set('No se pudieron guardar los cambios. Intentá de nuevo.');
        this.saving.set(false);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      // Actualizar snapshot → hasChanges vuelve a false antes de navegar
      this.initialPermissionIds = new Set(permissionIds);
      this.form.markAsPristine();
      this.router.navigate(['/admin/roles']);
    });
  }
}
