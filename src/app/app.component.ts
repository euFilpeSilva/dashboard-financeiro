import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, NavbarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'dashboard-financeiro';
  isAuthenticated = false;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Observar mudanças no estado de autenticação para controlar a navbar
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        console.log('🔄 App: Estado de autenticação mudou:', isAuthenticated);
        this.isAuthenticated = isAuthenticated;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
