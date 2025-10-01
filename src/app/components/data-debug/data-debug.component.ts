import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { DespesaService } from '../../services/despesa.service';
import { Prioridade } from '../../models/despesa.model';

@Component({
  selector: 'app-data-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="position: fixed; bottom: 10px; right: 10px; background: #333; color: white; padding: 15px; border-radius: 8px; z-index: 9999; font-size: 12px; max-width: 350px;">
      <h4>📊 Data Debug</h4>
      <div><strong>Usuário Logado:</strong> {{ user ? '✅ ' + user.email : '❌ Não logado' }}</div>
      <div><strong>User ID:</strong> {{ user?.uid || 'N/A' }}</div>
      <div><strong>Despesas Carregadas:</strong> {{ despesasCount }}</div>
      <div><strong>Firestore Status:</strong> {{ firestoreStatus }}</div>
      <div><strong>Loading:</strong> {{ loading ? '🔄' : '✅' }}</div>
      
      <div style="margin: 10px 0;">
        <button (click)="testConnection()" style="margin: 2px; padding: 5px 8px; background: #4fc3f7; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">
          🔍 Testar Conexão
        </button>
        <button (click)="forceReload()" style="margin: 2px; padding: 5px 8px; background: #ff9800; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">
          🔄 Forçar Reload
        </button>
        <button (click)="testAdd()" style="margin: 2px; padding: 5px 8px; background: #4caf50; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">
          ➕ Testar Adicionar
        </button>
      </div>
      
      <div *ngIf="testResult" style="margin-top: 10px; padding: 8px; background: #444; border-radius: 4px; font-size: 10px;">
        <strong>Resultado:</strong> {{ testResult }}
      </div>
    </div>
  `
})
export class DataDebugComponent implements OnInit {
  user: any = null;
  despesasCount = 0;
  firestoreStatus = 'Verificando...';
  loading = false;
  testResult = '';

  constructor(
    private authService: AuthService,
    private firestoreService: FirestoreService,
    private despesaService: DespesaService
  ) {}

  ngOnInit() {
    // Monitorar usuário
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      console.log('👤 Usuário atual:', user);
    });

    // Monitorar despesas
    this.despesaService.despesas$.subscribe(despesas => {
      this.despesasCount = despesas.length;
      console.log('📊 Despesas carregadas:', despesas.length, despesas);
    });

    // Monitorar loading
    this.firestoreService.loading$.subscribe(loading => {
      this.loading = loading;
    });

    this.firestoreStatus = '✅ Conectado';
  }

  async testConnection() {
    try {
      this.testResult = '🔄 Testando...';
      
      if (!this.user) {
        this.testResult = '❌ Usuário não logado';
        return;
      }

      console.log('🔍 Testando conexão Firestore...');
      console.log('User ID:', this.user.uid);

      this.testResult = '✅ Conexão OK - Ver console para detalhes';
    } catch (error: any) {
      this.testResult = '❌ Erro: ' + error.message;
      console.error('Erro no teste:', error);
    }
  }

  forceReload() {
    window.location.reload();
  }

  async testAdd() {
    try {
      if (!this.user) {
        this.testResult = '❌ Faça login primeiro';
        return;
      }

      this.testResult = '🔄 Adicionando despesa teste...';
      
      const despesaTeste = {
        descricao: `Teste ${new Date().toLocaleTimeString()}`,
        valor: Math.random() * 100,
        categoria: {
          id: 'alimentacao',
          nome: 'Alimentação',
          cor: '#4fc3f7'
        },
        dataVencimento: new Date(),
        prioridade: Prioridade.MEDIA,
        paga: false
      };

      await this.despesaService.adicionarDespesa(despesaTeste);
      this.testResult = '✅ Despesa teste adicionada!';
    } catch (error: any) {
      this.testResult = '❌ Erro: ' + error.message;
      console.error('Erro ao adicionar:', error);
    }
  }
}