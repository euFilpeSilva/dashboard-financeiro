import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Tema {
  id: string;
  nome: string;
  descricao: string;
  layout: LayoutConfig;
}

export interface LayoutConfig {
  tipo: 'compacto' | 'classico' | 'customizavel';
  gridColumns: number;
  cardSpacing: string;
  cardSize: 'small' | 'medium' | 'large';
  showSidebar: boolean;
  sidebarPosition: 'left' | 'right';
  enableDragDrop: boolean;
  customizable: boolean;
}

export interface CardPosition {
  id: string;
  order: number;
  visible: boolean;
  size: 'small' | 'medium' | 'large';
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private temaAtualSubject = new BehaviorSubject<string>('compacto');
  private cardPositionsSubject = new BehaviorSubject<CardPosition[]>([]);
  
  public temaAtual$ = this.temaAtualSubject.asObservable();
  public cardPositions$ = this.cardPositionsSubject.asObservable();

  temasDisponiveis: Tema[] = [
    { 
      id: 'compacto', 
      nome: '📱 Compacto', 
      descricao: 'Layout otimizado e denso',
      layout: {
        tipo: 'compacto',
        gridColumns: 4,
        cardSpacing: '8px',
        cardSize: 'small',
        showSidebar: false,
        sidebarPosition: 'left',
        enableDragDrop: false,
        customizable: false
      }
    },
    { 
      id: 'classico', 
      nome: '🎨 Clássico', 
      descricao: 'Layout tradicional com sidebar',
      layout: {
        tipo: 'classico',
        gridColumns: 3,
        cardSpacing: '16px',
        cardSize: 'medium',
        showSidebar: true,
        sidebarPosition: 'left',
        enableDragDrop: false,
        customizable: false
      }
    },
    { 
      id: 'customizavel', 
      nome: '⚙️ Customizável', 
      descricao: 'Layout flexível com drag & drop',
      layout: {
        tipo: 'customizavel',
        gridColumns: 3,
        cardSpacing: '12px',
        cardSize: 'medium',
        showSidebar: true,
        sidebarPosition: 'right',
        enableDragDrop: true,
        customizable: true
      }
    }
  ];

  constructor() {
    this.carregarTema();
    this.carregarCardPositions();
  }

  get temaAtual(): string {
    return this.temaAtualSubject.value;
  }

  get layoutAtual(): LayoutConfig {
    const tema = this.temasDisponiveis.find(t => t.id === this.temaAtual);
    return tema?.layout || this.temasDisponiveis[0].layout;
  }

  alterarTema(temaId: string): void {
    if (this.temasDisponiveis.some(t => t.id === temaId)) {
      this.temaAtualSubject.next(temaId);
      this.aplicarTema(temaId);
      this.salvarTema(temaId);
    }
  }

  // Métodos para gerenciamento de posições de cards (customizável)
  updateCardPositions(positions: CardPosition[]): void {
    this.cardPositionsSubject.next(positions);
    this.salvarCardPositions(positions);
  }

  private carregarCardPositions(): void {
    const positionsSalvas = localStorage.getItem('dashboard-card-positions');
    if (positionsSalvas) {
      try {
        const positions = JSON.parse(positionsSalvas);
        this.cardPositionsSubject.next(positions);
      } catch (error) {
        console.warn('Erro ao carregar posições dos cards:', error);
        this.initializeDefaultCardPositions();
      }
    } else {
      this.initializeDefaultCardPositions();
    }
  }

  private initializeDefaultCardPositions(): void {
    const defaultPositions: CardPosition[] = [
      { id: 'resumo-financeiro', order: 1, visible: true, size: 'large' },
      { id: 'despesas-recentes', order: 2, visible: true, size: 'medium' },
      { id: 'entradas-recentes', order: 3, visible: true, size: 'medium' },
      { id: 'categorias-gastos', order: 4, visible: true, size: 'medium' },
      { id: 'graficos-mensais', order: 5, visible: true, size: 'large' },
      { id: 'alertas', order: 6, visible: true, size: 'small' }
    ];
    this.cardPositionsSubject.next(defaultPositions);
  }

  private salvarCardPositions(positions: CardPosition[]): void {
    localStorage.setItem('dashboard-card-positions', JSON.stringify(positions));
  }

  private aplicarTema(temaId: string): void {
    // Remove classes de tema anteriores
    document.body.className = document.body.className.replace(/tema-\w+/g, '');
    document.body.classList.add(`tema-${temaId}`);

    const layout = this.layoutAtual;
    const root = document.documentElement;
    
    // Aplicar variáveis CSS baseadas no tema
    switch (temaId) {
      case 'compacto':
        root.style.setProperty('--tema-cor-primaria', '#2563eb');
        root.style.setProperty('--tema-cor-secundaria', '#64748b');
        root.style.setProperty('--tema-espacamento', '8px');
        root.style.setProperty('--tema-borda-radius', '4px');
        root.style.setProperty('--tema-fonte-tamanho', '0.875rem');
        root.style.setProperty('--grid-columns', layout.gridColumns.toString());
        root.style.setProperty('--card-spacing', layout.cardSpacing);
        break;
      case 'classico':
        root.style.setProperty('--tema-cor-primaria', '#059669');
        root.style.setProperty('--tema-cor-secundaria', '#6b7280');
        root.style.setProperty('--tema-espacamento', '16px');
        root.style.setProperty('--tema-borda-radius', '8px');
        root.style.setProperty('--tema-fonte-tamanho', '1rem');
        root.style.setProperty('--grid-columns', layout.gridColumns.toString());
        root.style.setProperty('--card-spacing', layout.cardSpacing);
        break;
      case 'customizavel':
        root.style.setProperty('--tema-cor-primaria', '#7c3aed');
        root.style.setProperty('--tema-cor-secundaria', '#9ca3af');
        root.style.setProperty('--tema-espacamento', '12px');
        root.style.setProperty('--tema-borda-radius', '6px');
        root.style.setProperty('--tema-fonte-tamanho', '1rem');
        root.style.setProperty('--grid-columns', layout.gridColumns.toString());
        root.style.setProperty('--card-spacing', layout.cardSpacing);
        break;
    }
  }

  private carregarTema(): void {
    const temaSalvo = localStorage.getItem('dashboard-tema');
    if (temaSalvo && this.temasDisponiveis.some(t => t.id === temaSalvo)) {
      this.temaAtualSubject.next(temaSalvo);
      this.aplicarTema(temaSalvo);
    } else {
      this.aplicarTema(this.temaAtual);
    }
  }

  private salvarTema(temaId: string): void {
    localStorage.setItem('dashboard-tema', temaId);
  }
}