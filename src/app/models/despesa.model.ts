export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  categoria: Categoria;
  dataVencimento: Date;
  prioridade: Prioridade;
  paga: boolean;
  dataPagamento?: Date;
}

export interface Categoria {
  id: string;
  nome: string;
  cor: string;
  icon?: string;
}

export interface Entrada {
  id: string;
  descricao: string;
  valor: number;
  data: Date;
  fonte: string;
}

export enum Prioridade {
  ALTA = 'alta',
  MEDIA = 'media',
  BAIXA = 'baixa'
}

export interface ResumoDashboard {
  totalEntradas: number;
  totalDespesas: number;
  saldoPrevisto: number;
  despesasPagas: number;
  despesasPendentes: number;
  despesasVencidas: number;
  despesasProximasVencimento: number;
}

export interface DespesaPorCategoria {
  categoria: Categoria;
  valor: number;
  percentual: number;
  quantidade: number;
}

export interface PeriodoFinanceiro {
  mes: number;
  ano: number;
  descricao: string;
}