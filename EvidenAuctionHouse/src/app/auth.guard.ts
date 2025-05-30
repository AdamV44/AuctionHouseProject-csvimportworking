import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from './services/authentication.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const service = inject(AuthenticationService);
  const router = inject(Router);

  if (!service.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }

  return true;
};
