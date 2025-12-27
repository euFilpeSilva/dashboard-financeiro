import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Observable, takeUntil, combineLatest, of, take } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { DespesaService } from '../../services/despesa.service';
import { ThemeService, LayoutConfig } from '../../services/theme.service';
import { UserPreferencesService } from '../../services/user-preferences.service';
import { 
  ResumoDashboard, 
  DespesaPorCategoria, 
  Despesa, 
  PeriodoFinanceiro,
  DadosMensais,
  DestaqueMensal,
  VisualizacaoTipo,
  Entrada
} from '../../models/despesa.model';
import { toDate, formatDateForInput, isSameMonthYear } from '../../utils/date-utils';
import { ChartComponent } from '../chart/chart.component';
import { ChartLineComponent } from '../chart-line/chart-line.component';
import { ChartBarComponent } from '../chart-bar/chart-bar.component';
// DataDebugComponent removed from imports — unused in this component
import { CustomizableLayoutComponent } from '../customizable-layout/customizable-layout.component';
import { AlertsModalComponent } from '../alerts-modal/alerts-modal.component';
import { NotesMuralComponent } from '../notes-mural/notes-mural.component';
import { ToastService } from '../../services/toast.service';

// Anotações are now handled by `NotesMuralComponent`.

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartComponent, ChartBarComponent, ChartLineComponent, CustomizableLayoutComponent, AlertsModalComponent, NotesMuralComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  // caches para valores derivados (mantêm compatibilidade com métodos síncronos existentes)
  private _gastosDoMesTotal: number = 0;
  private _entradasDoMesTotal: number = 0;
  private _contarDespesasPagas: number = 0;
  private _contarDespesasPendentes: number = 0;
  private _metaValorMesAtual: number = 0;
  private _percentualMetaUsadaMesAtual: number = 0;
  private _metaMesRestante: number = 0;
  private _totalAlertas: number = 0;
  private _percentualMetaUsadaGeral: number = 0;
  // caches de coleções (substituem arrays públicos legados)
  private _todasDespesas: Despesa[] = [];
  private _todasEntradas: Entrada[] = [];
  
  // Propriedades de layout e tema
  currentTheme = 'compacto';
  currentLayout: LayoutConfig = {
    tipo: 'compacto',
    gridColumns: 4,
    cardSpacing: 'small',
    cardSize: 'small',
    showSidebar: false,
    sidebarPosition: 'left',
    customizable: false,
    enableDragDrop: false
  };
  
  resumo: ResumoDashboard = {
    totalEntradas: 0,
    totalDespesas: 0,
    saldoPrevisto: 0,
    despesasPagas: 0,
    despesasPendentes: 0,
    despesasVencidas: 0,
    despesasProximasVencimento: 0
  };
  // Observable-backed resumo for template async pipe
  resumo$: import('rxjs').Observable<ResumoDashboard> | null = null;

  despesasPorCategoria$?: Observable<DespesaPorCategoria[]>;
  despesasVencidas$?: Observable<Despesa[]>;
  despesasProximasVencimento$?: Observable<Despesa[]>;
  despesasDoMes$?: Observable<Despesa[]>;
  // Observables derived for template metrics
  contarDespesasPagas$?: Observable<number>;
  contarDespesasPendentes$?: Observable<number>;
  gastosDoMesTotal$?: Observable<number>;
  entradasDoMesTotal$?: Observable<number>;
  totalAlertas$?: Observable<number>;
  // Derived observables for monthly meta calculations
  metaValorMesAtual$?: Observable<number>;
  percentualMetaUsadaMesAtual$?: Observable<number>;
  metaMesRestante$?: Observable<number>;
  metaMesProgressWidth$?: Observable<number>;
  
  // Propriedades para armazenar todos os dados (migradas para caches privados)
  periodoAtual: PeriodoFinanceiro = { mes: 0, ano: 0, descricao: '' };
  
  // Novos dados para seção mensal
  dadosMensais: DadosMensais[] = [];
  dadosMensais$?: Observable<DadosMensais[]>;
  // observable-backed destaques for async pipe usage
  destaquesMensais$?: Observable<DestaqueMensal[]>;
  // Derived observables for general meta (global)
  metaBudgetValor$?: Observable<number>;
  percentualMetaUsada$?: Observable<number>;
  metaProgressWidth$?: Observable<number>;
  
  // Estados de navegação
  showDadosMensais = false;
  
  // Modo de visualização das despesas do mês
  modoVisualizacaoDespesas: 'grade' | 'lista' = 'grade';
  
  // Sistema de anotações
  // Sistema de anotações is now handled by `NotesMuralComponent`.
  
  // Tipos de visualização
  tiposVisualizacao: VisualizacaoTipo[] = [
    { id: 'resumida', nome: 'Resumida (Todos os meses)', descricao: 'Visão geral de todos os meses' },
    { id: 'detalhada', nome: 'Detalhada (Mês específico)', descricao: 'Análise detalhada por mês' }
  ];
  
  visualizacaoAtiva: VisualizacaoTipo = this.tiposVisualizacao[0];

  // Propriedades para visualização detalhada
  mesSelecionado: number = new Date().getMonth() + 1;
  anoSelecionado: number = new Date().getFullYear();
  despesasDoMesDetalhado: Despesa[] = [];
  entradasDoMesDetalhado: Entrada[] = [];
  // entradasDoMes alias removed — use `entradasDoMes$` instead
  entradasDoMes$?: Observable<Entrada[]>;
  resumoMesDetalhado = {
    totalEntradas: 0,
    totalDespesas: 0,
    saldo: 0,
    despesasPagas: 0,
    despesasPendentes: 0,
    despesasVencidas: 0
  };
  categoriasMesDetalhado: DespesaPorCategoria[] = [];

  // Opções de meses e anos
  meses = [
    { valor: 1, nome: 'Janeiro' },
    { valor: 2, nome: 'Fevereiro' },
    { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' },
    { valor: 5, nome: 'Maio' },
    { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' },
    { valor: 8, nome: 'Agosto' },
    { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' },
    { valor: 11, nome: 'Novembro' },
    { valor: 12, nome: 'Dezembro' }
  ];
  
  anos: number[] = [];

  // preferência do usuário (meta de gastos)
  // preferências das metas (lidas do UserPreferences)
  gastoMetaPercentualGeral: number = 100;
  gastoMetaPercentualMensal: number = 100;
  gastoMetaMesReferencia: string = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
  // warn threshold (percent) used across UI and toast logic. Changeable if we want a different default.
  metaWarnThreshold = 75;
  // estados do alerta de meta para evitar toasts repetidos (separados por vertente)
  private lastMetaAlertStateGeral: 'ok' | 'warn' | 'exceeded' | null = null;
  private lastMetaAlertStateMes: 'ok' | 'warn' | 'exceeded' | null = null;
  private lastPercentMetaUsedGeral: number = 0;
  private lastPercentMetaUsedMes: number = 0;
  
  // Period selector for dashboard aggregates (1,3,6,12 months)
  periodOptions = [
    { label: 'Último mês', value: 1 },
    { label: 'Últimos 3 meses', value: 3 },
    { label: 'Últimos 6 meses', value: 6 },
    { label: 'Últimos 12 meses', value: 12 }
  ];
  selectedPeriodMonths = 3;
  
  // Computed metrics for the selected period
  periodMetrics: {
    entradas: number;
    despesas: number;
    saldo: number;
    entradasPrev: number | null;
    despesasPrev: number | null;
    entradasChange: number | null;
    despesasChange: number | null;
    topCategoryName: string | null;
    topCategoryValue: number;
    topCategoryPercent: number;
  } = {
    entradas: 0,
    despesas: 0,
    saldo: 0,
    entradasPrev: null,
    despesasPrev: null,
    entradasChange: null,
    despesasChange: null,
    topCategoryName: null,
    topCategoryValue: 0,
    topCategoryPercent: 0
  };

  // listener remover para ESC (moved to AlertsModalComponent)
  // referência armazenada para o handler de navegação (para remover corretamente)
  private navbarListener: ((event: any) => void) | null = null;
  // flag para saber se o overlay foi movimentado para body
  // overlayAppendedToBody removed: avoid moving DOM nodes out of Angular's view

  constructor(
    private despesaService: DespesaService,
    private router: Router,
    private themeService: ThemeService,
    private userPreferencesService: UserPreferencesService,
    private toastService: ToastService
  ) {
    // Gerar lista de anos (últimos 5 anos + próximos 2 anos)
    const anoAtual = new Date().getFullYear();
    for (let i = anoAtual - 5; i <= anoAtual + 2; i++) {
      this.anos.push(i);
    }
  }

  ngOnInit(): void {
    // Escutar mudanças de tema
    this.themeService.temaAtual$.pipe(takeUntil(this.destroy$))
      .subscribe(tema => {
        this.currentTheme = tema;
        this.currentLayout = this.themeService.layoutAtual;
      });

    this.carregarDados();
    this.carregarPreferenciaVisualizacao();

    // Escutar alteração na preferência de meta de gastos (porcentagem)
    // Geral
    this.userPreferencesService.getPreference$('gastoMetaPercentual')
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => {
        this.gastoMetaPercentualGeral = (p !== null && p !== undefined) ? (p as number) : 100;
        try { this.checkMetaThresholds(); } catch (e) { /* fail silently */ }
      });

    // Mensal percent
    this.userPreferencesService.getPreference$('gastoMetaPercentualMensal')
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => {
        this.gastoMetaPercentualMensal = (p !== null && p !== undefined) ? (p as number) : this.gastoMetaPercentualGeral;
        try { this.checkMetaThresholds(); } catch (e) { /* fail silently */ }
      });

    // Mês de referência para a meta mensal (YYYY-MM)
    this.userPreferencesService.getPreference$('gastoMetaMesReferencia')
      .pipe(takeUntil(this.destroy$))
      .subscribe(p => {
        if (p) this.gastoMetaMesReferencia = p as string;
        try { this.checkMetaThresholds(); } catch (e) { /* fail silently */ }
      });
    
    // Carregar preferência de visibilidade do mural
    // mural visibility and annotations are managed by NotesMuralComponent

    // Escutar eventos de navegação da navbar
    // armazenamos a função ligada para que possamos removê-la posteriormente
    this.navbarListener = this.handleNavbarNavigation.bind(this);
    window.addEventListener('dashboardNavigation', this.navbarListener);

    // compute initial period metrics if monthly data already present
    try { this.computePeriodMetrics(); } catch (e) { /* ignore */ }
  }

  handleNavbarNavigation(event: any): void {
    const { showDadosMensais } = event.detail;
    this.showDadosMensais = showDadosMensais;
  }

  ngOnDestroy(): void {
    if (this.navbarListener) {
      try { window.removeEventListener('dashboardNavigation', this.navbarListener); } catch (e) { /* ignore */ }
      this.navbarListener = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarDados(): void {
    // Expose resumo as an observable (use async pipe in template)
    // Use `tap` to update local state and trigger meta checks without manual subscribe
    this.resumo$ = this.despesaService.getResumoDashboard().pipe(
      tap(resumo => {
        this.resumo = resumo;
        try { this.checkMetaThresholds(); } catch (e) { /* fail silently */ }
      })
    );

    // Despesas por categoria (exposto como observable para uso com async pipe)
    this.despesasPorCategoria$ = this.despesaService.getDespesasPorCategoria();

    // Expor despesas vencidas/proximas como observables e atualizar arrays locais via tap
    this.despesasVencidas$ = this.despesaService.getDespesasVencidas();

    this.despesasProximasVencimento$ = this.despesaService.getDespesasProximasVencimento();

    // Carregar período atual
    this.despesaService.periodoAtual$
      .pipe(takeUntil(this.destroy$))
      .subscribe(periodo => {
        this.periodoAtual = periodo;
      });

    // Carregar todas as despesas para a listagem do mês
    // `despesas$` contém todas as despesas do usuário; para a listagem compacta do mês
    // usamos o observable específico que já filtra pelo mês atual.
    // Expose despesasDoMes as observable and update local array via tap
    this.despesasDoMes$ = this.despesaService.getDespesasDoMes();

    // Ainda armazenamos todas as despesas para uso em visualizações detalhadas
    this.despesaService.despesas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(despesas => {
        this._todasDespesas = despesas || [];
      });

    // Expose entradasDoMes as observable and update local array via tap
    this.entradasDoMes$ = this.despesaService.entradas$.pipe(
      tap((entradas: any[]) => { this._todasEntradas = entradas; this.filtrarEntradasDoMesAtual(entradas); }),
      map((entradas: any[]) => {
        const agora = new Date();
        const mesAtual = agora.getMonth() + 1;
        const anoAtual = agora.getFullYear();
        return (entradas || []).filter(entrada => {
          let dataEntrada: Date | null = null;
          if (!entrada) return false;
          if (entrada.data instanceof Date) dataEntrada = entrada.data as Date;
          else if (typeof entrada.data === 'string') dataEntrada = new Date(entrada.data);
          else if (entrada.data && (entrada.data as any).toDate) dataEntrada = (entrada.data as any).toDate();
          if (!dataEntrada) return false;
          const mesData = dataEntrada.getMonth() + 1;
          const anoData = dataEntrada.getFullYear();
          return mesData === mesAtual && anoData === anoAtual;
        });
      })
    );

    // Derived observables for template metrics
    this.contarDespesasPagas$ = this.despesasDoMes$?.pipe(
      map(arr => (arr || []).filter(d => d.paga).length)
    );

    this.contarDespesasPendentes$ = this.despesasDoMes$?.pipe(
      map(arr => (arr || []).filter(d => !d.paga).length)
    );

    this.gastosDoMesTotal$ = this.despesasDoMes$?.pipe(
      map(arr => (arr || []).reduce((s, d) => s + (d.valor || 0), 0))
    );

    this.entradasDoMesTotal$ = this.entradasDoMes$?.pipe(
      map(arr => (arr || []).reduce((s, e) => s + (e.valor || 0), 0))
    );

    // Derived observables for meta do mês (valor, percentual, restante, progress width)
    this.metaValorMesAtual$ = this.entradasDoMesTotal$?.pipe(
      map(totalEntradasMes => {
        const metaPercent = this.gastoMetaPercentualMensal ?? this.gastoMetaPercentualGeral ?? 100;
        if (!totalEntradasMes || totalEntradasMes === 0) return 0;
        return Math.round((totalEntradasMes * (metaPercent / 100)) * 100) / 100;
      })
    );

    this.percentualMetaUsadaMesAtual$ = combineLatest([
      this.gastosDoMesTotal$ ?? of(0),
      this.metaValorMesAtual$ ?? of(0)
    ]).pipe(
      map(([gastos, meta]) => {
        if (!meta || meta === 0) return 0;
        return Math.round((gastos / meta) * 100);
      })
    );

    this.metaMesRestante$ = combineLatest([
      this.metaValorMesAtual$ ?? of(0),
      this.gastosDoMesTotal$ ?? of(0)
    ]).pipe(
      map(([meta, gastos]) => Math.round((meta - gastos) * 100) / 100)
    );

    this.metaMesProgressWidth$ = this.percentualMetaUsadaMesAtual$?.pipe(
      map(pct => Math.min(Math.max(pct, 0), 200))
    );

    this.totalAlertas$ = combineLatest([
      this.despesasVencidas$ ?? of([]),
      this.despesasProximasVencimento$ ?? of([]),
      this.resumo$ ?? of(this.resumo),
      this.percentualMetaUsada$ ?? of(0),
      this.percentualMetaUsadaMesAtual$ ?? of(0)
    ]).pipe(
      map(([vencidas, proximas, resumo, percentualGeral, percentualMes]) => {
        const venc = (vencidas || []).length;
        const prox = (proximas || []).length;
        const metaGeralExcedida = (percentualGeral >= 100) ? 1 : 0;
        const metaMesExcedida = (percentualMes >= 100) ? 1 : 0;
        return venc + prox + metaGeralExcedida + metaMesExcedida;
      })
    );

    // Subscribir caches para permitir chamadas síncronas legadas no componente
    this.gastosDoMesTotal$?.pipe(takeUntil(this.destroy$)).subscribe(v => this._gastosDoMesTotal = v || 0);
    this.entradasDoMesTotal$?.pipe(takeUntil(this.destroy$)).subscribe(v => this._entradasDoMesTotal = v || 0);
    this.contarDespesasPagas$?.pipe(takeUntil(this.destroy$)).subscribe(v => this._contarDespesasPagas = v || 0);
    this.contarDespesasPendentes$?.pipe(takeUntil(this.destroy$)).subscribe(v => this._contarDespesasPendentes = v || 0);
    this.metaValorMesAtual$?.pipe(takeUntil(this.destroy$)).subscribe(v => this._metaValorMesAtual = v || 0);
    this.percentualMetaUsadaMesAtual$?.pipe(takeUntil(this.destroy$)).subscribe(v => this._percentualMetaUsadaMesAtual = v || 0);
    this.metaMesRestante$?.pipe(takeUntil(this.destroy$)).subscribe(v => this._metaMesRestante = v || 0);
    this.totalAlertas$?.pipe(takeUntil(this.destroy$)).subscribe(v => this._totalAlertas = v || 0);

    // Derived observables for global meta (budget based on entradas)
    this.metaBudgetValor$ = this.resumo$?.pipe(
      map(resumo => {
        const metaPercent = this.gastoMetaPercentualGeral ?? 100;
        const entradasGeral = (Array.isArray(this._todasEntradas) && this._todasEntradas.length > 0)
          ? this._todasEntradas.reduce((s: number, e: any) => s + (e.valor || 0), 0)
          : (resumo?.totalEntradas > 0 ? resumo.totalEntradas : 0);
        if (!entradasGeral || entradasGeral === 0) return 0;
        return Math.round((entradasGeral * (metaPercent / 100)) * 100) / 100;
      })
    );

    this.percentualMetaUsada$ = combineLatest([
      this.resumo$ ?? of(this.resumo),
      this.metaBudgetValor$ ?? of(0)
    ]).pipe(
      map(([resumo, meta]) => {
        if (!meta || meta === 0) return 0;
        const gastosGeral = (Array.isArray(this._todasDespesas) && this._todasDespesas.length > 0)
          ? this._todasDespesas.reduce((s, d) => s + (d.valor || 0), 0)
          : (resumo.totalDespesas || 0);
        return Math.round((gastosGeral / meta) * 100);
      })
    );

    this.metaProgressWidth$ = this.percentualMetaUsada$?.pipe(
      map(pct => Math.min(Math.max(pct, 0), 200))
    );

    // Keep caches in sync for legacy synchronous access
    this.percentualMetaUsada$?.pipe(takeUntil(this.destroy$)).subscribe(v => this._percentualMetaUsadaGeral = v || 0);

    // Carregar dados mensais como observable e usar `tap` para efeitos colaterais
    this.dadosMensais$ = this.despesaService.getDadosMensais().pipe(
      tap(dados => {
        this.dadosMensais = dados;
        try { this.computePeriodMetrics(); } catch (e) { /* ignore */ }
      })
    );

    // Destaques mensais (observable for template async)
    this.destaquesMensais$ = this.despesaService.getDestaquesMensais();
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  formatarData(data: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    }).format(new Date(data));
  }

  getPrioridadeClass(prioridade: string): string {
    return `prioridade-${prioridade}`;
  }

  getSaldoClass(): string {
    return this.resumo.saldoPrevisto >= 0 ? 'saldo-positivo' : 'saldo-negativo';
  }

  // Métodos de navegação
  mostrarDadosMensais(): void {
    this.showDadosMensais = true;
  }

  voltarDashboard(): void {
    this.showDadosMensais = false;
  }

  alterarVisualizacao(tipo: VisualizacaoTipo): void {
    this.visualizacaoAtiva = tipo;
    
    // Se for visualização detalhada, carregar dados do mês específico
    if (tipo.id === 'detalhada') {
      this.carregarDadosMesDetalhado();
    }
  }

  // === MÉTODOS PARA VISUALIZAÇÃO DETALHADA ===

  alterarMesSelecionado(): void {
    // Garantir que sejam números (ngModel retorna strings)
    this.mesSelecionado = Number(this.mesSelecionado);
    this.anoSelecionado = Number(this.anoSelecionado);
    
    this.carregarDadosMesDetalhado();
  }

  alterarAnoSelecionado(): void {
    // Garantir que seja número (ngModel retorna strings)
    this.anoSelecionado = Number(this.anoSelecionado);
    
    this.carregarDadosMesDetalhado();
  }

  carregarDadosMesDetalhado(): void {
    if (this._todasDespesas.length === 0 && this._todasEntradas.length === 0) {
      // Aguardar uma emissão das streams de despesas/entradas e então filtrar
      combineLatest([
        this.despesaService.despesas$.pipe(take(1)),
        this.despesaService.entradas$.pipe(take(1))
      ]).pipe(take(1)).subscribe(([despesas, entradas]) => {
        this._todasDespesas = despesas || [];
        this._todasEntradas = entradas || [];
        this.filtrarDadosPorMes(this._todasDespesas);
        this.filtrarEntradasPorMes(this._todasEntradas);
        this.filtrarEntradasDoMesAtual(this._todasEntradas);
      });
      return;
    }

    // Usar os dados já disponíveis nas caches privadas
    this.filtrarDadosPorMes(this._todasDespesas);
    this.filtrarEntradasPorMes(this._todasEntradas);
    this.filtrarEntradasDoMesAtual(this._todasEntradas); // Para o layout compacto
  }

  private filtrarDadosPorMes(despesas: Despesa[]): void {
    // Filtrar despesas do mês/ano selecionado
    this.despesasDoMesDetalhado = despesas.filter(despesa => {
      let dataVencimento: Date;
      
      // Lidar com diferentes formatos de data
      if (despesa.dataVencimento instanceof Date) {
        dataVencimento = despesa.dataVencimento;
      } else if (typeof despesa.dataVencimento === 'string') {
        dataVencimento = new Date(despesa.dataVencimento);
      } else if (despesa.dataVencimento && (despesa.dataVencimento as any).toDate) {
        // Firestore Timestamp
        dataVencimento = (despesa.dataVencimento as any).toDate();
      } else {
        return false;
      }
      
      const mesData = dataVencimento.getMonth() + 1;
      const anoData = dataVencimento.getFullYear();
      
      return mesData === this.mesSelecionado && anoData === this.anoSelecionado;
    });

    // Calcular resumo do mês
    this.calcularResumoMesDetalhado();
    
    // Calcular categorias do mês
    this.calcularCategoriasMesDetalhado();
  }

  private filtrarEntradasPorMes(entradas: any[]): void {
    // Filtrar entradas do mês/ano selecionado
    this.entradasDoMesDetalhado = entradas.filter(entrada => {
      let dataEntrada: Date;
      
      // Lidar com diferentes formatos de data
      if (entrada.data instanceof Date) {
        dataEntrada = entrada.data;
      } else if (typeof entrada.data === 'string') {
        dataEntrada = new Date(entrada.data);
      } else if (entrada.data && (entrada.data as any).toDate) {
        // Firestore Timestamp
        dataEntrada = (entrada.data as any).toDate();
      } else {
        return false;
      }
      
      const mesData = dataEntrada.getMonth() + 1;
      const anoData = dataEntrada.getFullYear();
      
      return mesData === this.mesSelecionado && anoData === this.anoSelecionado;
    });

    // Não armazenamos mais `entradasDoMes` globalmente — usar `entradasDoMesDetalhado` ou `entradasDoMes$` quando necessário

    // Recalcular resumo após carregar entradas
    this.calcularResumoMesDetalhado();
  }

  // Nova função para filtrar entradas do mês atual (layout compacto)
  private filtrarEntradasDoMesAtual(entradas: any[]): void {
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1;
    const anoAtual = agora.getFullYear();
    
    const entradasFiltradas = entradas.filter(entrada => {
      let dataEntrada: Date;
      
      // Lidar com diferentes formatos de data
      if (entrada.data instanceof Date) {
        dataEntrada = entrada.data;
      } else if (typeof entrada.data === 'string') {
        dataEntrada = new Date(entrada.data);
      } else if (entrada.data && (entrada.data as any).toDate) {
        // Firestore Timestamp
        dataEntrada = (entrada.data as any).toDate();
      } else {
        return false;
      }
      
      const mesData = dataEntrada.getMonth() + 1;
      const anoData = dataEntrada.getFullYear();
      
      return mesData === mesAtual && anoData === anoAtual;
    });
    // debug logs removed
  }

  private calcularResumoMesDetalhado(): void {
    const totalDespesas = this.despesasDoMesDetalhado.reduce((total, despesa) => total + despesa.valor, 0);
    const totalEntradas = this.entradasDoMesDetalhado.reduce((total, entrada) => total + entrada.valor, 0);
    
    const despesasPagas = this.despesasDoMesDetalhado.filter(d => d.paga).length;
    const despesasPendentes = this.despesasDoMesDetalhado.filter(d => !d.paga && new Date(d.dataVencimento) >= new Date()).length;
    const despesasVencidas = this.despesasDoMesDetalhado.filter(d => !d.paga && new Date(d.dataVencimento) < new Date()).length;

    this.resumoMesDetalhado = {
      totalEntradas,
      totalDespesas,
      saldo: totalEntradas - totalDespesas,
      despesasPagas,
      despesasPendentes,
      despesasVencidas
    };
  }

  private calcularCategoriasMesDetalhado(): void {
    const categoriasMap = new Map<string, { categoria: any; valor: number; quantidade: number }>();
    
    this.despesasDoMesDetalhado.forEach(despesa => {
      const categoriaId = despesa.categoria.id;
      const atual = categoriasMap.get(categoriaId) || { categoria: despesa.categoria, valor: 0, quantidade: 0 };
      categoriasMap.set(categoriaId, {
        categoria: despesa.categoria,
        valor: atual.valor + despesa.valor,
        quantidade: atual.quantidade + 1
      });
    });

    this.categoriasMesDetalhado = Array.from(categoriasMap.entries()).map(([id, dados]) => ({
      categoria: dados.categoria,
      valor: dados.valor,
      quantidade: dados.quantidade,
      percentual: this.resumoMesDetalhado.totalDespesas > 0 ? (dados.valor / this.resumoMesDetalhado.totalDespesas) * 100 : 0
    })).sort((a, b) => b.valor - a.valor);
  }

  private obterCorCategoria(categoria: string): string {
    const cores = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];
    const index = categoria.length % cores.length;
    return cores[index];
  }

  getNomeMesSelecionado(): string {
    const mes = this.meses.find(m => m.valor === this.mesSelecionado);
    return mes ? mes.nome : '';
  }

  // Métodos para gestão de despesas na listagem
  editarDespesa(despesa: Despesa): void {
    // Redireciona para a página de gestão completa
    this.router.navigate(['/gestao']);
  }

  irParaGestao(): void {
    this.router.navigate(['/gestao']);
  }

  excluirDespesa(despesa: Despesa): void {
    const confirmar = confirm(`Tem certeza que deseja excluir a despesa "${despesa.descricao}"?`);
    if (confirmar) {
      this.despesaService.removerDespesa(despesa.id);
    }
  }

  toggleStatusPagamento(despesa: Despesa): void {
    if (despesa.paga) {
      this.despesaService.marcarComoPendente(despesa.id);
    } else {
      this.despesaService.marcarComoPaga(despesa.id);
    }
  }

  getDespesaStatusClass(despesa: Despesa): string {
    if (despesa.paga) return 'despesa-paga';
    
    const hoje = new Date();
    const vencimento = new Date(despesa.dataVencimento);
    
    if (vencimento < hoje) return 'despesa-vencida';
    
    const diasParaVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diasParaVencimento <= 7) return 'despesa-proxima-vencimento';
    
    return 'despesa-normal';
  }

  getVencimentoClass(despesa: Despesa): string {
    if (despesa.paga) return 'vencimento-pago';
    
    const hoje = new Date();
    const vencimento = new Date(despesa.dataVencimento);
    
    if (vencimento < hoje) return 'vencimento-atrasado';
    
    const diasParaVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diasParaVencimento <= 7) return 'vencimento-proximo';
    
    return 'vencimento-normal';
  }

  getPrioridadeTexto(prioridade: string): string {
    const prioridades = {
      'alta': 'Alta',
      'media': 'Média', 
      'baixa': 'Baixa'
    };
    return prioridades[prioridade as keyof typeof prioridades] || prioridade;
  }

  // Método para alternar modo de visualização das despesas
  alterarVisualizacaoDespesas(modo: 'grade' | 'lista'): void {
    this.modoVisualizacaoDespesas = modo;
    localStorage.setItem('dashboard-modo-visualizacao', modo);
  }

  // Método para carregar preferência de visualização
  private carregarPreferenciaVisualizacao(): void {
    const modoSalvo = localStorage.getItem('dashboard-modo-visualizacao') as 'grade' | 'lista';
    if (modoSalvo && (modoSalvo === 'grade' || modoSalvo === 'lista')) {
      this.modoVisualizacaoDespesas = modoSalvo;
    }
  }

  // Métodos para o layout compacto
  mostrarDetalhes(): void {
    this.showDadosMensais = true;
  }

  // Alerts modal control
  showAlertsModal: boolean = false;

  openAlertsModal(): void {
    this.showAlertsModal = true;
  }

  closeAlertsModal(): void {
    this.showAlertsModal = false;
  }

  // Helper para formatar referência 'YYYY-MM' para 'MMM/YYYY'
  formatMonth(ref: string): string {
    if (!ref || typeof ref !== 'string') return '';
    const parts = ref.split('-');
    if (parts.length !== 2) return '';
    const ano = Number(parts[0]);
    const mes = Number(parts[1]);
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${meses[mes - 1] || ''}/${ano}`;
  }

  adicionarEntrada(): void {
    // Navegar para página de gestão de entradas ou abrir modal
    this.router.navigate(['/gestao']);
  }


  // Adicionar método para voltar ao dashboard
  voltarAoDashboard(): void {
    this.showDadosMensais = false;
  }

  // Funções para o card de alertas
  // Funções para o card de alertas

  // Observables derivados substituem vários getters legados (meta/total do mês).

  // --- Helpers para meta mensal baseada em mês de referência configurado ---
  private parseReferenciaMes(ref: string): { mes: number; ano: number } {
    // espera 'YYYY-MM'
    if (!ref || typeof ref !== 'string') {
      const now = new Date();
      return { mes: now.getMonth() + 1, ano: now.getFullYear() };
    }
    const parts = ref.split('-');
    if (parts.length !== 2) {
      const now = new Date();
      return { mes: now.getMonth() + 1, ano: now.getFullYear() };
    }
    const ano = Number(parts[0]) || new Date().getFullYear();
    const mes = Number(parts[1]) || (new Date().getMonth() + 1);
    return { mes, ano };
  }

  private getEntradasParaReferenciaMes(): number {
    const { mes, ano } = this.parseReferenciaMes(this.gastoMetaMesReferencia);
    if (!Array.isArray(this._todasEntradas) || this._todasEntradas.length === 0) return 0;
    return this._todasEntradas.reduce((s: number, entrada: any) => {
      let data: Date | null = null;
      if (!entrada) return s;
      if (entrada.data instanceof Date) data = entrada.data as Date;
      else if (typeof entrada.data === 'string') data = new Date(entrada.data);
      else if (entrada.data && (entrada.data as any).toDate) data = (entrada.data as any).toDate();
      if (!data) return s;
      if ((data.getMonth() + 1) === mes && data.getFullYear() === ano) return s + (entrada.valor || 0);
      return s;
    }, 0);
  }

  private getDespesasParaReferenciaMes(): number {
    const { mes, ano } = this.parseReferenciaMes(this.gastoMetaMesReferencia);
    if (!Array.isArray(this._todasDespesas) || this._todasDespesas.length === 0) return 0;
    return this._todasDespesas.reduce((s: number, despesa: Despesa) => {
      if (!despesa) return s;
      let data: Date | null = null;
      if (despesa.dataVencimento instanceof Date) data = despesa.dataVencimento as Date;
      else if (typeof despesa.dataVencimento === 'string') data = new Date(despesa.dataVencimento);
      else if (despesa.dataVencimento && (despesa.dataVencimento as any).toDate) data = (despesa.dataVencimento as any).toDate();
      if (!data) return s;
      if ((data.getMonth() + 1) === mes && data.getFullYear() === ano) return s + (despesa.valor || 0);
      return s;
    }, 0);
  }

  getDiasVencimento(despesa: Despesa): string {
    const hoje = new Date();
    const vencimento = new Date(despesa.dataVencimento);
    const diferenca = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diferenca === 0) return 'hoje';
    if (diferenca === 1) return 'há 1 dia';
    return `há ${diferenca} dias`;
  }

  getDiasParaVencimento(despesa: Despesa): string {
    const hoje = new Date();
    const vencimento = new Date(despesa.dataVencimento);
    const diferenca = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diferenca === 0) return 'hoje';
    if (diferenca === 1) return '1 dia';
    return `${diferenca} dias`;
  }

  getPercentualGastoMes(): number {
    // Calcular um orçamento estimado baseado nas entradas ou um valor fixo
    const orcamentoEstimado = this.resumo.totalEntradas > 0
      ? this.resumo.totalEntradas * 0.8 // 80% das entradas como orçamento
      : 5000; // Valor padrão se não houver entradas

    return Math.round((this.resumo.totalDespesas / orcamentoEstimado) * 100);
  }

  /**
   * Retorna o percentual do uso da meta (quanto da meta definida já foi consumida).
   * Ex: se meta=28% do orçamento e atualmente usamos 56% do orçamento, retorna 200 (% da meta usada).
   */
  getPercentualGastoMesDaMeta(): number {
    // Deprecated: keep for backwards compatibility but prefer getPercentualMetaUsada
    const percentualOrcamento = this.getPercentualGastoMes();
    const meta = this.gastoMetaPercentualGeral ?? 100;
    if (!meta || meta <= 0) return 0;
    return Math.round((percentualOrcamento / meta) * 100);
  }

  // Cálculos da meta global agora expostos como observables: `metaBudgetValor$` e `percentualMetaUsada$`.

  /** Checa thresholds de meta e emite toasts quando cruzados (80% e 100%). */
  private checkMetaThresholds(): void {
    // Checar vertente GERAL usando caches atualizados pelas subscriptions
    const percentGeral = this._percentualMetaUsadaGeral;
    let stateGeral: 'ok' | 'warn' | 'exceeded' = 'ok';
    if (percentGeral >= 100) stateGeral = 'exceeded';
    else if (percentGeral >= this.metaWarnThreshold) stateGeral = 'warn';

    if (this.lastMetaAlertStateGeral !== stateGeral) {
      if (stateGeral === 'warn') {
        this.toastService.warning('Atenção: Meta (Geral) próxima', `Você atingiu ${percentGeral}% da meta geral (${this.gastoMetaPercentualGeral}% das entradas).`);
      } else if (stateGeral === 'exceeded') {
        this.toastService.error('Meta (Geral) excedida', `Você ultrapassou a meta geral (${percentGeral}% da meta — Meta: ${this.gastoMetaPercentualGeral}% das entradas).`);
      }
      this.lastMetaAlertStateGeral = stateGeral;
    }
    this.lastPercentMetaUsedGeral = percentGeral;

    // Checar vertente MÊS ATUAL usando caches
    const percentMes = this._percentualMetaUsadaMesAtual;
    let stateMes: 'ok' | 'warn' | 'exceeded' = 'ok';
    if (percentMes >= 100) stateMes = 'exceeded';
    else if (percentMes >= this.metaWarnThreshold) stateMes = 'warn';

    // Só notificar se houver meta do mês calculável (meta > 0)
    const metaMesValor = this._metaValorMesAtual;
    if (metaMesValor && metaMesValor > 0) {
      if (this.lastMetaAlertStateMes !== stateMes) {
        if (stateMes === 'warn') {
          this.toastService.warning('Atenção: Meta (Mês) próxima', `Você atingiu ${percentMes}% da meta do mês (${this.gastoMetaPercentualMensal}% das entradas do mês ${this.gastoMetaMesReferencia}).`);
        } else if (stateMes === 'exceeded') {
          this.toastService.error('Meta (Mês) excedida', `Você ultrapassou a meta do mês (${percentMes}% da meta — Meta: ${this.gastoMetaPercentualMensal}% das entradas do mês ${this.gastoMetaMesReferencia}).`);
        }
        this.lastMetaAlertStateMes = stateMes;
      }
      this.lastPercentMetaUsedMes = percentMes;
    }
  }

  // Atualiza getTotalAlertas para considerar ambas as vertentes de meta (contagem simples)
  getTotalAlertas(): number {
    return this._totalAlertas;
  }

  // ------- PERIOD METRICS / HELPERS -------
  /** recomputa métricas (entradas/despesas/variações/top categoria) para o período selecionado */
  computePeriodMetrics(): void {
    const N = Number(this.selectedPeriodMonths) || 1;
    if (!Array.isArray(this.dadosMensais) || this.dadosMensais.length === 0) {
      this.periodMetrics = { ...this.periodMetrics, entradas: 0, despesas: 0, saldo: 0 };
      return;
    }

    const currentSlice = this.dadosMensais.slice(0, N);
    const prevSlice = this.dadosMensais.slice(N, N * 2);

    const sum = (arr: any[], key: string) => arr.reduce((s, it) => s + (it && it[key] ? it[key] : 0), 0);

    const entradasCurr = sum(currentSlice, 'entradas');
    const despesasCurr = sum(currentSlice, 'despesas');
    const entradasPrev = prevSlice.length ? sum(prevSlice, 'entradas') : null;
    const despesasPrev = prevSlice.length ? sum(prevSlice, 'despesas') : null;

    const entradasChange = (entradasPrev === null || entradasPrev === 0) ? null : Math.round(((entradasCurr - entradasPrev) / entradasPrev) * 100);
    const despesasChange = (despesasPrev === null || despesasPrev === 0) ? null : Math.round(((despesasCurr - despesasPrev) / despesasPrev) * 100);

    // Top category in the selected months (aggregate by category name)
    const monthsSet = new Set<string>(currentSlice.map(d => `${d.mes}-${d.ano}`));
    const catMap = new Map<string, number>();
    if (Array.isArray(this._todasDespesas)) {
      this._todasDespesas.forEach(d => {
        if (!d) return;
        let data: Date | null = null;
        if (d.dataVencimento instanceof Date) data = d.dataVencimento as Date;
        else if (typeof d.dataVencimento === 'string') data = new Date(d.dataVencimento);
        else if (d.dataVencimento && (d.dataVencimento as any).toDate) data = (d.dataVencimento as any).toDate();
        if (!data) return;
        const key = `${data.getMonth() + 1}-${data.getFullYear()}`;
        if (!monthsSet.has(key)) return;
        const nome = (d.categoria && d.categoria.nome) ? d.categoria.nome : 'Outros';
        const atual = catMap.get(nome) || 0;
        catMap.set(nome, atual + (d.valor || 0));
      });
    }

    let topName = null;
    let topValue = 0;
    catMap.forEach((v, k) => {
      if (v > topValue) { topValue = v; topName = k; }
    });

    const despesasTotal = despesasCurr;
    const topPercent = despesasTotal > 0 ? Math.round((topValue / despesasTotal) * 100) : 0;

    this.periodMetrics = {
      entradas: entradasCurr,
      despesas: despesasCurr,
      saldo: entradasCurr - despesasCurr,
      entradasPrev,
      despesasPrev,
      entradasChange,
      despesasChange,
      topCategoryName: topName,
      topCategoryValue: topValue,
      topCategoryPercent: topPercent
    };
  }

  onPeriodChange(): void {
    this.computePeriodMetrics();
  }

  /** Simple linear projection: assumes uniform daily saldo change this month and projects to end of month */
  getProjectionSaldo(): number | null {
    // Use dadosMensais first entry as current month (dadosMensais is ordered newest-first)
    if (!Array.isArray(this.dadosMensais) || this.dadosMensais.length === 0) return null;
    const current = this.dadosMensais[0];
    // If we don't have saldo or meses data, return null
    if (typeof current.saldo !== 'number') return null;

    // crude projection: daily average change over current month = saldo / days so far -> project to month-end
    const now = new Date();
    const diaHoje = now.getDate();
    const diasNoMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (diaHoje <= 1) return current.saldo; // nothing to project

    // estimate daily change based on saldo so far (saldo = entradas - despesas). We assume linear accumulation.
    const dailyAvg = current.saldo / diaHoje;
    const projected = current.saldo + dailyAvg * (diasNoMes - diaHoje);
    return Math.round(projected * 100) / 100;
  }
}
