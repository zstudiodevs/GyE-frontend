import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { catchError, EMPTY } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UserAdminService } from '../../../../core/services/user-admin.service';
import { RoleService } from '../../../../core/services/role.service';
import type { UserListItem } from '../../../../core/models/user.models';
import type { Role } from '../../../../core/models/role.models';

export interface UserRolesDialogData {
  user: UserListItem;
}

export interface UserRolesDialogResult {
  updatedUser: UserListItem;
}

@Component({
  selector: 'app-user-roles-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-roles-dialog.component.html',
  styleUrl: './user-roles-dialog.component.scss',
})
export class UserRolesDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<UserRolesDialogComponent>);
  private readonly data = inject<UserRolesDialogData>(MAT_DIALOG_DATA);
  private readonly userAdminService = inject(UserAdminService);
  private readonly roleService = inject(RoleService);

  readonly user = this.data.user;

  readonly allRoles = signal<Role[]>([]);
  readonly loadingRoles = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  /** Set de nombres de roles actualmente seleccionados. */
  readonly selectedRoleNames = signal<Set<string>>(new Set(this.user.roles));

  readonly hasChanges = computed(() => {
    const original = new Set(this.user.roles);
    const current = this.selectedRoleNames();
    if (original.size !== current.size) return true;
    for (const name of original) {
      if (!current.has(name)) return true;
    }
    return false;
  });

  constructor() {
    this.roleService.getRoles(1, 100).pipe(
      catchError(() => {
        this.loadError.set('No se pudieron cargar los roles disponibles.');
        this.loadingRoles.set(false);
        return EMPTY;
      }),
    ).subscribe(({ roles }) => {
      this.allRoles.set(roles);
      this.loadingRoles.set(false);
    });
  }

  isSelected(roleName: string): boolean {
    return this.selectedRoleNames().has(roleName);
  }

  toggleRole(roleName: string): void {
    this.selectedRoleNames.update(set => {
      const next = new Set(set);
      if (next.has(roleName)) {
        next.delete(roleName);
      } else {
        next.add(roleName);
      }
      return next;
    });
  }

  save(): void {
    this.saving.set(true);
    this.saveError.set(null);

    const selectedNames = this.selectedRoleNames();
    const roleIds = this.allRoles()
      .filter(r => selectedNames.has(r.name))
      .map(r => r.id);

    this.userAdminService.updateUserRoles(this.user, roleIds).pipe(
      catchError(() => {
        this.saveError.set('No se pudieron guardar los cambios. Intentá de nuevo.');
        this.saving.set(false);
        return EMPTY;
      }),
    ).subscribe(updatedUser => {
      this.dialogRef.close({ updatedUser } satisfies UserRolesDialogResult);
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
