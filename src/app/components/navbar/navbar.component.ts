import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <!-- Logo/Brand -->
        <div class="navbar-brand">
          <a routerLink="/dashboard" class="brand-link">
            <span class="brand-icon">💰</span>
            <span class="brand-text">Dashboard Financeiro</span>
          </a>
        </div>

        <!-- Navigation Links -->
        <div class="navbar-nav">
          <a 
            routerLink="/dashboard" 
            class="nav-link"
            [class.active]="isCurrentRoute('/dashboard') && !showDadosMensais"
            (click)="navigateToDashboard()">
            <span class="nav-icon">📊</span>
            Dashboard
          </a>
          <a 
            routerLink="/dashboard" 
            class="nav-link"
            [class.active]="isCurrentRoute('/dashboard') && showDadosMensais"
            (click)="navigateToMonthlyData()">
            <span class="nav-icon">�</span>
            Dados por Mês
          </a>
          <a 
            routerLink="/gestao" 
            routerLinkActive="active"
            class="nav-link">
            <span class="nav-icon">⚙️</span>
            Gestão
          </a>
        </div>

        <!-- Theme Selector -->
        <div class="theme-selector">
          <select 
            (change)="onThemeChange($any($event.target).value)" 
            [value]="currentTheme"
            class="theme-select">
            <option *ngFor="let tema of temasDisponiveis" [value]="tema.id">
              {{ tema.nome }}
            </option>
          </select>
        </div>

        <!-- User Profile -->
        <div class="navbar-user">
          <div class="user-info" (click)="toggleUserMenu()" #userMenuTrigger>
            <div class="user-avatar">
              <div class="avatar-fallback" *ngIf="!user?.photoURL">
                {{ getInitials() }}
              </div>
              <img 
                *ngIf="user?.photoURL"
                [src]="user.photoURL" 
                [alt]="user?.displayName || 'Usuário'"
                (error)="onImageError($event)">
            </div>
            <div class="user-details">
              <span class="user-name">{{ user?.displayName || 'Usuário' }}</span>
              <span class="user-email">{{ user?.email }}</span>
            </div>
            <span class="dropdown-arrow" [class.open]="showUserMenu">▼</span>
          </div>

          <!-- User Dropdown Menu -->
          <div class="user-menu" [class.show]="showUserMenu">
            <div class="menu-item">
              <span class="menu-icon">👤</span>
              <span>Perfil</span>
            </div>
            <div class="menu-item">
              <span class="menu-icon">⚙️</span>
              <span>Configurações</span>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item logout" (click)="logout()">
              <span class="menu-icon">🚪</span>
              <span>Sair</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isAuthenticated = false;
  user: any = null;
  showUserMenu = false;
  showDadosMensais = false;
  currentTheme = 'classico';
  temasDisponiveis = this.themeService.temasDisponiveis;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Observar mudanças no estado de autenticação
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: any) => {
        this.isAuthenticated = !!user;
        this.user = user;
      });

    // Observar mudanças no tema
    this.themeService.temaAtual$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tema => {
        this.currentTheme = tema;
      });

    // Fechar menu ao clicar fora
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const userMenuTrigger = document.querySelector('.user-info');
    const userMenu = document.querySelector('.user-menu');
    
    if (!userMenuTrigger?.contains(target) && !userMenu?.contains(target)) {
      this.showUserMenu = false;
    }
  }

  async logout(): Promise<void> {
    try {
      this.showUserMenu = false; // Fechar menu imediatamente
      await this.authService.signOut();
      this.isAuthenticated = false; // Forçar atualização local
      this.user = null; // Limpar dados do usuário
      this.toastService.success('Logout realizado com sucesso!');
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      this.toastService.error('Erro ao fazer logout. Tente novamente.');
    }
  }

  getInitials(): string {
    if (this.user?.displayName) {
      return this.user.displayName
        .split(' ')
        .map((name: string) => name.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    if (this.user?.email) {
      return this.user.email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  onThemeChange(themeId: string): void {
    this.themeService.alterarTema(themeId);
  }

  isCurrentRoute(route: string): boolean {
    return this.router.url === route;
  }

  navigateToDashboard(): void {
    this.showDadosMensais = false;
    this.router.navigate(['/dashboard']).then(() => {
      // Emitir evento para o dashboard component
      window.dispatchEvent(new CustomEvent('dashboardNavigation', { 
        detail: { showDadosMensais: false } 
      }));
    });
  }

  navigateToMonthlyData(): void {
    this.showDadosMensais = true;
    this.router.navigate(['/dashboard']).then(() => {
      // Emitir evento para o dashboard component
      window.dispatchEvent(new CustomEvent('dashboardNavigation', { 
        detail: { showDadosMensais: true } 
      }));
    });
  }
}