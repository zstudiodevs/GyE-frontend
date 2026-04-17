import { Routes } from '@angular/router';

import { ShellComponent } from './shell.component';
import { authGuard } from '../../core/guards/auth.guard';
import { adminGuard } from '../../core/guards/admin.guard';

export const shellRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'reservas',
        loadChildren: () =>
          import('../reservas/reservas.routes').then(m => m.reservasRoutes),
      },
      {
        path: 'mis-turnos',
        loadComponent: () =>
          import('../mis-turnos/mis-turnos.component').then(m => m.MisTurnosComponent),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('../perfil/perfil.component').then(m => m.PerfilComponent),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('../admin/admin.routes').then(m => m.adminRoutes),
      },
    ],
  },
];
