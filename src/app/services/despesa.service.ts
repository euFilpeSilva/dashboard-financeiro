import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { 
  Despesa, 
  Entrada, 
  ResumoDashboard, 
  DespesaPorCategoria, 
  PeriodoFinanceiro, 
  Prioridade,
  DadosMensais,
  ComparativoMensal,
  DestaqueMensal,
  GraficoBarra
} from '../models/despesa.model';
import { CATEGORIAS_PADRAO } from '../models/categorias.data';
import { FirestoreService } from './firestore.service';
import { AuthService } from './auth.service';
import { UserPreferencesService } from './user-preferences.service';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class DespesaService {
  private periodoAtualSubject = new BehaviorSubject<PeriodoFinanceiro>({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    descricao: this.formatarMesAno(new Date().getMonth() + 1, new Date().getFullYear())
  });

  public despesas$ = this.firestoreService.despesas$;
  public entradas$ = this.firestoreService.entradas$;
  public periodoAtual$ = this.periodoAtualSubject.asObservable();
  public auditLogs$ = this.firestoreService.auditLogs$;

  private migracaoRealizada = false;

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService,
    private userPreferencesService: UserPreferencesService,
    private logger: LoggerService
  ) {
    this.inicializarDados();
  }

  private async inicializarDados(): Promise<void> {
    this.authService.currentUser$.subscribe(async (user) => {
      if (user && !this.migracaoRealizada) {
        await this.verificarMigracao();
        this.migracaoRealizada = true;
      }
    });
  }

  private async verificarMigracao(): Promise<void> {
    try {
      const despesasLocal = localStorage.getItem('despesas');
      const anotacoesLocal = localStorage.getItem('dashboard-anotacoes');
      
      if (despesasLocal || anotacoesLocal) {
        this.logger.info('📦 Iniciando migração de dados do localStorage...');
        await this.firestoreService.migrarDadosLocalStorage();
        this.logger.info('✅ Migração concluída com sucesso!');
      }

      // Migrar preferências do usuário
      this.logger.info('🔧 Verificando migração de preferências...');
      await this.userPreferencesService.migrarPreferenciasLocalStorage();
      this.logger.info('✅ Verificação de preferências concluída!');
    } catch (error) {
      this.logger.error('❌ Erro na migração:', error);
    }
  }

  private formatarMesAno(mes: number, ano: number): string {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${meses[mes - 1]}/${ano}`;
  }

  async adicionarDespesa(despesa: Omit<Despesa, 'id'>): Promise<void> {
    try {
      await this.firestoreService.adicionarDespesa(despesa);
    } catch (error) {
      this.logger.error('Erro ao adicionar despesa:', error);
      throw error;
    }
  }

  async atualizarDespesa(id: string, updates: Partial<Despesa>): Promise<void> {
    try {
      await this.firestoreService.atualizarDespesa(id, updates);
    } catch (error) {
      this.logger.error('Erro ao atualizar despesa:', error);
      throw error;
    }
  }

  async removerDespesa(id: string): Promise<void> {
    try {
      await this.firestoreService.removerDespesa(id);
    } catch (error) {
      this.logger.error('Erro ao remover despesa:', error);
      throw error;
    }
  }

  async restaurarDespesa(id: string): Promise<void> {
    try {
      await this.firestoreService.restoreDespesa(id);
    } catch (error) {
      this.logger.error('Erro ao restaurar despesa:', error);
      throw error;
    }
  }

  async excluirDespesaPermanentemente(id: string): Promise<void> {
    try {
      await this.firestoreService.permanentlyDeleteDespesa(id);
    } catch (error) {
      this.logger.error('Erro ao excluir despesa permanentemente:', error);
      throw error;
    }
  }

  async marcarComoPaga(id: string, paga: boolean = true): Promise<void> {
    try {
      await this.firestoreService.marcarComoPaga(id, paga);
    } catch (error) {
      this.logger.error('Erro ao marcar como paga:', error);
      throw error;
    }
  }

  async marcarComoPendente(id: string): Promise<void> {
    try {
      await this.firestoreService.marcarComoPaga(id, false);
    } catch (error) {
      this.logger.error('Erro ao marcar como pendente:', error);
      throw error;
    }
  }

  async editarDespesa(id: string, updates: Partial<Despesa>): Promise<void> {
    try {
      await this.firestoreService.atualizarDespesa(id, updates);
    } catch (error) {
      this.logger.error('Erro ao editar despesa:', error);
      throw error;
    }
  }

  async adicionarEntrada(entrada: Omit<Entrada, 'id'>): Promise<void> {
    try {
      await this.firestoreService.adicionarEntrada(entrada);
    } catch (error) {
      this.logger.error('Erro ao adicionar entrada:', error);
      throw error;
    }
  }

  async atualizarEntrada(id: string, updates: Partial<Entrada>): Promise<void> {
    try {
      await this.firestoreService.atualizarEntrada(id, updates);
    } catch (error) {
      this.logger.error('Erro ao atualizar entrada:', error);
      throw error;
    }
  }

  async removerEntrada(id: string): Promise<void> {
    try {
      await this.firestoreService.removerEntrada(id);
    } catch (error) {
      this.logger.error('Erro ao remover entrada:', error);
      throw error;
    }
  }

  async restaurarEntrada(id: string): Promise<void> {
    try {
      await this.firestoreService.restoreEntrada(id);
    } catch (error) {
      this.logger.error('Erro ao restaurar entrada:', error);
      throw error;
    }
  }

  async excluirEntradaPermanentemente(id: string): Promise<void> {
    try {
      await this.firestoreService.permanentlyDeleteEntrada(id);
    } catch (error) {
      this.logger.error('Erro ao excluir entrada permanentemente:', error);
      throw error;
    }
  }

  getResumoDashboard(): Observable<ResumoDashboard> {
    return combineLatest([this.despesas$, this.entradas$]).pipe(
      map(([despesas, entradas]) => {
        const totalDespesas = despesas.reduce((total, despesa) => total + despesa.valor, 0);
        const totalEntradas = entradas.reduce((total, entrada) => total + entrada.valor, 0);
        const despesasPagas = despesas.filter(d => d.paga).length;
        const despesasPendentes = despesas.filter(d => !d.paga).length;
        
        const hoje = new Date();
        const despesasVencidas = despesas.filter(d => 
          !d.paga && new Date(d.dataVencimento) < hoje
        ).length;
        
        const proximaSemana = new Date();
        proximaSemana.setDate(hoje.getDate() + 7);
        const despesasProximasVencimento = despesas.filter(d => 
          !d.paga && 
          new Date(d.dataVencimento) >= hoje && 
          new Date(d.dataVencimento) <= proximaSemana
        ).length;

        return {
          totalEntradas,
          totalDespesas,
          saldoPrevisto: totalEntradas - totalDespesas,
          despesasPagas,
          despesasPendentes,
          despesasVencidas,
          despesasProximasVencimento
        };
      })
    );
  }

  getDespesasPorCategoria(): Observable<DespesaPorCategoria[]> {
    return this.despesas$.pipe(
      map(despesas => {
        const despesasPorCategoria = new Map<string, { valor: number; quantidade: number; categoria: any }>();
        let totalGeral = 0;
        
        despesas.forEach(despesa => {
          const nomeCategoria = despesa.categoria.nome;
          const atual = despesasPorCategoria.get(nomeCategoria) || { valor: 0, quantidade: 0, categoria: despesa.categoria };
          atual.valor += despesa.valor;
          atual.quantidade++;
          totalGeral += despesa.valor;
          despesasPorCategoria.set(nomeCategoria, atual);
        });

        return Array.from(despesasPorCategoria.entries()).map(([nome, dados]) => ({
          categoria: dados.categoria,
          valor: dados.valor,
          quantidade: dados.quantidade,
          percentual: totalGeral > 0 ? (dados.valor / totalGeral) * 100 : 0
        })).sort((a, b) => b.valor - a.valor); // Ordenar por valor decrescente
      })
    );
  }

  getDespesasVencidas(): Observable<Despesa[]> {
    return this.despesas$.pipe(
      map(despesas => {
        const hoje = new Date();
        return despesas.filter(despesa => 
          !despesa.paga && new Date(despesa.dataVencimento) < hoje
        );
      })
    );
  }

  getDespesasProximasVencimento(): Observable<Despesa[]> {
    return this.despesas$.pipe(
      map(despesas => {
        const hoje = new Date();
        const proximaSemana = new Date();
        proximaSemana.setDate(hoje.getDate() + 7);
        
        return despesas.filter(despesa => 
          !despesa.paga && 
          new Date(despesa.dataVencimento) >= hoje && 
          new Date(despesa.dataVencimento) <= proximaSemana
        );
      })
    );
  }

  getDespesasDoMes(): Observable<Despesa[]> {
    return this.despesas$.pipe(
      map(despesas => {
        const agora = new Date();
        const mesAtual = agora.getMonth();
        const anoAtual = agora.getFullYear();
        
        return despesas.filter(despesa => {
          const dataVencimento = new Date(despesa.dataVencimento);
          return dataVencimento.getMonth() === mesAtual && 
                 dataVencimento.getFullYear() === anoAtual;
        });
      })
    );
  }

  getDadosMensais(): Observable<DadosMensais[]> {
    return combineLatest([this.despesas$, this.entradas$]).pipe(
      map(([despesas, entradas]) => {
        const meses = new Map<string, DadosMensais>();
        
        despesas.forEach(despesa => {
          const data = new Date(despesa.dataVencimento);
          const chave = `${data.getFullYear()}-${data.getMonth()}`;
          const mesAno = this.formatarMesAno(data.getMonth() + 1, data.getFullYear());
          
          if (!meses.has(chave)) {
            meses.set(chave, {
              mes: data.getMonth() + 1,
              ano: data.getFullYear(),
              descricao: mesAno,
              entradas: 0,
              despesas: 0,
              saldo: 0
            });
          }
          
          const dados = meses.get(chave)!;
          dados.despesas += despesa.valor;
        });

        entradas.forEach(entrada => {
          const data = new Date(entrada.data);
          const chave = `${data.getFullYear()}-${data.getMonth()}`;
          const mesAno = this.formatarMesAno(data.getMonth() + 1, data.getFullYear());
          
          if (!meses.has(chave)) {
            meses.set(chave, {
              mes: data.getMonth() + 1,
              ano: data.getFullYear(),
              descricao: mesAno,
              entradas: 0,
              despesas: 0,
              saldo: 0
            });
          }
          
          const dados = meses.get(chave)!;
          dados.entradas += entrada.valor;
        });

        const resultado = Array.from(meses.values());
        resultado.forEach(dados => {
          dados.saldo = dados.entradas - dados.despesas;
        });

        return resultado.sort((a, b) => b.ano - a.ano || b.mes - a.mes);
      })
    );
  }

  getComparativoMensal(): Observable<DadosMensais[]> {
    return this.getDadosMensais();
  }

  getDestaquesMensais(): Observable<DestaqueMensal[]> {
    return this.getDadosMensais().pipe(
      map(dados => {
        if (dados.length === 0) return [];
        
        const maiorEntrada = dados.reduce((max, item) => 
          item.entradas > max.entradas ? item : max
        );
        
        const maiorDespesa = dados.reduce((max, item) => 
          item.despesas > max.despesas ? item : max
        );
        
        const melhorSaldo = dados.reduce((max, item) => 
          item.saldo > max.saldo ? item : max
        );

        return [
          {
            tipo: 'entrada' as const,
            descricao: 'Maior Entrada',
            valor: maiorEntrada.entradas,
            mes: maiorEntrada.descricao,
            cor: '#4fc3f7'
          },
          {
            tipo: 'despesa' as const,
            descricao: 'Maior Despesa',
            valor: maiorDespesa.despesas,
            mes: maiorDespesa.descricao,
            cor: '#ff6b6b'
          },
          {
            tipo: 'melhor-saldo' as const,
            descricao: 'Melhor Saldo',
            valor: melhorSaldo.saldo,
            mes: melhorSaldo.descricao,
            cor: '#4caf50'
          }
        ];
      })
    );
  }

  getGraficoBarras(): Observable<GraficoBarra> {
    return this.getDadosMensais().pipe(
      map(dados => ({
        labels: dados.map(item => item.descricao),
        datasets: [
          {
            label: 'Entradas',
            data: dados.map(item => item.entradas),
            backgroundColor: '#4fc3f7',
            borderColor: '#29b6f6',
            borderWidth: 1
          },
          {
            label: 'Despesas',
            data: dados.map(item => item.despesas),
            backgroundColor: '#ff6b6b',
            borderColor: '#ff5252',
            borderWidth: 1
          }
        ]
      }))
    );
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
}