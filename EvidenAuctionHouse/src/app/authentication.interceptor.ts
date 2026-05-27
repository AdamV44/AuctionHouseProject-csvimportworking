import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthenticationService } from './services/authentication.service';
import { catchError, switchMap, throwError, of } from 'rxjs';

export const authenticationInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthenticationService);
  const token = auth.getToken();

  const attach = (t?: string | null) => {
    if (t) {
      return req.clone({ headers: req.headers.set('Authorization', 'Bearer ' + t) });
    }
    return req;
  };

  const initial = next(attach(token));

  return initial.pipe(
    catchError((err: any) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        // try refresh once
        return auth.refresh().pipe(
          switchMap((ok: boolean) => {
            if (ok) {
              const newToken = auth.getToken();
              return next(attach(newToken));
            }
            return throwError(() => err);
          }),
          catchError(e => throwError(() => e))
        );
      }
      return throwError(() => err);
    })
  );
};
