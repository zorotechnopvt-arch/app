import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Only signed-in users can enter the app. */
export const authGuard: CanActivateFn = () =>
  inject(AuthService).getUser() ? true : inject(Router).createUrlTree(['/login']);

/** Signed-in users skip the login page. */
export const guestGuard: CanActivateFn = () =>
  inject(AuthService).getUser() ? inject(Router).createUrlTree(['/app']) : true;
