import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DespesaService } from '../../services/despesa.service';
import { 
  ResumoDashboard, 
  DespesaPorCategoria, 
  Despesa, 
  PeriodoFinanceiro,
  DadosMensais,
  DestaqueMensal,
  VisualizacaoTipo
} from '../../models/despesa.model';
import { ChartComponent } from '../chart/chart.component';
import { ChartBarComponent } from '../chart-bar/chart-bar.component';
import { DespesaListComponent } from '../despesa-list/despesa-list.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartComponent, DespesaListComponent, ChartBarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  resumo: ResumoDashboard = {
    totalEntradas: 0,
    totalDespesas: 0,
    saldoPrevisto: 0,
    despesasPagas: 0,
    despesasPendentes: 0,
    despesasVencidas: 0,
    despesasProximasVencimento: 0
  };

  despesasPorCategoria: DespesaPorCategoria[] = [];
  despesasVencidas: Despesa[] = [];
  despesasProximasVencimento: Despesa[] = [];
  despesasDoMes: Despesa[] = []; // Nova propriedade para despesas do mês atual
  periodoAtual: PeriodoFinanceiro = { mes: 0, ano: 0, descricao: '' };
  
  // Novos dados para seção mensal
  dadosMensais: DadosMensais[] = [];
  destaquesMensais: DestaqueMensal[] = [];
  
  // Estados de navegação
  showDespesaList = false;
  showDadosMensais = false;
  
  // Modo de visualização das despesas do mês
  modoVisualizacaoDespesas: 'grade' | 'lista' = 'grade';
  
  // Sistema de temas
  temaAtual = 'classico';
  temasDisponiveis = [
    { id: 'compacto', nome: '📱 Compacto', descricao: 'Layout otimizado' },
    { id: 'classico', nome: '🎨 Clássico', descricao: 'Layout tradicional' },
    { id: 'customizavel', nome: '⚙️ Customizável', descricao: 'Layout flexível' }
  ];
  
  // Tipos de visualização
  tiposVisualizacao: VisualizacaoTipo[] = [
    { id: 'resumida', nome: 'Resumida (Todos os meses)', descricao: 'Visão geral de todos os meses' },
    { id: 'detalhada', nome: 'Detalhada (Mês específico)', descricao: 'Análise detalhada por mês' }
  ];
  
  visualizacaoAtiva: VisualizacaoTipo = this.tiposVisualizacao[0];

  constructor(private despesaService: DespesaService) {}

  ngOnInit(): void {
    this.carregarDados();
    this.carregarTema();
    this.carregarPreferenciaVisualizacao();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarDados(): void {
    // Carregar resumo do dashboard
    this.despesaService.getResumoDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe(resumo => {
        this.resumo = resumo;
      });

    // Carregar despesas por categoria
    this.despesaService.getDespesasPorCategoria()
      .pipe(takeUntil(this.destroy$))
      .subscribe(categorias => {
        this.despesasPorCategoria = categorias;
      });

    // Carregar despesas vencidas
    this.despesaService.getDespesasVencidas()
      .pipe(takeUntil(this.destroy$))
      .subscribe(vencidas => {
        this.despesasVencidas = vencidas;
      });

    // Carregar despesas próximas ao vencimento
    this.despesaService.getDespesasProximasVencimento()
      .pipe(takeUntil(this.destroy$))
      .subscribe(proximas => {
        this.despesasProximasVencimento = proximas;
      });

    // Carregar período atual
    this.despesaService.periodoAtual$
      .pipe(takeUntil(this.destroy$))
      .subscribe(periodo => {
        this.periodoAtual = periodo;
      });

    // Carregar todas as despesas para a listagem do mês
    this.despesaService.despesas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(despesas => {
        this.despesasDoMes = despesas;
      });

    // Carregar dados mensais
    this.despesaService.getDadosMensais()
      .pipe(takeUntil(this.destroy$))
      .subscribe(dados => {
        console.log('Dados mensais carregados:', dados);
        this.dadosMensais = dados;
      });

    // Carregar destaques mensais
    this.despesaService.getDestaquesMensais()
      .pipe(takeUntil(this.destroy$))
      .subscribe(destaques => {
        console.log('Destaques mensais carregados:', destaques);
        this.destaquesMensais = destaques;
      });
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
  mostrarDespesas(): void {
    this.showDespesaList = true;
    this.showDadosMensais = false;
  }

  mostrarDadosMensais(): void {
    console.log('Clicou em Dados por Mês');
    console.log('dadosMensais:', this.dadosMensais);
    console.log('destaquesMensais:', this.destaquesMensais);
    this.showDadosMensais = true;
    this.showDespesaList = false;
    console.log('showDadosMensais agora é:', this.showDadosMensais);
  }

  voltarDashboard(): void {
    this.showDespesaList = false;
    this.showDadosMensais = false;
  }

  alterarVisualizacao(tipo: VisualizacaoTipo): void {
    this.visualizacaoAtiva = tipo;
  }

  // Métodos para gestão de despesas na listagem
  editarDespesa(despesa: Despesa): void {
    // Por enquanto, redireciona para a seção de gestão
    // Futuramente pode abrir um modal de edição
    this.mostrarDespesas();
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

  // Métodos de gerenciamento de temas
  alterarTema(temaId: string): void {
    this.temaAtual = temaId;
    this.aplicarTema(temaId);
    this.salvarTema(temaId);
  }

  private aplicarTema(temaId: string): void {
    // Remove classes de tema anteriores
    document.body.className = document.body.className.replace(/tema-\w+/g, '');
    document.body.classList.add(`tema-${temaId}`);

    // Aplica variáveis CSS baseadas no tema
    const root = document.documentElement;
    
    switch (temaId) {
      case 'compacto':
        root.style.setProperty('--tema-cor-primaria', '#2563eb');
        root.style.setProperty('--tema-cor-secundaria', '#64748b');
        root.style.setProperty('--tema-espacamento', '8px');
        root.style.setProperty('--tema-borda-radius', '4px');
        root.style.setProperty('--tema-fonte-tamanho', '0.875rem');
        break;
      case 'classico':
        root.style.setProperty('--tema-cor-primaria', '#059669');
        root.style.setProperty('--tema-cor-secundaria', '#6b7280');
        root.style.setProperty('--tema-espacamento', '16px');
        root.style.setProperty('--tema-borda-radius', '8px');
        root.style.setProperty('--tema-fonte-tamanho', '1rem');
        break;
      case 'customizavel':
        root.style.setProperty('--tema-cor-primaria', '#7c3aed');
        root.style.setProperty('--tema-cor-secundaria', '#9ca3af');
        root.style.setProperty('--tema-espacamento', '12px');
        root.style.setProperty('--tema-borda-radius', '6px');
        root.style.setProperty('--tema-fonte-tamanho', '1rem');
        break;
    }
  }

  private carregarTema(): void {
    const temaSalvo = localStorage.getItem('dashboard-tema');
    if (temaSalvo && this.temasDisponiveis.some(t => t.id === temaSalvo)) {
      this.temaAtual = temaSalvo;
      this.aplicarTema(temaSalvo);
    } else {
      this.aplicarTema(this.temaAtual);
    }
  }

  private salvarTema(temaId: string): void {
    localStorage.setItem('dashboard-tema', temaId);
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
}
