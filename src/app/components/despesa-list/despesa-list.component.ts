import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DespesaService } from '../../services/despesa.service';
import { Despesa } from '../../models/despesa.model';
import { DespesaFormComponent } from '../despesa-form/despesa-form.component';

@Component({
  selector: 'app-despesa-list',
  standalone: true,
  imports: [CommonModule, DespesaFormComponent],
  templateUrl: './despesa-list.component.html',
  styleUrl: './despesa-list.component.scss'
})
export class DespesaListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  despesas: Despesa[] = [];
  despesaEditando: Despesa | null = null;
  showForm = false;

  constructor(private despesaService: DespesaService) {}

  ngOnInit(): void {
    this.carregarDespesas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarDespesas(): void {
    this.despesaService.despesas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(despesas => {
        this.despesas = despesas.sort((a, b) => 
          new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()
        );
      });
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
    return this.despesas.reduce((total, despesa) => total + despesa.valor, 0);
  }

  getDespesasPagas(): number {
    return this.despesas.filter(despesa => despesa.paga).length;
  }

  getDespesasPendentes(): number {
    return this.despesas.filter(despesa => !despesa.paga).length;
  }
}
