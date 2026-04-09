import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStoreService } from '../services/auth-store.service';

export const adminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);

  if (authStore.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/reservas']);
};
