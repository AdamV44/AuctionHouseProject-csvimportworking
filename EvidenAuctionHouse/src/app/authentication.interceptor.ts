import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthenticationService } from './services/authentication.service';

export const authenticationInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthenticationService).getToken()
  

  if (token) {
    const newReq = req.clone({
      headers: req.headers.append('Authorization', 'Bearer ' + token),
    });
    return next(newReq);
  }

  return next(req);
};
