import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from './auth.service';
import firebase from 'firebase/compat/app';
import { ToastService } from './toast.service';
import { LoggerService } from './logger.service';

export interface UserPreferences {
  id?: string;
  userId: string;
  
  // Preferências de visualização
  dashboardModoVisualizacao: 'grade' | 'lista';
  despesasModoVisualizacao: 'grade' | 'lista';
  gestaoModoVisualizacao: 'grade' | 'lista';
  
  // Configurações de layout
  dashboardCardPositions: any;
  dashboardTema: string;
  dashboardMuralVisivel: boolean;
  
  // Layout customizável
  dashboardLayoutConfig: any;
  customizableLayoutTheme: string;
  // Meta de gastos (porcentagem do orçamento)
  // Meta geral (considera todas as entradas/despesas)
  gastoMetaPercentual?: number;
  // Meta aplicada apenas ao mês de referência
  gastoMetaPercentualMensal?: number;
  // Mês de referência para a meta mensal no formato 'YYYY-MM'
  gastoMetaMesReferencia?: string;
  
  // Timestamps
  createdAt: firebase.firestore.Timestamp;
  updatedAt: firebase.firestore.Timestamp;
}

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private preferencesSubject = new BehaviorSubject<UserPreferences | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public readonly preferences$ = this.preferencesSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();

  private currentUserId: string | null = null;

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private toastService: ToastService,
    private logger: LoggerService
  ) {
    this.initializeListeners();
  }

  private initializeListeners(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.uid !== this.currentUserId) {
        this.currentUserId = user.uid;
        this.loadUserPreferences(user.uid);
      } else if (!user) {
        this.currentUserId = null;
        this.clearPreferences();
      }
    });
  }

  private async loadUserPreferences(userId: string): Promise<void> {
    this.loadingSubject.next(true);
    
    try {
      const doc = await this.firestore.collection('user-preferences').doc(userId).get().toPromise();
      
      if (doc && doc.exists) {
        const data = doc.data() as UserPreferences;
        this.preferencesSubject.next(data);
      } else {
        // Criar preferências padrão para novo usuário
        await this.createDefaultPreferences(userId);
      }
    } catch (error) {
      console.error('Erro ao carregar preferências do usuário:', error);
      await this.createDefaultPreferences(userId);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  private async createDefaultPreferences(userId: string): Promise<void> {
  const defaultPreferences: Omit<UserPreferences, 'id'> = {
      userId,
      dashboardModoVisualizacao: 'grade',
      despesasModoVisualizacao: 'grade',
      gestaoModoVisualizacao: 'grade',
      dashboardCardPositions: null,
      dashboardTema: 'customizavel',
      dashboardMuralVisivel: true,
      dashboardLayoutConfig: null,
      customizableLayoutTheme: 'dark',
      gastoMetaPercentual: 100,
      gastoMetaPercentualMensal: 100,
      gastoMetaMesReferencia: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`,
      createdAt: firebase.firestore.Timestamp.now(),
      updatedAt: firebase.firestore.Timestamp.now()
    };

    try {
      await this.firestore.collection('user-preferences').doc(userId).set(defaultPreferences);
      this.preferencesSubject.next(defaultPreferences as UserPreferences);
    } catch (error) {
      console.error('Erro ao criar preferências padrão:', error);
    }
  }

  private clearPreferences(): void {
    this.preferencesSubject.next(null);
    this.loadingSubject.next(false);
  }

  // === MÉTODOS PÚBLICOS ===

  async updatePreference<K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const updates = {
        [key]: value,
        updatedAt: firebase.firestore.Timestamp.now()
      };

      await this.firestore.collection('user-preferences').doc(user.uid).update(updates);
      
      // Atualizar estado local
      const currentPrefs = this.preferencesSubject.value;
      if (currentPrefs) {
        this.preferencesSubject.next({
          ...currentPrefs,
          [key]: value,
          updatedAt: firebase.firestore.Timestamp.now()
        });
      }
    } catch (error) {
      console.error(`Erro ao atualizar preferência ${String(key)}:`, error);
  const errAny = error as any;
  const msg = (errAny && ((errAny.code === 'permission-denied') || (errAny.message && String(errAny.message).includes('Missing or insufficient permissions'))));
      if (msg) {
        // Fallback: salvar localmente e notificar o usuário
        try {
          const currentPrefs = this.preferencesSubject.value || ({} as UserPreferences);
          const merged = {
            ...currentPrefs,
            [key]: value,
            updatedAt: firebase.firestore.Timestamp.now()
          } as UserPreferences;
          // Save to localStorage for persistence on this device
          const storageKey = `user-preferences-local-${user.uid}`;
          localStorage.setItem(storageKey, JSON.stringify(merged));
          this.preferencesSubject.next(merged);
          this.toastService.warning('Preferência salva localmente', 'Não foi possível salvar no servidor. A preferência foi gravada localmente neste dispositivo.');
          return;
        } catch (inner) {
          console.error('Falha ao salvar preferência localmente:', inner);
        }
      }
      throw error;
    }
  }

  async updateMultiplePreferences(updates: Partial<UserPreferences>): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const firestoreUpdates = {
        ...updates,
        updatedAt: firebase.firestore.Timestamp.now()
      };

      await this.firestore.collection('user-preferences').doc(user.uid).update(firestoreUpdates);
      
      // Atualizar estado local
      const currentPrefs = this.preferencesSubject.value;
      if (currentPrefs) {
        this.preferencesSubject.next({
          ...currentPrefs,
          ...updates,
          updatedAt: firebase.firestore.Timestamp.now()
        } as UserPreferences);
      }
    } catch (error) {
      console.error('Erro ao atualizar múltiplas preferências:', error);
  const errAny = error as any;
  const msg = (errAny && ((errAny.code === 'permission-denied') || (errAny.message && String(errAny.message).includes('Missing or insufficient permissions'))));
      if (msg) {
        // Fallback: salvar localmente
        try {
          const currentPrefs = this.preferencesSubject.value || ({} as UserPreferences);
          const merged = {
            ...currentPrefs,
            ...updates,
            updatedAt: firebase.firestore.Timestamp.now()
          } as UserPreferences;
          const storageKey = `user-preferences-local-${user.uid}`;
          localStorage.setItem(storageKey, JSON.stringify(merged));
          this.preferencesSubject.next(merged);
          this.toastService.warning('Preferências salvas localmente', 'Não foi possível salvar no servidor. As preferências foram gravadas localmente neste dispositivo.');
          return;
        } catch (inner) {
          console.error('Falha ao salvar preferências localmente:', inner);
        }
      }
      throw error;
    }
  }

  // === MÉTODOS DE CONVENIÊNCIA ===

  getPreference<K extends keyof UserPreferences>(key: K): UserPreferences[K] | null {
    const prefs = this.preferencesSubject.value;
    return prefs ? prefs[key] : null;
  }

  getPreference$<K extends keyof UserPreferences>(key: K): Observable<UserPreferences[K] | null> {
    return this.preferences$.pipe(
      map(prefs => prefs ? prefs[key] : null)
    );
  }

  // Métodos específicos para retrocompatibilidade
  async setDashboardModoVisualizacao(modo: 'grade' | 'lista'): Promise<void> {
    await this.updatePreference('dashboardModoVisualizacao', modo);
  }

  getDashboardModoVisualizacao(): 'grade' | 'lista' {
    return this.getPreference('dashboardModoVisualizacao') || 'grade';
  }

  async setDespesasModoVisualizacao(modo: 'grade' | 'lista'): Promise<void> {
    await this.updatePreference('despesasModoVisualizacao', modo);
  }

  getDespesasModoVisualizacao(): 'grade' | 'lista' {
    return this.getPreference('despesasModoVisualizacao') || 'grade';
  }

  async setGestaoModoVisualizacao(modo: 'grade' | 'lista'): Promise<void> {
    await this.updatePreference('gestaoModoVisualizacao', modo);
  }

  getGestaoModoVisualizacao(): 'grade' | 'lista' {
    return this.getPreference('gestaoModoVisualizacao') || 'grade';
  }

  async setDashboardTema(tema: string): Promise<void> {
    await this.updatePreference('dashboardTema', tema);
  }

  getDashboardTema(): string {
    return this.getPreference('dashboardTema') || 'customizavel';
  }

  async setDashboardMuralVisivel(visivel: boolean): Promise<void> {
    await this.updatePreference('dashboardMuralVisivel', visivel);
  }

  getDashboardMuralVisivel(): boolean {
    return this.getPreference('dashboardMuralVisivel') ?? true;
  }

  async setDashboardCardPositions(positions: any): Promise<void> {
    await this.updatePreference('dashboardCardPositions', positions);
  }

  getDashboardCardPositions(): any {
    return this.getPreference('dashboardCardPositions');
  }

  async setDashboardLayoutConfig(config: any): Promise<void> {
    await this.updatePreference('dashboardLayoutConfig', config);
  }

  getDashboardLayoutConfig(): any {
    return this.getPreference('dashboardLayoutConfig');
  }

  // === Meta de gastos (porcentagem) ===
  async setGastoMetaPercentual(percentual: number): Promise<void> {
    const p = Math.max(0, Math.min(100, Math.round(percentual)));
    await this.updatePreference('gastoMetaPercentual', p as any);
  }

  getGastoMetaPercentual(): number {
    return this.getPreference('gastoMetaPercentual') ?? 100;
  }

  // --- Meta mensal ---
  async setGastoMetaPercentualMensal(percentual: number): Promise<void> {
    const p = Math.max(0, Math.min(100, Math.round(percentual)));
    await this.updatePreference('gastoMetaPercentualMensal', p as any);
  }

  getGastoMetaPercentualMensal(): number {
    return this.getPreference('gastoMetaPercentualMensal') ?? this.getGastoMetaPercentual();
  }

  async setGastoMetaMesReferencia(yyyyMm: string): Promise<void> {
    // expected format: 'YYYY-MM'
    await this.updatePreference('gastoMetaMesReferencia', yyyyMm as any);
  }

  getGastoMetaMesReferencia(): string {
    return this.getPreference('gastoMetaMesReferencia') || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
  }

  // === MIGRAÇÃO DO LOCALSTORAGE ===

  async migrarPreferenciasLocalStorage(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const migracoes: Partial<UserPreferences> = {};

    // Verificar e migrar cada preferência do localStorage
    const dashboardModo = localStorage.getItem('dashboard-modo-visualizacao') as 'grade' | 'lista';
    if (dashboardModo) {
      migracoes.dashboardModoVisualizacao = dashboardModo;
      localStorage.removeItem('dashboard-modo-visualizacao');
    }

    const despesasModo = localStorage.getItem('despesas-modo-visualizacao') as 'grade' | 'lista';
    if (despesasModo) {
      migracoes.despesasModoVisualizacao = despesasModo;
      localStorage.removeItem('despesas-modo-visualizacao');
    }

    const gestaoModo = localStorage.getItem('gestao-modo-visualizacao') as 'grade' | 'lista';
    if (gestaoModo) {
      migracoes.gestaoModoVisualizacao = gestaoModo;
      localStorage.removeItem('gestao-modo-visualizacao');
    }

    const dashboardTema = localStorage.getItem('dashboard-tema');
    if (dashboardTema) {
      migracoes.dashboardTema = dashboardTema;
      localStorage.removeItem('dashboard-tema');
    }

    const muralVisivel = localStorage.getItem('dashboard-mural-visivel');
    if (muralVisivel) {
      migracoes.dashboardMuralVisivel = muralVisivel === 'true';
      localStorage.removeItem('dashboard-mural-visivel');
    }

    const cardPositions = localStorage.getItem('dashboard-card-positions');
    if (cardPositions) {
      try {
        migracoes.dashboardCardPositions = JSON.parse(cardPositions);
        localStorage.removeItem('dashboard-card-positions');
      } catch (error) {
        console.warn('Erro ao migrar posições dos cards:', error);
      }
    }

    const layoutConfig = localStorage.getItem('dashboard-layout-config');
    if (layoutConfig) {
      try {
        migracoes.dashboardLayoutConfig = JSON.parse(layoutConfig);
        localStorage.removeItem('dashboard-layout-config');
      } catch (error) {
        console.warn('Erro ao migrar configuração de layout:', error);
      }
    }

    // Aplicar migrações se houver dados
    if (Object.keys(migracoes).length > 0) {
      this.logger.info('🔄 Migrando preferências do localStorage para Firestore...');
      await this.updateMultiplePreferences(migracoes);
      this.logger.info('✅ Migração de preferências concluída!');
    }
  }
}