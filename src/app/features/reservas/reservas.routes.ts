import { Routes } from '@angular/router';

export const reservasRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./reservas.component').then(m => m.ReservasComponent),
  },
  {
    path: 'nueva',
    loadComponent: () =>
      import('./nueva-reserva/nueva-reserva.component').then(m => m.NuevaReservaComponent),
  },
];
