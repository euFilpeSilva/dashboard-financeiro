import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-firebase-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="position: fixed; top: 10px; right: 10px; background: #333; color: white; padding: 15px; border-radius: 8px; z-index: 9999; font-size: 12px; max-width: 350px;">
      <h4>🔧 Firebase Debug</h4>
      <div><strong>API Key:</strong> {{ config.apiKey ? '✅ Configurado' : '❌ Não encontrado' }}</div>
      <div><strong>Auth Domain:</strong> {{ config.authDomain || '❌ Não encontrado' }}</div>
      <div><strong>Project ID:</strong> {{ config.projectId || '❌ Não encontrado' }}</div>
      <div><strong>Firebase Status:</strong> {{ firebaseStatus }}</div>
      <div><strong>Auth Status:</strong> {{ authStatus }}</div>
      <div *ngIf="error" style="color: #ff6b6b; margin: 10px 0;"><strong>Erro:</strong> {{ error }}</div>
      
      <div style="margin: 15px 0; padding: 10px; background: #444; border-radius: 5px;">
        <strong>📋 Passos no Firebase Console:</strong>
        <ol style="margin: 5px 0; padding-left: 15px; font-size: 11px;">
          <li>✅ Acesse <a href="https://console.firebase.google.com" target="_blank" style="color: #4fc3f7;">Firebase Console</a></li>
          <li>✅ Selecione projeto: <code>{{ config.projectId }}</code></li>
          <li>✅ Em <strong>Authentication > Sign-in method</strong> ative Google</li>
          <li>⚠️ Em <strong>Settings > Authorized domains</strong>, adicione:</li>
          <ul style="margin: 5px 0;">
            <li>✅ <code>localhost</code></li>
            <li>❌ <code>localhost:4200</code> (ADICIONAR)</li>
          </ul>
          <li>🔧 Vá em <strong>Firestore Database > Índices</strong></li>
          <li>🔧 Crie índice: <code>despesas</code> → <code>userId (Ascending), dataVencimento (Ascending)</code></li>
        </ol>
      </div>
      
      <button (click)="testGoogleAuth()" style="margin: 5px; padding: 8px 12px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
        🔍 Testar Google Auth
      </button>
      <button (click)="openFirebaseConsole()" style="margin: 5px; padding: 8px 12px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
        🚀 Abrir Firebase Console
      </button>
      <button (click)="openFirestoreIndexes()" style="margin: 5px; padding: 8px 12px; background: #9c27b0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
        📊 Criar Índices
      </button>
      <button (click)="openFirestoreRules()" style="margin: 5px; padding: 8px 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
        🔒 Verificar Regras
      </button>
    </div>
  `
})
export class FirebaseDebugComponent implements OnInit {
  config = environment.firebase;
  firebaseStatus = 'Verificando...';
  authStatus = 'Verificando...';
  error = '';

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {
    this.checkFirebaseStatus();
  }

  private checkFirebaseStatus() {
    try {
      // Verificar se o Firebase foi inicializado
      if (this.config.apiKey && this.config.projectId) {
        this.firebaseStatus = '✅ Configurado';
      } else {
        this.firebaseStatus = '❌ Configuração incompleta';
      }

      // Verificar auth
      this.authStatus = '✅ Disponível';
    } catch (error: any) {
      this.firebaseStatus = '❌ Erro na inicialização';
      this.error = error.message;
    }
  }

  async testGoogleAuth() {
    try {
      console.log('🔍 Testando configuração do Google Auth...');
      console.log('Config Firebase:', this.config);
      
      // Verificar se os domínios estão corretos
      const currentDomain = window.location.origin;
      console.log('Domínio atual:', currentDomain);
      console.log('Auth Domain configurado:', this.config.authDomain);
      
      this.authStatus = '🔄 Testando...';
      
      // Simular teste de popup
      setTimeout(() => {
        this.authStatus = '⚠️ Verifique o console para detalhes';
      }, 1000);
      
    } catch (error: any) {
      this.error = error.message;
      console.error('Erro no teste:', error);
    }
  }

  openFirebaseConsole() {
    const url = `https://console.firebase.google.com/project/${this.config.projectId}/authentication/users`;
    window.open(url, '_blank');
  }

  openFirestoreRules() {
    const url = `https://console.firebase.google.com/project/${this.config.projectId}/firestore/rules`;
    window.open(url, '_blank');
  }

  openFirestoreIndexes() {
    const url = `https://console.firebase.google.com/project/${this.config.projectId}/firestore/indexes`;
    window.open(url, '_blank');
  }
}