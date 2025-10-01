import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DespesaService } from '../../services/despesa.service';
import { ToastService } from '../../services/toast.service';
import { Despesa, Entrada } from '../../models/despesa.model';
import { DespesaFormComponent } from '../despesa-form/despesa-form.component';
import { EntradaFormComponent } from '../entrada-form/entrada-form.component';
import { ConfirmationModalComponent } from '../shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-gestao',
  standalone: true,
  imports: [CommonModule, FormsModule, DespesaFormComponent, EntradaFormComponent, ConfirmationModalComponent],
  templateUrl: './gestao.component.html',
  styleUrl: './gestao.component.scss'
})
export class GestaoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Estados das abas
  abaAtiva: 'despesas' | 'entradas' = 'despesas';
  
  // Dados originais
  despesasOriginais: Despesa[] = [];
  entradasOriginais: Entrada[] = [];
  
  // Dados filtrados e ordenados
  despesas: Despesa[] = [];
  entradas: Entrada[] = [];
  
  // Estados dos formulários
  showDespesaForm = false;
  showEntradaForm = false;
  despesaEditando: Despesa | null = null;
  entradaEditando: Entrada | null = null;
  
  // Estados de carregamento
  carregandoDespesas = false;
  carregandoEntradas = false;

  // Sistema de visualização e filtros
  modoVisualizacao: 'grade' | 'lista' = 'grade';
  
  // Filtros para despesas
  filtroStatusDespesa: 'todas' | 'pagas' | 'pendentes' | 'vencidas' = 'todas';
  filtroPrioridade: 'todas' | 'alta' | 'media' | 'baixa' = 'todas';
  filtroCategoria: string = 'todas';
  
  // Filtros para entradas
  filtroFonte: string = 'todas';
  
  // Ordenação
  ordenacaoAtual: 'data' | 'valor' | 'alfabetico' = 'data';
  direcaoOrdenacao: 'asc' | 'desc' = 'desc';
  
  // Busca
  termoBusca: string = '';

  // Opções de filtro
  opcoesStatus = [
    { value: 'todas', label: '📋 Todas' },
    { value: 'pagas', label: '✅ Pagas' },
    { value: 'pendentes', label: '⏳ Pendentes' },
    { value: 'vencidas', label: '🔴 Vencidas' }
  ];

  opcoesPrioridade = [
    { value: 'todas', label: '🎯 Todas' },
    { value: 'alta', label: '🔴 Alta' },
    { value: 'media', label: '🟡 Média' },
    { value: 'baixa', label: '🟢 Baixa' }
  ];

  opcoesOrdenacao = [
    { value: 'data', label: '📅 Data' },
    { value: 'valor', label: '💰 Valor' },
    { value: 'alfabetico', label: '🔤 A-Z' }
  ];

  // Modal de confirmação
  showConfirmationModal = false;
  confirmationData = {
    title: 'Confirmação',
    message: 'Tem certeza que deseja continuar?',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    onConfirm: () => {}
  };

  constructor(
    private despesaService: DespesaService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.carregarPreferencias();
    this.carregarDados();
  }

  private carregarPreferencias(): void {
    const modoSalvo = localStorage.getItem('gestao-modo-visualizacao') as 'grade' | 'lista';
    if (modoSalvo && (modoSalvo === 'grade' || modoSalvo === 'lista')) {
      this.modoVisualizacao = modoSalvo;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarDados(): void {
    // Carregar despesas
    this.carregandoDespesas = true;
    this.despesaService.despesas$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (despesas) => {
          this.despesasOriginais = [...despesas];
          this.aplicarFiltros();
          this.carregandoDespesas = false;
        },
        error: (error) => {
          console.error('Erro ao carregar despesas:', error);
          this.carregandoDespesas = false;
        }
      });

    // Carregar entradas
    this.carregandoEntradas = true;
    this.despesaService.entradas$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (entradas) => {
          this.entradasOriginais = [...entradas];
          this.aplicarFiltrosEntradas();
          this.carregandoEntradas = false;
        },
        error: (error) => {
          console.error('Erro ao carregar entradas:', error);
          this.carregandoEntradas = false;
        }
      });
  }

  // === MÉTODOS DE NAVEGAÇÃO ===
  
  alterarAba(aba: 'despesas' | 'entradas'): void {
    this.abaAtiva = aba;
    this.fecharFormularios();
    
    // Aplicar filtros da aba ativa
    if (aba === 'despesas') {
      this.aplicarFiltros();
    } else {
      this.aplicarFiltrosEntradas();
    }
  }

  voltarDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // === MÉTODOS DE DESPESAS ===
  
  abrirFormularioDespesa(despesa?: Despesa): void {
    this.despesaEditando = despesa || null;
    this.showDespesaForm = true;
    this.showEntradaForm = false;
  }

  async salvarDespesa(despesaData: Omit<Despesa, 'id'>): Promise<void> {
    try {
      if (this.despesaEditando) {
        await this.despesaService.atualizarDespesa(this.despesaEditando.id, despesaData);
        this.toastService.success('Despesa atualizada!', `A despesa "${despesaData.descricao}" foi atualizada com sucesso.`);
      } else {
        await this.despesaService.adicionarDespesa(despesaData);
        this.toastService.success('Despesa adicionada!', `A despesa "${despesaData.descricao}" foi adicionada com sucesso.`);
      }
      this.fecharFormularioDespesa();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      this.toastService.error('Erro ao salvar despesa', 'Ocorreu um erro inesperado. Tente novamente.');
    }
  }

  fecharFormularioDespesa(): void {
    this.showDespesaForm = false;
    this.despesaEditando = null;
  }

  async excluirDespesa(despesa: Despesa): Promise<void> {
    this.showConfirmation(
      'Excluir Despesa',
      `Tem certeza que deseja excluir a despesa "${despesa.descricao}"?`,
      async () => {
        try {
          await this.despesaService.removerDespesa(despesa.id);
          this.toastService.success('Despesa excluída!', `A despesa "${despesa.descricao}" foi excluída com sucesso.`);
        } catch (error) {
          console.error('Erro ao excluir despesa:', error);
          this.toastService.error('Erro ao excluir despesa', 'Ocorreu um erro inesperado. Tente novamente.');
        }
      },
      'Excluir',
      'Cancelar'
    );
  }

  async toggleStatusDespesa(despesa: Despesa): Promise<void> {
    try {
      await this.despesaService.marcarComoPaga(despesa.id, !despesa.paga);
      const status = !despesa.paga ? 'paga' : 'pendente';
      this.toastService.success('Status atualizado!', `A despesa "${despesa.descricao}" foi marcada como ${status}.`);
    } catch (error) {
      console.error('Erro ao alterar status da despesa:', error);
      this.toastService.error('Erro ao alterar status', 'Ocorreu um erro inesperado. Tente novamente.');
    }
  }

  // === MÉTODOS DE ENTRADAS ===
  
  abrirFormularioEntrada(entrada?: Entrada): void {
    this.entradaEditando = entrada || null;
    this.showEntradaForm = true;
    this.showDespesaForm = false;
  }

  salvarEntrada(entradaData: Omit<Entrada, 'id'>): void {
    try {
      if (this.entradaEditando) {
        this.despesaService.atualizarEntrada(this.entradaEditando.id, entradaData);
        this.toastService.success('Entrada atualizada com sucesso!');
      } else {
        this.despesaService.adicionarEntrada(entradaData);
        this.toastService.success('Entrada adicionada com sucesso!');
      }
      this.fecharFormularioEntrada();
    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
      this.toastService.error('Erro ao salvar entrada. Tente novamente.');
    }
  }

  fecharFormularioEntrada(): void {
    this.showEntradaForm = false;
    this.entradaEditando = null;
  }

  excluirEntrada(entrada: Entrada): void {
    this.showConfirmation(
      'Excluir Entrada',
      `Tem certeza que deseja excluir a entrada "${entrada.descricao}"?`,
      () => {
        try {
          this.despesaService.removerEntrada(entrada.id);
          this.toastService.success('Entrada excluída com sucesso!');
        } catch (error) {
          console.error('Erro ao excluir entrada:', error);
          this.toastService.error('Erro ao excluir entrada. Tente novamente.');
        }
      },
      'Excluir',
      'Cancelar'
    );
  }

  // === MÉTODOS DE FILTROS E ORDENAÇÃO ===
  
  aplicarFiltros(): void {
    let despesasFiltradas = [...this.despesasOriginais];

    // Filtro por busca
    if (this.termoBusca.trim()) {
      const termo = this.termoBusca.toLowerCase();
      despesasFiltradas = despesasFiltradas.filter(despesa =>
        despesa.descricao.toLowerCase().includes(termo) ||
        despesa.categoria.nome.toLowerCase().includes(termo)
      );
    }

    // Filtro por status
    if (this.filtroStatusDespesa !== 'todas') {
      const hoje = new Date();
      despesasFiltradas = despesasFiltradas.filter(despesa => {
        switch (this.filtroStatusDespesa) {
          case 'pagas':
            return despesa.paga;
          case 'pendentes':
            return !despesa.paga && new Date(despesa.dataVencimento) >= hoje;
          case 'vencidas':
            return !despesa.paga && new Date(despesa.dataVencimento) < hoje;
          default:
            return true;
        }
      });
    }

    // Filtro por prioridade
    if (this.filtroPrioridade !== 'todas') {
      despesasFiltradas = despesasFiltradas.filter(despesa =>
        despesa.prioridade === this.filtroPrioridade
      );
    }

    // Filtro por categoria
    if (this.filtroCategoria !== 'todas') {
      despesasFiltradas = despesasFiltradas.filter(despesa =>
        despesa.categoria.id === this.filtroCategoria
      );
    }

    // Aplicar ordenação
    this.despesas = this.ordenarDespesas(despesasFiltradas);
  }

  aplicarFiltrosEntradas(): void {
    let entradasFiltradas = [...this.entradasOriginais];

    // Filtro por busca
    if (this.termoBusca.trim()) {
      const termo = this.termoBusca.toLowerCase();
      entradasFiltradas = entradasFiltradas.filter(entrada =>
        entrada.descricao.toLowerCase().includes(termo) ||
        entrada.fonte.toLowerCase().includes(termo)
      );
    }

    // Filtro por fonte
    if (this.filtroFonte !== 'todas') {
      entradasFiltradas = entradasFiltradas.filter(entrada =>
        entrada.fonte === this.filtroFonte
      );
    }

    // Aplicar ordenação
    this.entradas = this.ordenarEntradas(entradasFiltradas);
  }

  ordenarDespesas(despesas: Despesa[]): Despesa[] {
    return despesas.sort((a, b) => {
      let resultado = 0;

      switch (this.ordenacaoAtual) {
        case 'data':
          resultado = new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime();
          break;
        case 'valor':
          resultado = a.valor - b.valor;
          break;
        case 'alfabetico':
          resultado = a.descricao.localeCompare(b.descricao);
          break;
      }

      return this.direcaoOrdenacao === 'desc' ? -resultado : resultado;
    });
  }

  ordenarEntradas(entradas: Entrada[]): Entrada[] {
    return entradas.sort((a, b) => {
      let resultado = 0;

      switch (this.ordenacaoAtual) {
        case 'data':
          resultado = new Date(a.data).getTime() - new Date(b.data).getTime();
          break;
        case 'valor':
          resultado = a.valor - b.valor;
          break;
        case 'alfabetico':
          resultado = a.descricao.localeCompare(b.descricao);
          break;
      }

      return this.direcaoOrdenacao === 'desc' ? -resultado : resultado;
    });
  }

  // Métodos de controle de filtros
  alterarStatusFiltro(status: 'todas' | 'pagas' | 'pendentes' | 'vencidas'): void {
    this.filtroStatusDespesa = status;
    this.aplicarFiltros();
  }

  alterarPrioridadeFiltro(prioridade: 'todas' | 'alta' | 'media' | 'baixa'): void {
    this.filtroPrioridade = prioridade;
    this.aplicarFiltros();
  }

  alterarCategoriaFiltro(categoria: string): void {
    this.filtroCategoria = categoria;
    this.aplicarFiltros();
  }

  alterarFonteFiltro(fonte: string): void {
    this.filtroFonte = fonte;
    this.aplicarFiltrosEntradas();
  }

  alterarOrdenacao(ordenacao: 'data' | 'valor' | 'alfabetico'): void {
    if (this.ordenacaoAtual === ordenacao) {
      this.direcaoOrdenacao = this.direcaoOrdenacao === 'asc' ? 'desc' : 'asc';
    } else {
      this.ordenacaoAtual = ordenacao;
      this.direcaoOrdenacao = 'desc';
    }
    
    if (this.abaAtiva === 'despesas') {
      this.aplicarFiltros();
    } else {
      this.aplicarFiltrosEntradas();
    }
  }

  alterarModoVisualizacao(modo: 'grade' | 'lista'): void {
    this.modoVisualizacao = modo;
    localStorage.setItem('gestao-modo-visualizacao', modo);
  }

  buscar(): void {
    if (this.abaAtiva === 'despesas') {
      this.aplicarFiltros();
    } else {
      this.aplicarFiltrosEntradas();
    }
  }

  limparFiltros(): void {
    this.termoBusca = '';
    this.filtroStatusDespesa = 'todas';
    this.filtroPrioridade = 'todas';
    this.filtroCategoria = 'todas';
    this.filtroFonte = 'todas';
    this.ordenacaoAtual = 'data';
    this.direcaoOrdenacao = 'desc';
    
    if (this.abaAtiva === 'despesas') {
      this.aplicarFiltros();
    } else {
      this.aplicarFiltrosEntradas();
    }
  }

  get categorias(): any[] {
    const categoriasUnicas = new Set(this.despesasOriginais.map(d => d.categoria.id));
    return Array.from(categoriasUnicas).map(id => {
      const categoria = this.despesasOriginais.find(d => d.categoria.id === id)?.categoria;
      return categoria;
    }).filter(Boolean);
  }

  get fontes(): string[] {
    const fontesUnicas = new Set(this.entradasOriginais.map(e => e.fonte));
    return Array.from(fontesUnicas);
  }
  
  private fecharFormularios(): void {
    this.showDespesaForm = false;
    this.showEntradaForm = false;
    this.despesaEditando = null;
    this.entradaEditando = null;
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  formatarData(data: Date | string): string {
    const dataObj = typeof data === 'string' ? new Date(data) : data;
    return dataObj.toLocaleDateString('pt-BR');
  }

  getStatusClass(despesa: Despesa): string {
    if (despesa.paga) return 'status-pago';
    
    const hoje = new Date();
    const vencimento = new Date(despesa.dataVencimento);
    
    if (vencimento < hoje) return 'status-vencido';
    
    const diasParaVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diasParaVencimento <= 7) return 'status-proximo';
    
    return 'status-normal';
  }

  getPrioridadeClass(prioridade: string): string {
    return `prioridade-${prioridade}`;
  }

  getPrioridadeTexto(prioridade: string): string {
    const prioridades = {
      'alta': '🔴 Alta',
      'media': '🟡 Média', 
      'baixa': '🟢 Baixa'
    };
    return prioridades[prioridade as keyof typeof prioridades] || prioridade;
  }

  // === MÉTODOS DA MODAL DE CONFIRMAÇÃO ===

  showConfirmation(title: string, message: string, onConfirm: () => void, confirmText: string = 'Confirmar', cancelText: string = 'Cancelar'): void {
    this.confirmationData = {
      title,
      message,
      confirmText,
      cancelText,
      onConfirm
    };
    this.showConfirmationModal = true;
  }

  onConfirmationConfirmed(): void {
    this.confirmationData.onConfirm();
    this.hideConfirmationModal();
  }

  onConfirmationCancelled(): void {
    this.hideConfirmationModal();
  }

  hideConfirmationModal(): void {
    this.showConfirmationModal = false;
  }
}