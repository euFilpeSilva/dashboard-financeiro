export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  categoria: Categoria;
  dataVencimento: Date;
  prioridade: Prioridade;
  paga: boolean;
  dataPagamento?: Date;
  // Soft-delete support
  deleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
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
  // Soft-delete support
  deleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
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

// Novas interfaces para dados mensais
export interface DadosMensais {
  mes: number;
  ano: number;
  descricao: string;
  entradas: number;
  despesas: number;
  saldo: number;
}

export interface ComparativoMensal {
  janeiro: DadosMensais;
  outubro: DadosMensais;
  novembro: DadosMensais;
  dezembro: DadosMensais;
}

export interface DestaqueMensal {
  tipo: 'entrada' | 'despesa' | 'melhor-saldo' | 'pior-saldo';
  valor: number;
  mes: string;
  descricao: string;
  cor: string;
}

export interface VisualizacaoTipo {
  id: 'resumida' | 'detalhada';
  nome: string;
  descricao: string;
}

export interface GraficoBarra {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}