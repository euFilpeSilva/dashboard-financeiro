import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, take, filter, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private logger: LoggerService
  ) {}

  canActivate(): Observable<boolean> {
    // Aguardar o loading terminar antes de verificar autenticação
    return this.authService.loading$.pipe(
      filter(loading => !loading), // Esperar loading terminar
      take(1),
      switchMap(() => 
        this.authService.currentUser$.pipe(
          take(1),
          map(user => {
            if (user) {
              this.logger.debug('🔒 AuthGuard: Usuário autenticado:', user.email);
              return true;
            } else {
              this.logger.debug('🔒 AuthGuard: Usuário não autenticado, redirecionando...');
              this.router.navigate(['/login']);
              return false;
            }
          })
        )
      )
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class RedirectAuthenticatedGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private logger: LoggerService
  ) {}

  canActivate(): Observable<boolean> {
    // Aguardar o loading terminar antes de verificar autenticação
    return this.authService.loading$.pipe(
      filter(loading => !loading), // Esperar loading terminar
      take(1),
      switchMap(() => 
        this.authService.currentUser$.pipe(
          take(1),
          map(user => {
            if (user) {
              this.logger.debug('🔒 RedirectGuard: Usuário já autenticado, redirecionando para dashboard...');
              this.router.navigate(['/dashboard']);
              return false;
            } else {
              this.logger.debug('🔒 RedirectGuard: Usuário não autenticado, permitindo acesso ao login...');
              return true;
            }
          })
        )
      )
    );
  }
}