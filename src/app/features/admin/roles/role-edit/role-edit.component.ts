import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
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

  readonly loadingData = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  /** Conteo de seleccionados y total por feature. */
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

  constructor() {
    const allPerms$ = this.permissionService.getPermissionsGroupedByFeature().pipe(
      catchError(() => of(null)),
    );

    const role$ = this.isEditing
      ? this.roleService.getRole(this.roleId!).pipe(catchError(() => of(null)))
      : of(null);

    const assignedIds$ = this.isEditing
      ? this.roleService.getRolePermissionIds(this.roleId!).pipe(catchError(() => of([] as string[])))
      : of([] as string[]);

    forkJoin({ role: role$, allPerms: allPerms$, assignedIds: assignedIds$ })
      .subscribe(({ role, allPerms, assignedIds }) => {
        if (!allPerms) {
          this.loadError.set('No se pudieron cargar los permisos disponibles. Intentá de nuevo.');
          this.loadingData.set(false);
          return;
        }

        if (this.isEditing && !role) {
          this.loadError.set('No se pudieron cargar los datos del rol. Intentá de nuevo.');
          this.loadingData.set(false);
          return;
        }

        this.permissionsByFeature.set(allPerms);

        if (role) {
          this.roleName.set(role.name);
          this.form.patchValue({ name: role.name, description: role.description });
          this.selectedPermissionIds.set(new Set(assignedIds));
        }

        this.loadingData.set(false);
      });
  }

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
        return of(null);
      }),
    ).subscribe(result => {
      if (result) {
        this.router.navigate(['/admin/roles']);
      }
    });
  }
}
