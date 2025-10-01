import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirebaseDebugComponent } from '../firebase-debug/firebase-debug.component';
import { DataDebugComponent } from '../data-debug/data-debug.component';
import { Subject, takeUntil, filter } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, FirebaseDebugComponent, DataDebugComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  email = '';
  password = '';
  loading = false;
  error = '';
  showPassword = false;
  
  // Modo: 'login' ou 'register'
  mode: 'login' | 'register' = 'login';
  displayName = '';
  
  private destroy$ = new Subject<void>();
  private isLoggingIn = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Verificar se já está autenticado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    
    // Observar mudanças no estado de autenticação para navegar automaticamente
    this.authService.currentUser$
      .pipe(
        takeUntil(this.destroy$),
        filter(user => !!user && this.isLoggingIn) // Só navegar se estiver fazendo login
      )
      .subscribe(() => {
        console.log('🔄 Usuário autenticado, navegando para dashboard...');
        this.isLoggingIn = false;
        this.router.navigate(['/dashboard']);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async onSubmit() {
    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Por favor, preencha todos os campos';
      return;
    }

    this.loading = true;
    this.error = '';
    this.isLoggingIn = true;

    try {
      if (this.mode === 'login') {
        await this.authService.signInWithEmail(this.email, this.password);
      } else {
        await this.authService.signUpWithEmail(this.email, this.password, this.displayName);
      }
      
      // A navegação será feita pelo observable no ngOnInit
      console.log('🔄 Login realizado, aguardando navegação automática...');
    } catch (error: any) {
      this.error = error.message;
      this.isLoggingIn = false;
    } finally {
      this.loading = false;
    }
  }

  async signInWithGoogle() {
    this.loading = true;
    this.error = '';
    this.isLoggingIn = true;

    try {
      await this.authService.signInWithGoogle();
      
      // A navegação será feita pelo observable no ngOnInit
      console.log('🔄 Login Google realizado, aguardando navegação automática...');
    } catch (error: any) {
      this.error = error.message;
      this.isLoggingIn = false;
    } finally {
      this.loading = false;
    }
  }

  async resetPassword() {
    if (!this.email.trim()) {
      this.error = 'Digite seu email para recuperar a senha';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.authService.resetPassword(this.email);
      alert('Email de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  toggleMode() {
    this.mode = this.mode === 'login' ? 'register' : 'login';
    this.error = '';
    this.clearForm();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private clearForm() {
    this.email = '';
    this.password = '';
    this.displayName = '';
  }
}