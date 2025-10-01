import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { ThemeService, CardPosition } from '../../services/theme.service';

@Component({
  selector: 'app-customizable-layout',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  template: `
    <div class="customizable-layout" [class]="'tema-' + currentTheme">
      
      <!-- Header de customização -->
      <div class="customization-header">
        <div class="header-content">
          <h1>⚙️ Layout Customizável</h1>
          <p class="subtitle">Organize sua dashboard exatamente como você quer</p>
        </div>
        <div class="layout-actions">
          <button class="action-btn" (click)="toggleEditMode()" [class.active]="editMode">
            <span class="icon">{{ editMode ? '💾' : '✏️' }}</span>
            <span>{{ editMode ? 'Salvar' : 'Editar' }}</span>
          </button>
          <button class="action-btn secondary" (click)="resetLayout()">
            <span class="icon">🔄</span>
            <span>Reset</span>
          </button>
          <button class="action-btn tertiary" (click)="togglePreview()">
            <span class="icon">👁️</span>
            <span>Preview</span>
          </button>
        </div>
      </div>

      <!-- Controles lateral (apenas em modo de edição) -->
      <div class="layout-container" [class.edit-mode]="editMode">
        
        <!-- Sidebar de controles -->
        <div class="controls-sidebar" *ngIf="editMode">
          <div class="sidebar-header">
            <h3>🎛️ Ferramentas</h3>
            <small>Personalize seus widgets</small>
          </div>
          
          <!-- Seção: Widgets Disponíveis -->
          <div class="control-section">
            <h4>📦 Widgets Disponíveis</h4>
            <div class="widgets-library">
              <div 
                *ngFor="let card of allWidgets" 
                class="widget-item"
                [class.active]="isWidgetActive(card.id)"
                (click)="toggleWidget(card.id)">
                <div class="widget-icon">{{ getWidgetIcon(card.id) }}</div>
                <div class="widget-info">
                  <span class="widget-name">{{ getCardName(card.id) }}</span>
                  <span class="widget-status">{{ isWidgetActive(card.id) ? 'Ativo' : 'Inativo' }}</span>
                </div>
                <div class="widget-toggle">
                  <input type="checkbox" [checked]="isWidgetActive(card.id)" readonly>
                </div>
              </div>
            </div>
          </div>

          <!-- Seção: Card Selecionado -->
          <div class="control-section" *ngIf="selectedCard">
            <h4>🎨 Configurar Widget</h4>
            <div class="card-config">
              <div class="config-item">
                <label>Widget Selecionado:</label>
                <span class="selected-card-name">{{ getCardName(selectedCard) }}</span>
              </div>
              
              <div class="config-item">
                <label>Tamanho:</label>
                <div class="size-selector">
                  <button 
                    *ngFor="let size of cardSizes"
                    class="size-option"
                    [class.selected]="getSelectedCardSize() === size"
                    (click)="changeCardSize(size)">
                    {{ getSizeLabel(size) }}
                  </button>
                </div>
              </div>
              
              <div class="config-item">
                <label>Posição:</label>
                <div class="position-controls">
                  <button class="pos-btn" (click)="moveCard('up')" [disabled]="!canMoveUp()">↑</button>
                  <button class="pos-btn" (click)="moveCard('down')" [disabled]="!canMoveDown()">↓</button>
                  <button class="pos-btn" (click)="moveCard('first')">⤴️</button>
                  <button class="pos-btn" (click)="moveCard('last')">⤵️</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Seção: Templates -->
          <div class="control-section">
            <h4>📋 Templates</h4>
            <div class="template-options">
              <button class="template-btn" (click)="applyTemplate('minimal')">
                <span class="template-icon">📱</span>
                <span>Minimal</span>
              </button>
              <button class="template-btn" (click)="applyTemplate('complete')">
                <span class="template-icon">📊</span>
                <span>Completo</span>
              </button>
              <button class="template-btn" (click)="applyTemplate('focus')">
                <span class="template-icon">🎯</span>
                <span>Foco</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Área principal dos cards -->
        <div class="cards-workspace" [class.with-sidebar]="editMode">
          
          <!-- Instruções para modo de edição -->
          <div class="edit-instructions" *ngIf="editMode && visibleCards.length === 0">
            <div class="instructions-card">
              <h3>🎯 Como personalizar seu dashboard</h3>
              <ol>
                <li>Escolha widgets da biblioteca lateral</li>
                <li>Clique em um widget para configurá-lo</li>
                <li>Arraste widgets para reorganizar</li>
                <li>Ajuste tamanhos e posições</li>
                <li>Salve quando terminar</li>
              </ol>
            </div>
          </div>

          <!-- Grid de cards arrastáveis -->
          <div 
            class="dynamic-grid"
            [class.edit-mode]="editMode"
            cdkDropList
            (cdkDropListDropped)="onCardDrop($event)">
            
            <div 
              *ngFor="let card of visibleCards; trackBy: trackByCardId"
              class="dynamic-card"
              [class]="getCardClasses(card)"
              [attr.data-card-id]="card.id"
              cdkDrag
              [cdkDragDisabled]="!editMode"
              (click)="selectCard(card.id)">
              
              <!-- Overlay de edição -->
              <div class="edit-overlay" *ngIf="editMode">
                <div class="card-actions">
                  <button class="card-action-btn primary" (click)="configureCard(card.id)" title="Configurar">⚙️</button>
                  <button class="card-action-btn danger" (click)="removeCard(card.id)" title="Remover">🗑️</button>
                </div>
                <div class="drag-handle" cdkDragHandle>
                  <span class="drag-icon">⋮⋮</span>
                  <span class="drag-text">Arrastar</span>
                </div>
              </div>

              <!-- Indicador de seleção -->
              <div class="selection-indicator" *ngIf="selectedCard === card.id && editMode"></div>

              <!-- Conteúdo dinâmico do card -->
              <div class="card-content" [ngSwitch]="card.id">
                
                <!-- Widget: Resumo Financeiro Avançado -->
                <div *ngSwitchCase="'resumo-financeiro'" class="widget-resumo-avancado">
                  <div class="widget-header">
                    <h3>💰 Resumo Financeiro</h3>
                    <div class="widget-badge">Personalizado</div>
                  </div>
                  <div class="resumo-grid">
                    <div class="metric-card entrada">
                      <div class="metric-icon">📈</div>
                      <div class="metric-content">
                        <span class="metric-label">Entradas</span>
                        <span class="metric-value">R$ 5.200,00</span>
                        <span class="metric-change positive">+12%</span>
                      </div>
                    </div>
                    <div class="metric-card despesa">
                      <div class="metric-icon">📉</div>
                      <div class="metric-content">
                        <span class="metric-label">Despesas</span>
                        <span class="metric-value">R$ 3.450,00</span>
                        <span class="metric-change negative">+8%</span>
                      </div>
                    </div>
                    <div class="metric-card saldo">
                      <div class="metric-icon">💎</div>
                      <div class="metric-content">
                        <span class="metric-label">Saldo</span>
                        <span class="metric-value">R$ 1.750,00</span>
                        <span class="metric-change positive">+15%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Widget: Despesas Interativas -->
                <div *ngSwitchCase="'despesas-recentes'" class="widget-interativo">
                  <div class="widget-header">
                    <h3>📤 Despesas Recentes</h3>
                    <button class="widget-action">Ver Todas</button>
                  </div>
                  <div class="despesas-interativas">
                    <div class="despesa-interativa paga">
                      <span class="categoria-dot alimentacao"></span>
                      <span class="despesa-nome">Mercado</span>
                      <span class="despesa-valor">R$ 250,00</span>
                      <span class="status-badge pago">Pago</span>
                    </div>
                    <div class="despesa-interativa pendente">
                      <span class="categoria-dot transporte"></span>
                      <span class="despesa-nome">Gasolina</span>
                      <span class="despesa-valor">R$ 180,00</span>
                      <span class="status-badge pendente">Pendente</span>
                    </div>
                    <div class="despesa-interativa vencida">
                      <span class="categoria-dot saude"></span>
                      <span class="despesa-nome">Farmácia</span>
                      <span class="despesa-valor">R$ 85,00</span>
                      <span class="status-badge vencida">Vencida</span>
                    </div>
                  </div>
                </div>

                <!-- Widget: Entradas com Trending -->
                <div *ngSwitchCase="'entradas-recentes'" class="widget-trending">
                  <div class="widget-header">
                    <h3>📥 Entradas Recentes</h3>
                    <div class="trending-indicator up">↗️ +5%</div>
                  </div>
                  <div class="entradas-trending">
                    <div class="entrada-trend">
                      <span class="fonte-icon">💼</span>
                      <div class="entrada-info">
                        <span class="fonte-nome">Salário</span>
                        <span class="entrada-data">15/Nov</span>
                      </div>
                      <span class="entrada-valor principal">R$ 4.500,00</span>
                    </div>
                    <div class="entrada-trend">
                      <span class="fonte-icon">💻</span>
                      <div class="entrada-info">
                        <span class="fonte-nome">Freelance</span>
                        <span class="entrada-data">10/Nov</span>
                      </div>
                      <span class="entrada-valor secundario">R$ 700,00</span>
                    </div>
                  </div>
                </div>

                <!-- Widget: Categorias com Gráfico -->
                <div *ngSwitchCase="'categorias-gastos'" class="widget-chart-avancado">
                  <div class="widget-header">
                    <h3>📊 Análise de Categorias</h3>
                    <select class="period-selector">
                      <option>Este Mês</option>
                      <option>Últimos 3 Meses</option>
                    </select>
                  </div>
                  <div class="chart-container">
                    <div class="category-chart">
                      <div class="category-slice alimentacao" style="--percentage: 35%">
                        <span class="slice-label">Alimentação 35%</span>
                      </div>
                      <div class="category-slice transporte" style="--percentage: 25%">
                        <span class="slice-label">Transporte 25%</span>
                      </div>
                      <div class="category-slice saude" style="--percentage: 15%">
                        <span class="slice-label">Saúde 15%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Widget: Gráficos com Análise -->
                <div *ngSwitchCase="'graficos-mensais'" class="widget-analytics">
                  <div class="widget-header">
                    <h3>📈 Análise Temporal</h3>
                    <div class="chart-controls">
                      <button class="chart-btn active">6M</button>
                      <button class="chart-btn">1A</button>
                    </div>
                  </div>
                  <div class="analytics-content">
                    <div class="chart-area">
                      <div class="trend-chart">
                        <div class="chart-bar" style="height: 60%" data-value="R$ 3.200"></div>
                        <div class="chart-bar" style="height: 80%" data-value="R$ 4.100"></div>
                        <div class="chart-bar" style="height: 45%" data-value="R$ 2.800"></div>
                        <div class="chart-bar" style="height: 90%" data-value="R$ 4.500"></div>
                        <div class="chart-bar" style="height: 70%" data-value="R$ 3.600"></div>
                        <div class="chart-bar" style="height: 85%" data-value="R$ 4.200"></div>
                      </div>
                    </div>
                    <div class="trend-summary">
                      <span class="trend-text">Tendência: <strong>+12% ↗️</strong></span>
                    </div>
                  </div>
                </div>

                <!-- Widget: Alertas Inteligentes -->
                <div *ngSwitchCase="'alertas'" class="widget-smart-alerts">
                  <div class="widget-header">
                    <h3>🚨 Alertas Inteligentes</h3>
                    <div class="alert-count">3</div>
                  </div>
                  <div class="smart-alerts">
                    <div class="smart-alert critical">
                      <div class="alert-icon">⚠️</div>
                      <div class="alert-content">
                        <span class="alert-title">Contas Vencidas</span>
                        <span class="alert-message">3 contas venceram esta semana</span>
                      </div>
                      <button class="alert-action">Pagar</button>
                    </div>
                    <div class="smart-alert warning">
                      <div class="alert-icon">📊</div>
                      <div class="alert-content">
                        <span class="alert-title">Meta Mensal</span>
                        <span class="alert-message">70% da meta atingida</span>
                      </div>
                      <button class="alert-action">Ver</button>
                    </div>
                    <div class="smart-alert info">
                      <div class="alert-icon">💡</div>
                      <div class="alert-content">
                        <span class="alert-title">Dica de Economia</span>
                        <span class="alert-message">Você gastou 15% menos em transporte</span>
                      </div>
                      <button class="alert-action">Mais</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./customizable-layout.component.scss']
})
export class CustomizableLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentTheme = 'customizavel';
  cardPositions: CardPosition[] = [];
  selectedCard: string | null = null;
  enableDragDrop = true;
  showControls = true;
  editMode = false;
  previewMode = false;
  
  // Definir os tamanhos disponíveis com tipo específico
  cardSizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];

  // Todos os widgets disponíveis
  allWidgets: CardPosition[] = [
    { id: 'resumo-financeiro', order: 1, visible: true, size: 'large' },
    { id: 'despesas-recentes', order: 2, visible: true, size: 'medium' },
    { id: 'entradas-recentes', order: 3, visible: true, size: 'medium' },
    { id: 'categorias-gastos', order: 4, visible: true, size: 'medium' },
    { id: 'graficos-mensais', order: 5, visible: true, size: 'large' },
    { id: 'alertas', order: 6, visible: true, size: 'small' }
  ];

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.temaAtual$.pipe(takeUntil(this.destroy$))
      .subscribe(tema => {
        this.currentTheme = tema;
        const layout = this.themeService.layoutAtual;
        this.enableDragDrop = layout.enableDragDrop;
        this.showControls = layout.customizable;
        // Ativar modo de edição automaticamente no tema customizável
        if (tema === 'customizavel') {
          this.editMode = true;
        }
      });

    this.themeService.cardPositions$.pipe(takeUntil(this.destroy$))
      .subscribe(positions => {
        this.cardPositions = positions.length > 0 ? positions : this.allWidgets;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get visibleCards(): CardPosition[] {
    return this.cardPositions
      .filter(card => card.visible)
      .sort((a, b) => a.order - b.order);
  }

  trackByCardId(index: number, card: CardPosition): string {
    return card.id;
  }

  // Métodos de controle de layout
  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.selectedCard = null;
      this.themeService.updateCardPositions(this.cardPositions);
    }
  }

  togglePreview(): void {
    this.previewMode = !this.previewMode;
    if (this.previewMode) {
      this.editMode = false;
      this.selectedCard = null;
    }
  }

  // Gerenciamento de widgets
  isWidgetActive(widgetId: string): boolean {
    return this.cardPositions.some(card => card.id === widgetId && card.visible);
  }

  toggleWidget(widgetId: string): void {
    const existingCard = this.cardPositions.find(card => card.id === widgetId);
    if (existingCard) {
      existingCard.visible = !existingCard.visible;
    } else {
      const defaultWidget = this.allWidgets.find(w => w.id === widgetId);
      if (defaultWidget) {
        this.cardPositions.push({ ...defaultWidget, visible: true });
      }
    }
  }

  removeCard(cardId: string): void {
    this.cardPositions = this.cardPositions.map(card => 
      card.id === cardId ? { ...card, visible: false } : card
    );
    if (this.selectedCard === cardId) {
      this.selectedCard = null;
    }
  }

  configureCard(cardId: string): void {
    this.selectedCard = cardId;
  }

  // Drag and drop
  onCardDrop(event: CdkDragDrop<CardPosition[]>): void {
    if (!this.enableDragDrop || !this.editMode) return;

    const updatedCards = [...this.cardPositions];
    const visibleCards = this.visibleCards;
    moveItemInArray(visibleCards, event.previousIndex, event.currentIndex);
    
    // Atualizar orders
    visibleCards.forEach((card, index) => {
      const originalCard = updatedCards.find(c => c.id === card.id);
      if (originalCard) {
        originalCard.order = index + 1;
      }
    });

    this.cardPositions = updatedCards;
  }

  selectCard(cardId: string): void {
    if (this.editMode) {
      this.selectedCard = this.selectedCard === cardId ? null : cardId;
    }
  }

  toggleCardVisibility(cardId: string): void {
    const updatedCards = this.cardPositions.map(card => 
      card.id === cardId ? { ...card, visible: !card.visible } : card
    );
    this.cardPositions = updatedCards;
  }

  changeCardSize(size: 'small' | 'medium' | 'large'): void {
    if (!this.selectedCard) return;

    this.cardPositions = this.cardPositions.map(card => 
      card.id === this.selectedCard ? { ...card, size } : card
    );
  }

  getSelectedCardSize(): 'small' | 'medium' | 'large' | undefined {
    return this.cardPositions.find(c => c.id === this.selectedCard)?.size;
  }

  // Controles de posição
  canMoveUp(): boolean {
    if (!this.selectedCard) return false;
    const card = this.cardPositions.find(c => c.id === this.selectedCard);
    return card ? card.order > 1 : false;
  }

  canMoveDown(): boolean {
    if (!this.selectedCard) return false;
    const card = this.cardPositions.find(c => c.id === this.selectedCard);
    const maxOrder = Math.max(...this.visibleCards.map(c => c.order));
    return card ? card.order < maxOrder : false;
  }

  moveCard(direction: 'up' | 'down' | 'first' | 'last'): void {
    if (!this.selectedCard) return;

    const targetCard = this.cardPositions.find(c => c.id === this.selectedCard);
    if (!targetCard) return;

    const visibleCards = this.visibleCards;
    const currentIndex = visibleCards.findIndex(c => c.id === this.selectedCard);

    let newIndex = currentIndex;
    switch (direction) {
      case 'up':
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'down':
        newIndex = Math.min(visibleCards.length - 1, currentIndex + 1);
        break;
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = visibleCards.length - 1;
        break;
    }

    if (newIndex !== currentIndex) {
      moveItemInArray(visibleCards, currentIndex, newIndex);
      visibleCards.forEach((card, index) => {
        const originalCard = this.cardPositions.find(c => c.id === card.id);
        if (originalCard) {
          originalCard.order = index + 1;
        }
      });
    }
  }

  // Templates
  applyTemplate(templateName: string): void {
    switch (templateName) {
      case 'minimal':
        this.cardPositions = [
          { id: 'resumo-financeiro', order: 1, visible: true, size: 'large' },
          { id: 'alertas', order: 2, visible: true, size: 'medium' }
        ];
        break;
      case 'complete':
        this.cardPositions = [...this.allWidgets];
        break;
      case 'focus':
        this.cardPositions = [
          { id: 'resumo-financeiro', order: 1, visible: true, size: 'large' },
          { id: 'despesas-recentes', order: 2, visible: true, size: 'medium' },
          { id: 'graficos-mensais', order: 3, visible: true, size: 'large' }
        ];
        break;
    }
    this.selectedCard = null;
  }

  resetLayout(): void {
    this.cardPositions = [...this.allWidgets];
    this.selectedCard = null;
  }

  // Utilitários
  getCardClasses(card: CardPosition): string {
    let classes = `card-${card.size} card-${card.id}`;
    if (this.selectedCard === card.id && this.editMode) {
      classes += ' selected';
    }
    if (this.editMode) {
      classes += ' editable';
    }
    return classes;
  }

  getWidgetIcon(cardId: string): string {
    const icons: { [key: string]: string } = {
      'resumo-financeiro': '💰',
      'despesas-recentes': '📤',
      'entradas-recentes': '📥',
      'categorias-gastos': '📊',
      'graficos-mensais': '📈',
      'alertas': '🚨'
    };
    return icons[cardId] || '📦';
  }

  getCardName(cardId: string): string {
    const names: { [key: string]: string } = {
      'resumo-financeiro': 'Resumo Financeiro',
      'despesas-recentes': 'Despesas Recentes',
      'entradas-recentes': 'Entradas Recentes',
      'categorias-gastos': 'Categorias de Gastos',
      'graficos-mensais': 'Gráficos Mensais',
      'alertas': 'Alertas'
    };
    return names[cardId] || cardId;
  }

  getSizeLabel(size: string): string {
    const labels: { [key: string]: string } = {
      'small': 'Pequeno',
      'medium': 'Médio',
      'large': 'Grande'
    };
    return labels[size] || size;
  }
}