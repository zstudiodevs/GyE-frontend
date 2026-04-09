import { Routes } from '@angular/router';

import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'reservas', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadChildren: () =>
      import('./features/shell/shell.routes').then(m => m.shellRoutes),
  },
  { path: '**', redirectTo: 'reservas' },
];
