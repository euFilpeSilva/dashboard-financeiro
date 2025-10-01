import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DespesaService } from '../../services/despesa.service';
import { Despesa } from '../../models/despesa.model';
import { DespesaFormComponent } from '../despesa-form/despesa-form.component';

@Component({
  selector: 'app-despesa-list',
  standalone: true,
  imports: [CommonModule, DespesaFormComponent, FormsModule],
  templateUrl: './despesa-list.component.html',
  styleUrl: './despesa-list.component.scss'
})
export class DespesaListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  despesas: Despesa[] = [];
  despesasFiltradas: Despesa[] = [];
  despesaEditando: Despesa | null = null;
  showForm = false;

  // Filtros e ordenação
  filtroMes: string = '';
  filtroAno: string = '';
  filtroStatus: 'todos' | 'pagas' | 'pendentes' | 'vencidas' = 'todos';
  ordenacao: 'vencimento' | 'valor' | 'descricao' | 'categoria' = 'vencimento';
  direcaoOrdenacao: 'asc' | 'desc' = 'asc';
  
  // Modo de visualização
  modoVisualizacao: 'grade' | 'lista' = 'grade';

  // Opções para selects
  mesesDisponiveis: { valor: string, nome: string }[] = [];
  anosDisponiveis: string[] = [];

  constructor(private despesaService: DespesaService) {
    this.inicializarFiltros();
  }

  ngOnInit(): void {
    this.carregarPreferenciaVisualizacao();
    this.carregarDespesas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private inicializarFiltros(): void {
    // Meses do ano
    this.mesesDisponiveis = [
      { valor: '', nome: 'Todos os meses' },
      { valor: '01', nome: 'Janeiro' },
      { valor: '02', nome: 'Fevereiro' },
      { valor: '03', nome: 'Março' },
      { valor: '04', nome: 'Abril' },
      { valor: '05', nome: 'Maio' },
      { valor: '06', nome: 'Junho' },
      { valor: '07', nome: 'Julho' },
      { valor: '08', nome: 'Agosto' },
      { valor: '09', nome: 'Setembro' },
      { valor: '10', nome: 'Outubro' },
      { valor: '11', nome: 'Novembro' },
      { valor: '12', nome: 'Dezembro' }
    ];

    // Anos disponíveis (ano atual e próximos/anteriores)
    const anoAtual = new Date().getFullYear();
    this.anosDisponiveis = [
      '',
      (anoAtual - 1).toString(),
      anoAtual.toString(),
      (anoAtual + 1).toString()
    ];
  }

  private carregarDespesas(): void {
    this.despesaService.despesas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(despesas => {
        this.despesas = despesas;
        this.aplicarFiltrosEOrdenacao();
      });
  }

  aplicarFiltrosEOrdenacao(): void {
    let despesasFiltradas = [...this.despesas];

    // Filtro por mês
    if (this.filtroMes) {
      despesasFiltradas = despesasFiltradas.filter(despesa => {
        const dataVencimento = new Date(despesa.dataVencimento);
        const mes = (dataVencimento.getMonth() + 1).toString().padStart(2, '0');
        return mes === this.filtroMes;
      });
    }

    // Filtro por ano
    if (this.filtroAno) {
      despesasFiltradas = despesasFiltradas.filter(despesa => {
        const dataVencimento = new Date(despesa.dataVencimento);
        return dataVencimento.getFullYear().toString() === this.filtroAno;
      });
    }

    // Filtro por status
    if (this.filtroStatus !== 'todos') {
      despesasFiltradas = despesasFiltradas.filter(despesa => {
        switch (this.filtroStatus) {
          case 'pagas':
            return despesa.paga;
          case 'pendentes':
            return !despesa.paga && !this.isVencida(despesa);
          case 'vencidas':
            return !despesa.paga && this.isVencida(despesa);
          default:
            return true;
        }
      });
    }

    // Ordenação
    despesasFiltradas.sort((a, b) => {
      let resultado = 0;

      switch (this.ordenacao) {
        case 'vencimento':
          resultado = new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime();
          break;
        case 'valor':
          resultado = a.valor - b.valor;
          break;
        case 'descricao':
          resultado = a.descricao.localeCompare(b.descricao);
          break;
        case 'categoria':
          resultado = a.categoria.nome.localeCompare(b.categoria.nome);
          break;
      }

      return this.direcaoOrdenacao === 'desc' ? -resultado : resultado;
    });

    this.despesasFiltradas = despesasFiltradas;
  }

  // Métodos para alterar filtros
  onFiltroMesChange(): void {
    this.aplicarFiltrosEOrdenacao();
  }

  onFiltroAnoChange(): void {
    this.aplicarFiltrosEOrdenacao();
  }

  onFiltroStatusChange(): void {
    this.aplicarFiltrosEOrdenacao();
  }

  onOrdenacaoChange(): void {
    this.aplicarFiltrosEOrdenacao();
  }

  toggleDirecaoOrdenacao(): void {
    this.direcaoOrdenacao = this.direcaoOrdenacao === 'asc' ? 'desc' : 'asc';
    this.aplicarFiltrosEOrdenacao();
  }

  limparFiltros(): void {
    this.filtroMes = '';
    this.filtroAno = '';
    this.filtroStatus = 'todos';
    this.ordenacao = 'vencimento';
    this.direcaoOrdenacao = 'asc';
    this.aplicarFiltrosEOrdenacao();
  }

  // Método para alternar modo de visualização
  alterarModoVisualizacao(modo: 'grade' | 'lista'): void {
    this.modoVisualizacao = modo;
    // Salvar preferência no localStorage
    localStorage.setItem('despesas-modo-visualizacao', modo);
  }

  // Carregar preferência de visualização
  private carregarPreferenciaVisualizacao(): void {
    const modoSalvo = localStorage.getItem('despesas-modo-visualizacao') as 'grade' | 'lista';
    if (modoSalvo && (modoSalvo === 'grade' || modoSalvo === 'lista')) {
      this.modoVisualizacao = modoSalvo;
    }
  }

  onNovaDespesa(): void {
    this.despesaEditando = null;
    this.showForm = true;
  }

  onEditarDespesa(despesa: Despesa): void {
    this.despesaEditando = despesa;
    this.showForm = true;
  }

  onRemoverDespesa(id: string): void {
    if (confirm('Tem certeza que deseja remover esta despesa?')) {
      this.despesaService.removerDespesa(id);
    }
  }

  onTogglePaga(despesa: Despesa): void {
    if (despesa.paga) {
      this.despesaService.marcarComoPendente(despesa.id);
    } else {
      this.despesaService.marcarComoPaga(despesa.id);
    }
  }

  onSalvarDespesa(despesaData: Omit<Despesa, 'id'>): void {
    if (this.despesaEditando) {
      this.despesaService.editarDespesa(this.despesaEditando.id, despesaData);
    } else {
      this.despesaService.adicionarDespesa(despesaData);
    }
    this.fecharForm();
  }

  onCancelarForm(): void {
    this.fecharForm();
  }

  private fecharForm(): void {
    this.showForm = false;
    this.despesaEditando = null;
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
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(data));
  }

  getPrioridadeClass(prioridade: string): string {
    return `prioridade-${prioridade}`;
  }

  isVencida(despesa: Despesa): boolean {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(despesa.dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    return !despesa.paga && vencimento < hoje;
  }

  isProximaVencimento(despesa: Despesa): boolean {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(despesa.dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    const proximos7Dias = new Date();
    proximos7Dias.setDate(hoje.getDate() + 7);
    proximos7Dias.setHours(0, 0, 0, 0);
    
    return !despesa.paga && vencimento >= hoje && vencimento <= proximos7Dias;
  }

  trackByDespesa(index: number, despesa: Despesa): string {
    return despesa.id;
  }

  getTotalDespesas(): number {
    return this.despesasFiltradas.reduce((total, despesa) => total + despesa.valor, 0);
  }

  getDespesasPagas(): number {
    return this.despesasFiltradas.filter(despesa => despesa.paga).length;
  }

  getDespesasPendentes(): number {
    return this.despesasFiltradas.filter(despesa => !despesa.paga).length;
  }

  // Getter para total de despesas filtradas
  getTotalDespesasFiltradas(): number {
    return this.despesasFiltradas.length;
  }
}
