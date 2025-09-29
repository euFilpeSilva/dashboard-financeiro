import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { Despesa, Entrada, ResumoDashboard, DespesaPorCategoria, PeriodoFinanceiro, Prioridade } from '../models/despesa.model';
import { CATEGORIAS_PADRAO } from '../models/categorias.data';

@Injectable({
  providedIn: 'root'
})
export class DespesaService {
  private despesasSubject = new BehaviorSubject<Despesa[]>([]);
  private entradasSubject = new BehaviorSubject<Entrada[]>([]);
  private periodoAtualSubject = new BehaviorSubject<PeriodoFinanceiro>({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    descricao: this.formatarMesAno(new Date().getMonth() + 1, new Date().getFullYear())
  });

  public despesas$ = this.despesasSubject.asObservable();
  public entradas$ = this.entradasSubject.asObservable();
  public periodoAtual$ = this.periodoAtualSubject.asObservable();

  constructor() {
    this.carregarDadosIniciais();
  }

  private formatarMesAno(mes: number, ano: number): string {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${meses[mes - 1]}/${ano}`;
  }

  private carregarDadosIniciais(): void {
    // Dados de exemplo baseados na imagem fornecida
    const despesasIniciais: Despesa[] = [
      {
        id: '1',
        descricao: 'Parcela Moto',
        valor: 1421.74,
        categoria: CATEGORIAS_PADRAO[0],
        dataVencimento: new Date(2025, 9, 7), // 07/10
        prioridade: Prioridade.ALTA,
        paga: false
      },
      {
        id: '2',
        descricao: 'Fatura Nubank',
        valor: 1273.33,
        categoria: CATEGORIAS_PADRAO[1],
        dataVencimento: new Date(2025, 9, 11), // 11/10
        prioridade: Prioridade.ALTA,
        paga: false
      },
      {
        id: '3',
        descricao: 'Internet Fixa',
        valor: 99.90,
        categoria: CATEGORIAS_PADRAO[6],
        dataVencimento: new Date(2025, 9, 15), // 15/10
        prioridade: Prioridade.MEDIA,
        paga: false
      },
      {
        id: '4',
        descricao: 'Seguro Moto',
        valor: 237.49,
        categoria: CATEGORIAS_PADRAO[4],
        dataVencimento: new Date(2025, 9, 15), // 15/10
        prioridade: Prioridade.MEDIA,
        paga: false
      },
      {
        id: '5',
        descricao: 'Parcela Consórcio',
        valor: 907.50,
        categoria: CATEGORIAS_PADRAO[3],
        dataVencimento: new Date(2025, 9, 18), // 18/10
        prioridade: Prioridade.ALTA,
        paga: false
      },
      {
        id: '6',
        descricao: 'Repasse Thiago',
        valor: 110.00,
        categoria: CATEGORIAS_PADRAO[7],
        dataVencimento: new Date(2025, 9, 30), // início do mês
        prioridade: Prioridade.BAIXA,
        paga: false
      },
      {
        id: '7',
        descricao: 'Fatura Inter',
        valor: 1563.23,
        categoria: CATEGORIAS_PADRAO[2],
        dataVencimento: new Date(2025, 10, 20), // 20/11 (segunda metade)
        prioridade: Prioridade.ALTA,
        paga: false
      },
      {
        id: '8',
        descricao: 'Pós-graduação',
        valor: 149.02,
        categoria: CATEGORIAS_PADRAO[5],
        dataVencimento: new Date(2025, 10, 22), // 22/11
        prioridade: Prioridade.MEDIA,
        paga: false
      },
      {
        id: '9',
        descricao: 'Internet Móvel',
        valor: 20.00,
        categoria: CATEGORIAS_PADRAO[6],
        dataVencimento: new Date(2025, 10, 25), // início do mês
        prioridade: Prioridade.BAIXA,
        paga: false
      },
      {
        id: '10',
        descricao: 'Sobrancelha/Cabelo',
        valor: 60.00,
        categoria: CATEGORIAS_PADRAO[7],
        dataVencimento: new Date(2025, 10, 30), // A definir
        prioridade: Prioridade.BAIXA,
        paga: false
      }
    ];

    const entradasIniciais: Entrada[] = [
      {
        id: '1',
        descricao: 'Salário',
        valor: 4130.13,
        data: new Date(2025, 9, 5),
        fonte: 'Trabalho Principal'
      },
      {
        id: '2',
        descricao: 'Adiantamento Quinzenal',
        valor: 2364.31,
        data: new Date(2025, 9, 20),
        fonte: 'Adiantamento'
      },
      {
        id: '3',
        descricao: 'Retorno Ticket',
        valor: 489.09,
        data: new Date(2025, 9, 25),
        fonte: 'Reembolso'
      }
    ];

    this.despesasSubject.next(despesasIniciais);
    this.entradasSubject.next(entradasIniciais);
  }

  // Métodos para gerenciar despesas
  adicionarDespesa(despesa: Omit<Despesa, 'id'>): void {
    const novoId = Date.now().toString();
    const novaDespesa: Despesa = { ...despesa, id: novoId };
    const despesasAtuais = this.despesasSubject.value;
    this.despesasSubject.next([...despesasAtuais, novaDespesa]);
  }

  editarDespesa(id: string, despesaAtualizada: Partial<Despesa>): void {
    const despesas = this.despesasSubject.value.map(despesa =>
      despesa.id === id ? { ...despesa, ...despesaAtualizada } : despesa
    );
    this.despesasSubject.next(despesas);
  }

  removerDespesa(id: string): void {
    const despesas = this.despesasSubject.value.filter(despesa => despesa.id !== id);
    this.despesasSubject.next(despesas);
  }

  marcarComoPaga(id: string): void {
    this.editarDespesa(id, { paga: true, dataPagamento: new Date() });
  }

  marcarComoPendente(id: string): void {
    this.editarDespesa(id, { paga: false, dataPagamento: undefined });
  }

  // Métodos para gerenciar entradas
  adicionarEntrada(entrada: Omit<Entrada, 'id'>): void {
    const novoId = Date.now().toString();
    const novaEntrada: Entrada = { ...entrada, id: novoId };
    const entradasAtuais = this.entradasSubject.value;
    this.entradasSubject.next([...entradasAtuais, novaEntrada]);
  }

  removerEntrada(id: string): void {
    const entradas = this.entradasSubject.value.filter(entrada => entrada.id !== id);
    this.entradasSubject.next(entradas);
  }

  // Observables calculados
  getResumoDashboard(): Observable<ResumoDashboard> {
    return combineLatest([this.despesas$, this.entradas$]).pipe(
      map(([despesas, entradas]) => {
        const hoje = new Date();
        const proximoVencimento = new Date();
        proximoVencimento.setDate(hoje.getDate() + 7); // Próximos 7 dias

        const totalEntradas = entradas.reduce((sum, entrada) => sum + entrada.valor, 0);
        const totalDespesas = despesas.reduce((sum, despesa) => sum + despesa.valor, 0);
        const despesasPagas = despesas.filter(d => d.paga).length;
        const despesasPendentes = despesas.filter(d => !d.paga).length;
        const despesasVencidas = despesas.filter(d => !d.paga && d.dataVencimento < hoje).length;
        const despesasProximasVencimento = despesas.filter(d => 
          !d.paga && d.dataVencimento >= hoje && d.dataVencimento <= proximoVencimento
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
        const categoriaMap = new Map<string, DespesaPorCategoria>();
        let totalGeral = 0;

        despesas.forEach(despesa => {
          const categoriaId = despesa.categoria.id;
          totalGeral += despesa.valor;

          if (categoriaMap.has(categoriaId)) {
            const item = categoriaMap.get(categoriaId)!;
            item.valor += despesa.valor;
            item.quantidade += 1;
          } else {
            categoriaMap.set(categoriaId, {
              categoria: despesa.categoria,
              valor: despesa.valor,
              percentual: 0,
              quantidade: 1
            });
          }
        });

        // Calcular percentuais
        const resultado = Array.from(categoriaMap.values()).map(item => ({
          ...item,
          percentual: totalGeral > 0 ? (item.valor / totalGeral) * 100 : 0
        }));

        return resultado.sort((a, b) => b.valor - a.valor);
      })
    );
  }

  getDespesasVencidas(): Observable<Despesa[]> {
    return this.despesas$.pipe(
      map(despesas => {
        const hoje = new Date();
        return despesas.filter(despesa => !despesa.paga && despesa.dataVencimento < hoje);
      })
    );
  }

  getDespesasProximasVencimento(): Observable<Despesa[]> {
    return this.despesas$.pipe(
      map(despesas => {
        const hoje = new Date();
        const proximoVencimento = new Date();
        proximoVencimento.setDate(hoje.getDate() + 7);
        
        return despesas.filter(despesa => 
          !despesa.paga && 
          despesa.dataVencimento >= hoje && 
          despesa.dataVencimento <= proximoVencimento
        );
      })
    );
  }

  // Métodos para período
  setPeriodo(mes: number, ano: number): void {
    this.periodoAtualSubject.next({
      mes,
      ano,
      descricao: this.formatarMesAno(mes, ano)
    });
  }
}