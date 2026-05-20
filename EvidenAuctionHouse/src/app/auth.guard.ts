import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthenticationService } from './services/authentication.service';
import { UserService } from './services/user.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const service = inject(AuthenticationService);
  const userService = inject(UserService);
  const router = inject(Router);

  if (!service.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }

  const currentUser = service.getUser();
  if (!currentUser) {
    return router.createUrlTree(['/']);
  }

  return userService.getUserById(currentUser.id).pipe(
    map(user => {
      service.updateUser({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      });

      return true;
    }),
    catchError(() => of(true))
  );
};

export const AdminGuard: CanActivateFn = (route, state) => {
  const service = inject(AuthenticationService);
  const userService = inject(UserService);
  const router = inject(Router);

  if (!service.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }

  const currentUser = service.getUser();
  if (!currentUser) {
    return router.createUrlTree(['/']);
  }

  if (!service.isAdmin()) {
    return userService.getUserById(currentUser.id).pipe(
      map(user => {
        service.updateUser({
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        });

        return user.isAdmin ? true : router.createUrlTree(['/auctions']);
      }),
      catchError(() => of(router.createUrlTree(['/auctions'])))
    );
  }

  return true;
};
