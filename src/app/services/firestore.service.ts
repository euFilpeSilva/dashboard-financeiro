import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from './auth.service';
import { Despesa, Categoria } from '../models/despesa.model';
import firebase from 'firebase/compat/app';

export interface FirestoreDespesa {
  id?: string;
  descricao: string;
  valor: number;
  categoria: Categoria;
  dataVencimento: firebase.firestore.Timestamp;
  dataPagamento?: firebase.firestore.Timestamp | null;
  paga: boolean;
  prioridade: 'baixa' | 'media' | 'alta';
  userId: string;
  createdAt: firebase.firestore.Timestamp;
  updatedAt: firebase.firestore.Timestamp;
}

export interface FirestoreAnotacao {
  id?: string;
  texto: string;
  cor?: string;
  userId: string;
  createdAt: firebase.firestore.Timestamp;
  updatedAt: firebase.firestore.Timestamp;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private despesasSubject = new BehaviorSubject<Despesa[]>([]);
  private anotacoesSubject = new BehaviorSubject<any[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public readonly despesas$ = this.despesasSubject.asObservable();
  public readonly anotacoes$ = this.anotacoesSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {
    this.initializeListeners();
  }

  private initializeListeners(): void {
    // Escutar mudanças de autenticação para carregar dados do usuário
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.startRealtimeListeners(user.uid);
      } else {
        this.stopRealtimeListeners();
      }
    });
  }

  private startRealtimeListeners(userId: string): void {
    this.loadingSubject.next(true);

    // Listener para despesas
    this.firestore.collection<FirestoreDespesa>('despesas', ref => 
      ref.where('userId', '==', userId).orderBy('dataVencimento', 'asc')
    ).valueChanges({ idField: 'id' }).subscribe(despesas => {
      const mappedDespesas = despesas.map(data => this.mapFirestoreToDespesa(data));
      this.despesasSubject.next(mappedDespesas);
      this.loadingSubject.next(false);
    });

    // Listener para anotações
    this.firestore.collection<FirestoreAnotacao>('anotacoes', ref => 
      ref.where('userId', '==', userId).orderBy('createdAt', 'desc')
    ).valueChanges({ idField: 'id' }).subscribe(anotacoes => {
      const mappedAnotacoes = anotacoes.map(data => ({
        id: data.id,
        texto: data.texto,
        cor: data.cor,
        dataHora: data.createdAt.toDate()
      }));
      this.anotacoesSubject.next(mappedAnotacoes);
    });
  }

  private stopRealtimeListeners(): void {
    this.despesasSubject.next([]);
    this.anotacoesSubject.next([]);
    this.loadingSubject.next(false);
  }

  // === MÉTODOS PARA DESPESAS ===

  async adicionarDespesa(despesa: Omit<Despesa, 'id'>): Promise<string> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const firestoreDespesa: Omit<FirestoreDespesa, 'id'> = {
      descricao: despesa.descricao,
      valor: despesa.valor,
      categoria: despesa.categoria,
      dataVencimento: firebase.firestore.Timestamp.fromDate(despesa.dataVencimento),
      dataPagamento: despesa.dataPagamento ? firebase.firestore.Timestamp.fromDate(despesa.dataPagamento) : null,
      paga: despesa.paga,
      prioridade: despesa.prioridade as 'baixa' | 'media' | 'alta',
      userId: user.uid,
      createdAt: firebase.firestore.Timestamp.now(),
      updatedAt: firebase.firestore.Timestamp.now()
    };

    const docRef = await this.firestore.collection('despesas').add(firestoreDespesa);
    return docRef.id;
  }

  async atualizarDespesa(id: string, updates: Partial<Despesa>): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const firestoreUpdates: any = {
      ...updates,
      updatedAt: firebase.firestore.Timestamp.now()
    };

    // Converter datas para Timestamp se necessário
    if (updates.dataVencimento) {
      firestoreUpdates.dataVencimento = firebase.firestore.Timestamp.fromDate(updates.dataVencimento);
    }
    if (updates.dataPagamento) {
      firestoreUpdates.dataPagamento = firebase.firestore.Timestamp.fromDate(updates.dataPagamento);
    }

    await this.firestore.collection('despesas').doc(id).update(firestoreUpdates);
  }

  async removerDespesa(id: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    await this.firestore.collection('despesas').doc(id).delete();
  }

  async marcarComoPaga(id: string, paga: boolean): Promise<void> {
    const updates: any = {
      paga,
      updatedAt: firebase.firestore.Timestamp.now()
    };

    if (paga) {
      updates.dataPagamento = firebase.firestore.Timestamp.now();
    } else {
      updates.dataPagamento = null;
    }

    await this.firestore.collection('despesas').doc(id).update(updates);
  }

  // === MÉTODOS PARA ANOTAÇÕES ===

  async adicionarAnotacao(texto: string, cor?: string): Promise<string> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const anotacao: Omit<FirestoreAnotacao, 'id'> = {
      texto,
      cor,
      userId: user.uid,
      createdAt: firebase.firestore.Timestamp.now(),
      updatedAt: firebase.firestore.Timestamp.now()
    };

    const docRef = await this.firestore.collection('anotacoes').add(anotacao);
    return docRef.id;
  }

  async atualizarAnotacao(id: string, texto: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    await this.firestore.collection('anotacoes').doc(id).update({
      texto,
      updatedAt: firebase.firestore.Timestamp.now()
    });
  }

  async removerAnotacao(id: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    await this.firestore.collection('anotacoes').doc(id).delete();
  }

  // === MÉTODOS DE MIGRAÇÃO ===

  async migrarDadosLocalStorage(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Migrar despesas
      const despesasLocal = localStorage.getItem('despesas');
      if (despesasLocal) {
        const despesas = JSON.parse(despesasLocal) as Despesa[];
        for (const despesa of despesas) {
          await this.adicionarDespesa(despesa);
        }
        localStorage.removeItem('despesas');
      }

      // Migrar anotações
      const anotacoesLocal = localStorage.getItem('dashboard-anotacoes');
      if (anotacoesLocal) {
        const anotacoes = JSON.parse(anotacoesLocal);
        for (const anotacao of anotacoes) {
          await this.adicionarAnotacao(anotacao.texto, anotacao.cor);
        }
        localStorage.removeItem('dashboard-anotacoes');
      }

      console.log('✅ Migração de dados concluída com sucesso');
    } catch (error) {
      console.error('❌ Erro na migração:', error);
      throw error;
    }
  }

  // === MÉTODOS UTILITÁRIOS ===

  private mapFirestoreToDespesa(data: FirestoreDespesa): Despesa {
    return {
      id: data.id!,
      descricao: data.descricao,
      valor: data.valor,
      categoria: data.categoria,
      dataVencimento: data.dataVencimento.toDate(),
      dataPagamento: data.dataPagamento?.toDate() || undefined,
      paga: data.paga,
      prioridade: data.prioridade as any
    };
  }

  // Obter dados atuais (para compatibilidade)
  getDespesas(): Despesa[] {
    return this.despesasSubject.value;
  }

  getAnotacoes(): any[] {
    return this.anotacoesSubject.value;
  }
}