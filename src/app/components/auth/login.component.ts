import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirebaseDebugComponent } from '../firebase-debug/firebase-debug.component';
import { DataDebugComponent } from '../data-debug/data-debug.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, FirebaseDebugComponent, DataDebugComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  loading = false;
  error = '';
  showPassword = false;
  
  // Modo: 'login' ou 'register'
  mode: 'login' | 'register' = 'login';
  displayName = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Verificar se já está autenticado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  async onSubmit() {
    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Por favor, preencha todos os campos';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      if (this.mode === 'login') {
        await this.authService.signInWithEmail(this.email, this.password);
      } else {
        await this.authService.signUpWithEmail(this.email, this.password, this.displayName);
      }
      
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  async signInWithGoogle() {
    this.loading = true;
    this.error = '';

    try {
      await this.authService.signInWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.error = error.message;
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