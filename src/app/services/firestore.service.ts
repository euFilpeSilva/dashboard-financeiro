import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map, from, switchMap, of } from 'rxjs';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  DocumentReference,
  QuerySnapshot,
  DocumentSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { Despesa, Categoria } from '../models/despesa.model';

export interface FirestoreDespesa {
  id?: string;
  descricao: string;
  valor: number;
  categoria: Categoria;
  dataVencimento: Timestamp;
  dataPagamento?: Timestamp | null;
  paga: boolean;
  prioridade: 'baixa' | 'media' | 'alta';
  observacoes?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreAnotacao {
  id?: string;
  texto: string;
  cor?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore: Firestore;
  private despesasSubject = new BehaviorSubject<Despesa[]>([]);
  private anotacoesSubject = new BehaviorSubject<any[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public readonly despesas$ = this.despesasSubject.asObservable();
  public readonly anotacoes$ = this.anotacoesSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService
  ) {
    this.firestore = this.firebaseService.firestore;
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
    const despesasQuery = query(
      collection(this.firestore, 'despesas'),
      where('userId', '==', userId),
      orderBy('dataVencimento', 'asc')
    );

    onSnapshot(despesasQuery, (snapshot: QuerySnapshot) => {
      const despesas: Despesa[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as FirestoreDespesa;
        despesas.push(this.mapFirestoreToDespesa(doc.id, data));
      });
      this.despesasSubject.next(despesas);
      this.loadingSubject.next(false);
    });

    // Listener para anotações
    const anotacoesQuery = query(
      collection(this.firestore, 'anotacoes'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    onSnapshot(anotacoesQuery, (snapshot: QuerySnapshot) => {
      const anotacoes: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as FirestoreAnotacao;
        anotacoes.push({
          id: doc.id,
          texto: data.texto,
          cor: data.cor,
          dataHora: data.createdAt.toDate()
        });
      });
      this.anotacoesSubject.next(anotacoes);
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
      dataVencimento: Timestamp.fromDate(despesa.dataVencimento),
      dataPagamento: despesa.dataPagamento ? Timestamp.fromDate(despesa.dataPagamento) : null,
      paga: despesa.paga,
      prioridade: despesa.prioridade as 'baixa' | 'media' | 'alta',
      userId: user.uid,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    const docRef = await addDoc(collection(this.firestore, 'despesas'), firestoreDespesa);
    return docRef.id;
  }

  async atualizarDespesa(id: string, updates: Partial<Despesa>): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, 'despesas', id);
    const firestoreUpdates: any = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    // Converter datas para Timestamp se necessário
    if (updates.dataVencimento) {
      firestoreUpdates.dataVencimento = Timestamp.fromDate(updates.dataVencimento);
    }
    if (updates.dataPagamento) {
      firestoreUpdates.dataPagamento = Timestamp.fromDate(updates.dataPagamento);
    }

    await updateDoc(docRef, firestoreUpdates);
  }

  async removerDespesa(id: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, 'despesas', id);
    await deleteDoc(docRef);
  }

  async marcarComoPaga(id: string, paga: boolean): Promise<void> {
    const updates: any = {
      paga,
      updatedAt: serverTimestamp()
    };

    if (paga) {
      updates.dataPagamento = serverTimestamp();
    } else {
      updates.dataPagamento = null;
    }

    const docRef = doc(this.firestore, 'despesas', id);
    await updateDoc(docRef, updates);
  }

  // === MÉTODOS PARA ANOTAÇÕES ===

  async adicionarAnotacao(texto: string, cor?: string): Promise<string> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const anotacao: Omit<FirestoreAnotacao, 'id'> = {
      texto,
      cor,
      userId: user.uid,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    const docRef = await addDoc(collection(this.firestore, 'anotacoes'), anotacao);
    return docRef.id;
  }

  async atualizarAnotacao(id: string, texto: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, 'anotacoes', id);
    await updateDoc(docRef, {
      texto,
      updatedAt: serverTimestamp()
    });
  }

  async removerAnotacao(id: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(this.firestore, 'anotacoes', id);
    await deleteDoc(docRef);
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

  private mapFirestoreToDespesa(id: string, data: FirestoreDespesa): Despesa {
    return {
      id,
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