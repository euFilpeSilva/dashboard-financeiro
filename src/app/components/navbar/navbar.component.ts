import { Component, OnInit, OnDestroy, AfterViewInit }from '@angular/core';
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

        <!-- Desktop Navigation Links -->
        <div class="navbar-nav desktop-nav">
          <a 
            routerLink="/dashboard" 
            class="nav-link"
            [class.active]="isCurrentRoute('/dashboard') && !showDadosMensais"
            (click)="navigateToDashboard()">
            <span class="nav-icon">📊</span>
            <span class="nav-text">Dashboard</span>
          </a>
          <a 
            routerLink="/dashboard" 
            class="nav-link"
            [class.active]="isCurrentRoute('/dashboard') && showDadosMensais"
            (click)="navigateToMonthlyData()">
            <span class="nav-icon">📅</span>
            <span class="nav-text">Dados por Mês</span>
          </a>
          <a 
            routerLink="/calculator" 
            routerLinkActive="active"
            class="nav-link calculator-link">
            <span class="nav-icon">🧮</span>
            <span class="nav-text">Calculadora</span>
          </a>
          <a 
            routerLink="/gestao" 
            routerLinkActive="active"
            class="nav-link">
            <span class="nav-icon">⚙️</span>
            <span class="nav-text">Gestão</span>
          </a>
        </div>

        <!-- Mobile Menu Button -->
        <button class="mobile-menu-btn" (click)="toggleMobileMenu($event)">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>

        <!-- Mobile Menu Overlay -->
        <div class="mobile-menu-overlay" [class.show]="showMobileMenu" (click)="closeMobileMenu()"></div>
        
        <!-- Mobile Menu -->
        <div class="mobile-menu" [class.show]="showMobileMenu">
          <div class="mobile-menu-header">
            <h3>Menu</h3>
            <button class="close-btn" (click)="closeMobileMenu()">×</button>
          </div>
          
          <div class="mobile-menu-content">
            <a 
              routerLink="/dashboard" 
              class="mobile-nav-link"
              [class.active]="isCurrentRoute('/dashboard') && !showDadosMensais"
              (click)="navigateToDashboard(); closeMobileMenu()">
              <span class="nav-icon">📊</span>
              <span>Dashboard</span>
            </a>
            
            <a 
              routerLink="/dashboard" 
              class="mobile-nav-link"
              [class.active]="isCurrentRoute('/dashboard') && showDadosMensais"
              (click)="navigateToMonthlyData(); closeMobileMenu()">
              <span class="nav-icon">📅</span>
              <span>Dados por Mês</span>
            </a>
            
            <a 
              routerLink="/calculator" 
              class="mobile-nav-link calculator-link"
              [class.active]="isCurrentRoute('/calculator')"
              (click)="closeMobileMenu()">
              <span class="nav-icon">🧮</span>
              <span>Calculadora</span>
            </a>
            
            <a 
              routerLink="/gestao" 
              class="mobile-nav-link"
              [class.active]="isCurrentRoute('/gestao')"
              (click)="closeMobileMenu()">
              <span class="nav-icon">⚙️</span>
              <span>Gestão</span>
            </a>
            
            <div class="mobile-divider"></div>
            
            <div class="mobile-theme-selector">
              <label>Tema:</label>
              <select 
                (change)="onThemeChange($any($event.target).value)" 
                [value]="currentTheme"
                class="mobile-theme-select">
                <option *ngFor="let tema of temasDisponiveis" [value]="tema.id">
                  {{ tema.nome }}
                </option>
              </select>
            </div>
            
            <div class="mobile-divider"></div>
            
            <div class="mobile-user-section" *ngIf="isAuthenticated">
              <div class="mobile-user-info">
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
              </div>
              
              <button class="mobile-menu-item" (click)="logout(); closeMobileMenu()">
                <span class="menu-icon">🚪</span>
                <span>Sair</span>
              </button>
            </div>
          </div>
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
            <a routerLink="/configuracoes" class="menu-item" (click)="showUserMenu = false">
              <span class="menu-icon">⚙️</span>
              <span>Configurações</span>
            </a>
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
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private _menuOriginalParent: HTMLElement | null = null;
  
  
  isAuthenticated = false;
  user: any = null;
  showUserMenu = false;
  showMobileMenu = false;
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

    // Mobile menu closing is handled by the overlay's click handler and the
    // close button. Avoid a global document click listener which can race
    // with open toggles and cause flaky behavior on mobile.
  }

  ngAfterViewInit(): void {
    // Do not move menu to body by default; keep it inside the component so
    // component-scoped styles (Angular emulated encapsulation) continue to apply.
    // If menu was previously moved, restore it now.
    setTimeout(() => this._restoreMobileMenuParent(), 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleMobileMenu(event?: Event): void {
    // Prevent any parent handlers from interfering with this click
    event?.stopPropagation();
    this.showMobileMenu = !this.showMobileMenu;
    // Fechar menu de usuário se estiver aberto
    if (this.showMobileMenu) {
      this.showUserMenu = false;
      // Ensure the menu lives inside the navbar container so component styles
      // apply correctly (important for Angular emulated encapsulation)
      setTimeout(() => this._restoreMobileMenuParent(), 0);
    }
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
    // Restore mobile menu elements back to the navbar so styles remain applied.
    setTimeout(() => this._restoreMobileMenuParent(), 0);
  }

  private _moveMobileMenuToBody(): void {
    try {
      const mobileMenu = document.querySelector('.mobile-menu') as HTMLElement | null;
      const mobileOverlay = document.querySelector('.mobile-menu-overlay') as HTMLElement | null;
      if (!mobileMenu && !mobileOverlay) return;
      const navbarContainer = document.querySelector('.navbar-container') as HTMLElement | null;
      if (!this._menuOriginalParent && navbarContainer) {
        this._menuOriginalParent = navbarContainer;
      }

      if (mobileOverlay && mobileOverlay.parentElement !== document.body) {
        // remember original parent so we can restore later
        if (!this._menuOriginalParent && mobileOverlay.parentElement) {
          this._menuOriginalParent = mobileOverlay.parentElement as HTMLElement;
        }
        document.body.appendChild(mobileOverlay);
      }

      if (mobileMenu && mobileMenu.parentElement !== document.body) {
        if (!this._menuOriginalParent && mobileMenu.parentElement) {
          this._menuOriginalParent = mobileMenu.parentElement as HTMLElement;
        }
        document.body.appendChild(mobileMenu);
      }
    } catch (err) {
      // silent fail - non-critical
      // console.warn('Error moving mobile menu to body', err);
    }
  }

  private _restoreMobileMenuParent(): void {
    try {
      const mobileMenu = document.querySelector('.mobile-menu') as HTMLElement | null;
      const mobileOverlay = document.querySelector('.mobile-menu-overlay') as HTMLElement | null;
      const parent = this._menuOriginalParent || document.querySelector('.navbar-container') as HTMLElement | null;
      if (!parent) return;

      if (mobileOverlay && mobileOverlay.parentElement !== parent) {
        parent.appendChild(mobileOverlay);
      }

      if (mobileMenu && mobileMenu.parentElement !== parent) {
        parent.appendChild(mobileMenu);
      }
    } catch (err) {
      // silent
    }
  }

  // Note: document-level click handling removed to avoid races on mobile.

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