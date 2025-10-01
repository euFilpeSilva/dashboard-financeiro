import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DespesaService } from '../../services/despesa.service';
import { Despesa, Entrada } from '../../models/despesa.model';
import { DespesaFormComponent } from '../despesa-form/despesa-form.component';
import { EntradaFormComponent } from '../entrada-form/entrada-form.component';

@Component({
  selector: 'app-gestao',
  standalone: true,
  imports: [CommonModule, DespesaFormComponent, EntradaFormComponent],
  templateUrl: './gestao.component.html',
  styleUrl: './gestao.component.scss'
})
export class GestaoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Estados das abas
  abaAtiva: 'despesas' | 'entradas' = 'despesas';
  
  // Dados
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

  constructor(
    private despesaService: DespesaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarDados();
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
          this.despesas = despesas.sort((a, b) => 
            new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime()
          );
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
          this.entradas = entradas.sort((a, b) => 
            new Date(b.data).getTime() - new Date(a.data).getTime()
          );
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
      } else {
        await this.despesaService.adicionarDespesa(despesaData);
      }
      this.fecharFormularioDespesa();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      alert('Erro ao salvar despesa. Tente novamente.');
    }
  }

  fecharFormularioDespesa(): void {
    this.showDespesaForm = false;
    this.despesaEditando = null;
  }

  async excluirDespesa(despesa: Despesa): Promise<void> {
    if (confirm(`Tem certeza que deseja excluir a despesa "${despesa.descricao}"?`)) {
      try {
        await this.despesaService.removerDespesa(despesa.id);
      } catch (error) {
        console.error('Erro ao excluir despesa:', error);
        alert('Erro ao excluir despesa. Tente novamente.');
      }
    }
  }

  async toggleStatusDespesa(despesa: Despesa): Promise<void> {
    try {
      await this.despesaService.marcarComoPaga(despesa.id, !despesa.paga);
    } catch (error) {
      console.error('Erro ao alterar status da despesa:', error);
      alert('Erro ao alterar status. Tente novamente.');
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
      } else {
        this.despesaService.adicionarEntrada(entradaData);
      }
      this.fecharFormularioEntrada();
    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
      alert('Erro ao salvar entrada. Tente novamente.');
    }
  }

  fecharFormularioEntrada(): void {
    this.showEntradaForm = false;
    this.entradaEditando = null;
  }

  excluirEntrada(entrada: Entrada): void {
    if (confirm(`Tem certeza que deseja excluir a entrada "${entrada.descricao}"?`)) {
      try {
        this.despesaService.removerEntrada(entrada.id);
      } catch (error) {
        console.error('Erro ao excluir entrada:', error);
        alert('Erro ao excluir entrada. Tente novamente.');
      }
    }
  }

  // === MÉTODOS AUXILIARES ===
  
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
}