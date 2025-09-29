// Interfaces para o sistema de temas customizáveis
export interface DashboardCard {
  id: string;
  component: string;
  titulo: string;
  tipo: 'resumo' | 'grafico' | 'lista' | 'alertas' | 'personalizado';
  posicao: {
    x: number;
    y: number;
    largura: number;
    altura: number;
  };
  visivel: boolean;
  configuracoes?: {
    [key: string]: any;
  };
}

export interface DashboardTheme {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'compacto' | 'classico' | 'customizavel';
  estilos: {
    corPrimaria: string;
    corSecundaria: string;
    corFundo: string;
    corTexto: string;
    corBorda: string;
    bordaRadius: string;
    espacamento: 'pequeno' | 'medio' | 'grande';
    fonte: {
      familia: string;
      tamanho: 'pequeno' | 'medio' | 'grande';
    };
  };
  layout: {
    colunas: number;
    espacamentoCards: number;
    alturaHeader: number;
    layoutType: 'grid' | 'flex' | 'masonry';
  };
  cards: DashboardCard[];
}

export interface LayoutPersonalizacao {
  id: string;
  nome: string;
  usuarioId?: string;
  temaBase: string;
  cards: DashboardCard[];
  configuracoes: {
    dragAndDrop: boolean;
    redimensionavel: boolean;
    cardsFixos: string[];
  };
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface VisualizacaoConfig {
  tema: DashboardTheme;
  personalizacao?: LayoutPersonalizacao;
  modoEdicao: boolean;
}