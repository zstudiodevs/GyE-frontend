import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { catchError, EMPTY, forkJoin, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RoleService } from '../../../../core/services/role.service';
import { PermissionService } from '../../../../core/services/permission.service';
import type { PermissionsByFeature } from '../../../../core/services/permission.service';
import type { Role, RoleWithPermissions } from '../../../../core/models/role.models';

/** Pasar `role` para editar, omitirlo para crear. */
export interface RoleDialogData {
  role?: Role;
}

export interface RoleDialogResult {
  savedRole: Role;
}

@Component({
  selector: 'app-role-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './role-dialog.component.html',
  styleUrl: './role-dialog.component.scss',
})
export class RoleDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<RoleDialogComponent>);
  private readonly data = inject<RoleDialogData>(MAT_DIALOG_DATA);
  private readonly roleService = inject(RoleService);
  private readonly permissionService = inject(PermissionService);
  private readonly fb = inject(FormBuilder);

  readonly isEditing = !!this.data.role;
  readonly role = this.data.role ?? null;

  readonly form = this.fb.group({
    name: [this.role?.name ?? '', Validators.required],
    description: [this.role?.description ?? '', Validators.required],
  });

  readonly permissionsByFeature = signal<PermissionsByFeature>({});
  readonly featureNames = computed(() => Object.keys(this.permissionsByFeature()).sort());
  readonly selectedPermissionIds = signal<Set<string>>(new Set());

  /** Todos los permisos como array plano. */
  readonly allPermissions = computed(() =>
    Object.values(this.permissionsByFeature()).flat()
  );

  /** Permisos actualmente asignados al rol, ordenados por feature+nombre. */
  readonly assignedPermissions = computed(() =>
    this.allPermissions()
      .filter(p => this.selectedPermissionIds().has(p.id))
      .sort((a, b) => a.description.localeCompare(b.description) || a.name.localeCompare(b.name))
  );

  /** Permisos disponibles para agregar, agrupados por feature (excluye los asignados). */
  readonly availableByFeature = computed(() => {
    const result: PermissionsByFeature = {};
    for (const [feature, perms] of Object.entries(this.permissionsByFeature())) {
      const available = perms.filter(p => !this.selectedPermissionIds().has(p.id));
      if (available.length > 0) result[feature] = available;
    }
    return result;
  });

  readonly availableFeatureNames = computed(() =>
    Object.keys(this.availableByFeature()).sort()
  );

  readonly loadingData = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  constructor() {
    // Si es edición, cargar datos del rol Y permisos en paralelo
    const role$ = this.isEditing
      ? this.roleService.getRole(this.role!.id).pipe(catchError(() => of(null)))
      : of(null);

    forkJoin({
      roleDetail: role$,
      permissions: this.permissionService.getPermissionsGroupedByFeature().pipe(
        catchError(() => of(null)),
      ),
    }).subscribe(({ roleDetail, permissions }) => {
      if (!permissions) {
        this.loadError.set('No se pudieron cargar los permisos disponibles.');
        this.loadingData.set(false);
        return;
      }

      this.permissionsByFeature.set(permissions);

      if (this.isEditing && roleDetail) {
        const detail = roleDetail as RoleWithPermissions;
        this.selectedPermissionIds.set(new Set(detail.permissions.map(p => p.id)));
      }

      // En modo edición, el nombre no se puede cambiar (solo descripción y permisos)
      if (this.isEditing) {
        this.form.get('name')!.disable();
      }

      this.loadingData.set(false);
    });
  }

  isPermissionSelected(permId: string): boolean {
    return this.selectedPermissionIds().has(permId);
  }

  togglePermission(permId: string): void {
    this.selectedPermissionIds.update(set => {
      const next = new Set(set);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  }

  toggleFeature(feature: string): void {
    const perms = this.permissionsByFeature()[feature] ?? [];
    const allSelected = perms.every(p => this.selectedPermissionIds().has(p.id));
    this.selectedPermissionIds.update(set => {
      const next = new Set(set);
      for (const p of perms) {
        if (allSelected) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
      }
      return next;
    });
  }

  isFeatureFullySelected(feature: string): boolean {
    const perms = this.permissionsByFeature()[feature] ?? [];
    return perms.length > 0 && perms.every(p => this.selectedPermissionIds().has(p.id));
  }

  isFeaturePartiallySelected(feature: string): boolean {
    const perms = this.permissionsByFeature()[feature] ?? [];
    const count = perms.filter(p => this.selectedPermissionIds().has(p.id)).length;
    return count > 0 && count < perms.length;
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.saveError.set(null);

    const permissionIds = Array.from(this.selectedPermissionIds());

    const save$ = this.isEditing
      ? this.roleService.updateRole(this.role!.id, {
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
    ).subscribe(savedRole => {
      this.dialogRef.close({ savedRole } satisfies RoleDialogResult);
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
