import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';
import { Despesa, Categoria, Entrada } from '../models/despesa.model';
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
  // Soft-delete fields
  deleted?: boolean;
  deletedAt?: firebase.firestore.Timestamp | null;
  deletedBy?: string | null;
}

export interface FirestoreEntrada {
  id?: string;
  descricao: string;
  valor: number;
  fonte: string;
  data: firebase.firestore.Timestamp;
  userId: string;
  createdAt: firebase.firestore.Timestamp;
  updatedAt: firebase.firestore.Timestamp;
  // Soft-delete fields
  deleted?: boolean;
  deletedAt?: firebase.firestore.Timestamp | null;
  deletedBy?: string | null;
}

export interface FirestoreAnotacao {
  id?: string;
  texto: string;
  cor?: string;
  userId: string;
  createdAt: firebase.firestore.Timestamp;
  updatedAt: firebase.firestore.Timestamp;
}

export interface FirestoreAuditLog {
  id?: string;
  action: string;
  collection: string;
  docId: string;
  before?: any;
  after?: any;
  userId?: string | null;
  timestamp: firebase.firestore.Timestamp;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private despesasSubject = new BehaviorSubject<Despesa[]>([]);
  private entradasSubject = new BehaviorSubject<Entrada[]>([]);
  private anotacoesSubject = new BehaviorSubject<any[]>([]);
  private auditLogsSubject = new BehaviorSubject<any[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public readonly despesas$ = this.despesasSubject.asObservable();
  public readonly entradas$ = this.entradasSubject.asObservable();
  public readonly anotacoes$ = this.anotacoesSubject.asObservable();
  public readonly auditLogs$ = this.auditLogsSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private logger: LoggerService
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
      ref.where('userId', '==', userId)
    ).valueChanges({ idField: 'id' }).subscribe(despesas => {
        const mappedDespesas = despesas.map(data => this.mapFirestoreToDespesa(data));
        // Ordenar no frontend temporariamente
        mappedDespesas.sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());
        this.despesasSubject.next(mappedDespesas);
      this.loadingSubject.next(false);
    });

    // Listener para entradas
    this.firestore.collection<FirestoreEntrada>('entradas', ref => 
      ref.where('userId', '==', userId)
    ).valueChanges({ idField: 'id' }).subscribe(entradas => {
      const mappedEntradas = entradas.map(data => this.mapFirestoreToEntrada(data));
      // Ordenar no frontend temporarily
      mappedEntradas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      this.entradasSubject.next(mappedEntradas);
    });

    // Listener para anotações
    this.firestore.collection<FirestoreAnotacao>('anotacoes', ref => 
      ref.where('userId', '==', userId)
    ).valueChanges({ idField: 'id' }).subscribe(anotacoes => {
      const mappedAnotacoes = anotacoes.map(data => ({
        id: data.id,
        texto: data.texto,
        cor: data.cor,
        dataHora: data.createdAt.toDate()
      }));
      // Ordenar no frontend temporariamente
      mappedAnotacoes.sort((a, b) => b.dataHora.getTime() - a.dataHora.getTime());
      this.anotacoesSubject.next(mappedAnotacoes);
    });

    // Listener para audit logs (somente logs do usuário)
    // NOTE: ordering + where on different fields can require a composite index in Firestore.
    // To avoid forcing an index during development, fetch by userId and sort client-side.
    this.firestore.collection<FirestoreAuditLog>('auditLogs', ref =>
      ref.where('userId', '==', userId)
    ).valueChanges({ idField: 'id' }).subscribe(logs => {
      const mapped = logs.map(l => ({
        id: l.id,
        action: l.action,
        collection: l.collection,
        docId: l.docId,
        before: l.before || null,
        after: l.after || null,
        userId: l.userId || null,
        timestamp: l.timestamp ? l.timestamp.toDate() : new Date()
      }));
      // Ordenar no cliente por timestamp desc e limitar a 200 para evitar downloads muito grandes
      mapped.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
      this.auditLogsSubject.next(mapped.slice(0, 200));
    });
  }

  private stopRealtimeListeners(): void {
    this.despesasSubject.next([]);
    this.entradasSubject.next([]);
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
    // ensure soft-delete flag
    (firestoreDespesa as any).deleted = false;

    const docRef = await this.firestore.collection('despesas').add(firestoreDespesa);
    // audit
    await this.createAuditLog('create', 'despesas', docRef.id, null, firestoreDespesa, user.uid);
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
    // audit
    try {
      const beforeSnap = await this.firestore.collection('despesas').doc(id).ref.get();
      const before = beforeSnap.exists ? beforeSnap.data() : null;
      await this.createAuditLog('update', 'despesas', id, before || null, firestoreUpdates, user?.uid);
    } catch (e) {
      console.warn('Não foi possível gravar audit log:', e);
    }
  }

  // Soft-delete: marcar como deleted. Para exclusão permanente, use permanentlyDeleteDespesa
  async removerDespesa(id: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const updates: any = {
      deleted: true,
      deletedAt: firebase.firestore.Timestamp.now(),
      deletedBy: user.uid,
      updatedAt: firebase.firestore.Timestamp.now()
    };

    const beforeSnap = await this.firestore.collection('despesas').doc(id).ref.get();
    const before = beforeSnap.exists ? beforeSnap.data() : null;

    await this.firestore.collection('despesas').doc(id).update(updates);
    await this.createAuditLog('delete', 'despesas', id, before || null, updates, user.uid);
  }

  async restoreDespesa(id: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const updates: any = {
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedAt: firebase.firestore.Timestamp.now()
    };

    const beforeSnap = await this.firestore.collection('despesas').doc(id).ref.get();
    const before = beforeSnap.exists ? beforeSnap.data() : null;

    await this.firestore.collection('despesas').doc(id).update(updates);
    await this.createAuditLog('restore', 'despesas', id, before || null, updates, user.uid);
  }

  async permanentlyDeleteDespesa(id: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const beforeSnap = await this.firestore.collection('despesas').doc(id).ref.get();
    const before = beforeSnap.exists ? beforeSnap.data() : null;

    await this.firestore.collection('despesas').doc(id).delete();
    await this.createAuditLog('permanent-delete', 'despesas', id, before || null, null, user.uid);
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

    const beforeSnap = await this.firestore.collection('despesas').doc(id).ref.get();
    const before = beforeSnap.exists ? beforeSnap.data() : null;

    await this.firestore.collection('despesas').doc(id).update(updates);
    const user = this.authService.getCurrentUser();
    await this.createAuditLog('mark-paid', 'despesas', id, before || null, updates, user?.uid);
  }

  // === MÉTODOS PARA ENTRADAS ===

  async adicionarEntrada(entrada: Omit<Entrada, 'id'>): Promise<string> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const firestoreEntrada: Omit<FirestoreEntrada, 'id'> = {
      descricao: entrada.descricao,
      valor: entrada.valor,
      fonte: entrada.fonte,
      data: firebase.firestore.Timestamp.fromDate(entrada.data),
      userId: user.uid,
      createdAt: firebase.firestore.Timestamp.now(),
      updatedAt: firebase.firestore.Timestamp.now()
    };

    (firestoreEntrada as any).deleted = false;

    const docRef = await this.firestore.collection('entradas').add(firestoreEntrada);
    await this.createAuditLog('create', 'entradas', docRef.id, null, firestoreEntrada, user.uid);
    return docRef.id;
  }

  async atualizarEntrada(id: string, updates: Partial<Entrada>): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const firestoreUpdates: any = {
      ...updates,
      updatedAt: firebase.firestore.Timestamp.now()
    };

    // Converter data para Timestamp se necessário
    if (updates.data) {
      firestoreUpdates.data = firebase.firestore.Timestamp.fromDate(updates.data);
    }

    await this.firestore.collection('entradas').doc(id).update(firestoreUpdates);
    try {
      const beforeSnap = await this.firestore.collection('entradas').doc(id).ref.get();
      const before = beforeSnap.exists ? beforeSnap.data() : null;
      await this.createAuditLog('update', 'entradas', id, before || null, firestoreUpdates, user?.uid);
    } catch (e) {
      console.warn('Não foi possível gravar audit log:', e);
    }
  }

  async removerEntrada(id: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const updates: any = {
      deleted: true,
      deletedAt: firebase.firestore.Timestamp.now(),
      deletedBy: user.uid,
      updatedAt: firebase.firestore.Timestamp.now()
    };

    const beforeSnap = await this.firestore.collection('entradas').doc(id).ref.get();
    const before = beforeSnap.exists ? beforeSnap.data() : null;

    await this.firestore.collection('entradas').doc(id).update(updates);
    await this.createAuditLog('delete', 'entradas', id, before || null, updates, user.uid);
  }

  async restoreEntrada(id: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const updates: any = {
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedAt: firebase.firestore.Timestamp.now()
    };

    const beforeSnap = await this.firestore.collection('entradas').doc(id).ref.get();
    const before = beforeSnap.exists ? beforeSnap.data() : null;

    await this.firestore.collection('entradas').doc(id).update(updates);
    await this.createAuditLog('restore', 'entradas', id, before || null, updates, user.uid);
  }

  async permanentlyDeleteEntrada(id: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const beforeSnap = await this.firestore.collection('entradas').doc(id).ref.get();
    const before = beforeSnap.exists ? beforeSnap.data() : null;

    await this.firestore.collection('entradas').doc(id).delete();
    await this.createAuditLog('permanent-delete', 'entradas', id, before || null, null, user.uid);
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
    await this.createAuditLog('create', 'anotacoes', docRef.id, null, anotacao, user.uid);
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

      this.logger.info('✅ Migração de dados concluída com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro na migração:', error);
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
      ,
      deleted: data.deleted || false,
      deletedAt: data.deletedAt ? data.deletedAt.toDate() : undefined,
      deletedBy: data.deletedBy || undefined
    };
  }

  private mapFirestoreToEntrada(data: FirestoreEntrada): Entrada {
    return {
      id: data.id!,
      descricao: data.descricao,
      valor: data.valor,
      fonte: data.fonte,
      data: data.data.toDate()
      ,
      deleted: data.deleted || false,
      deletedAt: data.deletedAt ? data.deletedAt.toDate() : undefined,
      deletedBy: data.deletedBy || undefined
    };
  }

  // Create an audit log entry
  private async createAuditLog(action: string, collectionName: string, docId: string, before: any, after: any, userId?: string | null) {
    const payload = {
      action,
      collection: collectionName,
      docId,
      before: before || null,
      after: after || null,
      userId: userId || null,
      timestamp: firebase.firestore.Timestamp.now()
    };

    try {
      const docRef = await this.firestore.collection('auditLogs').add(payload);
      // Push the new log into the local subject so UI shows it immediately
      try {
        const mapped = {
          id: (docRef as any).id,
          action: payload.action,
          collection: payload.collection,
          docId: payload.docId,
          before: payload.before,
          after: payload.after,
          userId: payload.userId,
          timestamp: payload.timestamp ? payload.timestamp.toDate() : new Date()
        };
        // Prepend to keep newest first
        this.auditLogsSubject.next([mapped, ...this.auditLogsSubject.value]);
      } catch (inner) {
        // Non-fatal: log but don't block
        this.logger.warn('Falha ao atualizar cache local de audit logs', inner);
      }
    } catch (error) {
      // If write failed, log detailed error so developer can inspect console
      this.logger.error('Falha ao gravar audit log', {
        error,
        payload
      });
      // Push a fallback entry to local subject so the UI can surface the attempted action
      try {
        const fallback = {
          id: `local-${Date.now()}`,
          action: payload.action,
          collection: payload.collection,
          docId: payload.docId,
          before: payload.before,
          after: payload.after,
          userId: payload.userId,
          timestamp: new Date(),
          persisted: false
        };
        this.auditLogsSubject.next([fallback, ...this.auditLogsSubject.value]);
      } catch (inner) {
        this.logger.warn('Falha ao atualizar cache local de audit logs (fallback)', inner);
      }
    }
  }

  // Obter dados atuais (para compatibilidade)
  getDespesas(): Despesa[] {
    return this.despesasSubject.value;
  }

  getEntradas(): Entrada[] {
    return this.entradasSubject.value;
  }

  getAnotacoes(): any[] {
    return this.anotacoesSubject.value;
  }
}