import { Routes } from '@angular/router';

import { AdminComponent } from './admin.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: 'usuarios',
        pathMatch: 'full',
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./usuarios/usuarios.component').then(m => m.UsuariosComponent),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./roles/roles.component').then(m => m.RolesComponent),
      },
      {
        path: 'canchas',
        loadComponent: () =>
          import('./canchas/canchas.component').then(m => m.CanchasComponent),
      },
      {
        path: 'roles/new',
        loadComponent: () =>
          import('./roles/role-edit/role-edit.component').then(m => m.RoleEditComponent),
      },
      {
        path: 'roles/:id/edit',
        loadComponent: () =>
          import('./roles/role-edit/role-edit.component').then(m => m.RoleEditComponent),
      },
    ],
  },
];
