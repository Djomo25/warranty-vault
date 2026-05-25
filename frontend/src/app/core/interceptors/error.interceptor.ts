import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

const TOKEN_KEY = 'wv_token';
const USER_KEY = 'wv_user';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      // 401 hors des routes auth (login, register, me) → token expiré → déconnexion
      if (error.status === 401 && !req.url.includes('/auth/')) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    }),
  );
};
