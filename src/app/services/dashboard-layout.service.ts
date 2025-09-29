import { Injectable } from '@angular/core';import { Injectable } from '@angular/core';import { Injectable } from '@angular/core';import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({

  providedIn: 'root'import { DashboardTheme, DashboardCard, LayoutPersonalizacao, VisualizacaoConfig } from '../models/tema.model';import { BehaviorSubject, Observable } from 'rxjs';import { BehaviorSubject, Observable } from 'rxjs';

})

export class DashboardLayoutService {

  private temaAtualSubject = new BehaviorSubject<string>('classico');

  public temaAtual$ = this.temaAtualSubject.asObservable();@Injectable({import { DashboardTheme, DashboardCard, LayoutPersonalizacao, VisualizacaoConfig } from '../models/tema.model';import { DashboardTheme, DashboardLayout, DashboardCard, CardPosition } from '../models/despesa.model';



  constructor() {  providedIn: 'root'

    this.carregarTema();

  }})



  getTemas() {export class DashboardLayoutService {

    return [

      { id: 'compacto', nome: 'Compacto', descricao: 'Layout otimizado' },  private readonly STORAGE_KEY = 'dashboard-layout-config';@Injectable({@Injectable({

      { id: 'classico', nome: 'Clássico', descricao: 'Layout tradicional' },

      { id: 'customizavel', nome: 'Customizável', descricao: 'Layout flexível' }  private readonly THEME_KEY = 'dashboard-current-theme';

    ];

  }  providedIn: 'root'  providedIn: 'root'



  alterarTema(temaId: string): void {  // Estados reativos

    this.temaAtualSubject.next(temaId);

    this.salvarTema(temaId);  private configAtualSubject = new BehaviorSubject<VisualizacaoConfig>(this.getDefaultConfig());})})

    this.aplicarTema(temaId);

  }  public configAtual$ = this.configAtualSubject.asObservable();



  private aplicarTema(temaId: string): void {export class DashboardLayoutService {export class DashboardLayoutService {

    const root = document.documentElement;

      private modoEdicaoSubject = new BehaviorSubject<boolean>(false);

    // Remove classes anteriores

    document.body.className = document.body.className.replace(/tema-\w+/g, '');  public modoEdicao$ = this.modoEdicaoSubject.asObservable();  private readonly STORAGE_KEY = 'dashboard-layout-config';  private currentThemeSubject = new BehaviorSubject<DashboardTheme>(this.getDefaultThemes()[0]);

    document.body.classList.add(`tema-${temaId}`);



    // Aplica variáveis CSS baseadas no tema

    switch (temaId) {  constructor() {  private readonly THEME_KEY = 'dashboard-current-theme';  private currentLayoutSubject = new BehaviorSubject<DashboardLayout>(this.getDefaultLayout());

      case 'compacto':

        root.style.setProperty('--tema-cor-primaria', '#2563eb');    this.carregarConfiguracao();

        root.style.setProperty('--tema-espacamento', '8px');

        root.style.setProperty('--tema-fonte-tamanho', '0.875rem');  }  

        break;

      case 'classico':

        root.style.setProperty('--tema-cor-primaria', '#059669');

        root.style.setProperty('--tema-espacamento', '16px');  // Temas pré-definidos  // Estados reativos  public currentTheme$ = this.currentThemeSubject.asObservable();

        root.style.setProperty('--tema-fonte-tamanho', '1rem');

        break;  getTemasDisponiveis(): DashboardTheme[] {

      case 'customizavel':

        root.style.setProperty('--tema-cor-primaria', '#7c3aed');    return [  private configAtualSubject = new BehaviorSubject<VisualizacaoConfig>(this.getDefaultConfig());  public currentLayout$ = this.currentLayoutSubject.asObservable();

        root.style.setProperty('--tema-espacamento', '12px');

        root.style.setProperty('--tema-fonte-tamanho', '1rem');      this.getTemaCompacto(),

        break;

    }      this.getTemaClassico(),  public configAtual$ = this.configAtualSubject.asObservable();

  }

      this.getTemaCustomizavel()

  private carregarTema(): void {

    const temaSalvo = localStorage.getItem('dashboard-tema');    ];  constructor() {

    if (temaSalvo) {

      this.alterarTema(temaSalvo);  }

    }

  }  private modoEdicaoSubject = new BehaviorSubject<boolean>(false);    this.loadSavedLayout();



  private salvarTema(temaId: string): void {  private getTemaCompacto(): DashboardTheme {

    localStorage.setItem('dashboard-tema', temaId);

  }    return {  public modoEdicao$ = this.modoEdicaoSubject.asObservable();  }

}
      id: 'compacto',

      nome: 'Compacto',

      descricao: 'Layout otimizado com informações condensadas',

      tipo: 'compacto',  constructor() {  getDefaultThemes(): DashboardTheme[] {

      estilos: {

        corPrimaria: '#2563eb',    this.carregarConfiguracao();    return [

        corSecundaria: '#64748b',

        corFundo: '#f8fafc',  }      {

        corTexto: '#1e293b',

        corBorda: '#e2e8f0',        id: 'compacto',

        bordaRadius: '6px',

        espacamento: 'pequeno',  // Temas pré-definidos        name: 'Compacto',

        fonte: {

          familia: 'Inter, system-ui, sans-serif',  getTemasDisponiveis(): DashboardTheme[] {        description: 'Layout compacto com cards menores',

          tamanho: 'pequeno'

        }    return [        cardSpacing: 10,

      },

      layout: {      this.getTemaCompacto(),        defaultCardSize: { width: 300, height: 200 },

        colunas: 4,

        espacamentoCards: 8,      this.getTemaClassico(),        gridColumns: 4,

        alturaHeader: 60,

        layoutType: 'grid'      this.getTemaCustomizavel()        isDraggable: false

      },

      cards: this.getCardsCompacto()    ];      },

    };

  }  }      {



  private getTemaClassico(): DashboardTheme {        id: 'classico',

    return {

      id: 'classico',  private getTemaCompacto(): DashboardTheme {        name: 'Clássico',

      nome: 'Clássico',

      descricao: 'Layout tradicional com espaçamento confortável',    return {        description: 'Layout tradicional e organizado',

      tipo: 'classico',

      estilos: {      id: 'compacto',        cardSpacing: 20,

        corPrimaria: '#059669',

        corSecundaria: '#6b7280',      nome: 'Compacto',        defaultCardSize: { width: 400, height: 300 },

        corFundo: '#ffffff',

        corTexto: '#374151',      descricao: 'Layout otimizado com informações condensadas',        gridColumns: 2,

        corBorda: '#d1d5db',

        bordaRadius: '12px',      tipo: 'compacto',        isDraggable: false

        espacamento: 'medio',

        fonte: {      estilos: {      },

          familia: 'Roboto, Arial, sans-serif',

          tamanho: 'medio'        corPrimaria: '#2563eb',      {

        }

      },        corSecundaria: '#64748b',        id: 'customizado',

      layout: {

        colunas: 3,        corFundo: '#f8fafc',        name: 'Customizável',

        espacamentoCards: 16,

        alturaHeader: 80,        corTexto: '#1e293b',        description: 'Layout personalizável com drag-and-drop',

        layoutType: 'grid'

      },        corBorda: '#e2e8f0',        cardSpacing: 15,

      cards: this.getCardsClassico()

    };        bordaRadius: '6px',        defaultCardSize: { width: 350, height: 250 },

  }

        espacamento: 'pequeno',        gridColumns: 3,

  private getTemaCustomizavel(): DashboardTheme {

    return {        fonte: {        isDraggable: true

      id: 'customizavel',

      nome: 'Customizável',          familia: 'Inter, system-ui, sans-serif',      }

      descricao: 'Layout flexível com drag & drop',

      tipo: 'customizavel',          tamanho: 'pequeno'    ];

      estilos: {

        corPrimaria: '#7c3aed',        }  }

        corSecundaria: '#9ca3af',

        corFundo: '#f9fafb',      },

        corTexto: '#111827',

        corBorda: '#e5e7eb',      layout: {  getDefaultCards(): DashboardCard[] {

        bordaRadius: '8px',

        espacamento: 'medio',        colunas: 4,    return [

        fonte: {

          familia: 'Source Sans Pro, sans-serif',        espacamentoCards: 8,      {

          tamanho: 'medio'

        }        alturaHeader: 60,        id: 'card-resumo',

      },

      layout: {        layoutType: 'grid'        type: 'resumo',

        colunas: 12, // Grid mais flexível

        espacamentoCards: 12,      },        title: 'Resumo Financeiro',

        alturaHeader: 70,

        layoutType: 'masonry'      cards: this.getCardsCompacto()        component: 'resumo-cards',

      },

      cards: this.getCardsCustomizavel()    };        position: { x: 0, y: 0, width: 2, height: 1 },

    };

  }  }        visible: true



  private getCardsCompacto(): DashboardCard[] {      },

    return [

      { id: 'resumo-financeiro', component: 'resumo', titulo: 'Resumo', tipo: 'resumo', posicao: { x: 0, y: 0, largura: 4, altura: 1 }, visivel: true },  private getTemaClassico(): DashboardTheme {      {

      { id: 'grafico-despesas', component: 'chart', titulo: 'Gráfico', tipo: 'grafico', posicao: { x: 0, y: 1, largura: 2, altura: 2 }, visivel: true },

      { id: 'despesas-mes', component: 'despesas-list', titulo: 'Despesas', tipo: 'lista', posicao: { x: 2, y: 1, largura: 2, altura: 2 }, visivel: true },    return {        id: 'card-grafico',

      { id: 'alertas', component: 'alertas', titulo: 'Alertas', tipo: 'alertas', posicao: { x: 0, y: 3, largura: 4, altura: 1 }, visivel: true }

    ];      id: 'classico',        type: 'grafico',

  }

      nome: 'Clássico',        title: 'Gráfico de Despesas',

  private getCardsClassico(): DashboardCard[] {

    return [      descricao: 'Layout tradicional com espaçamento confortável',        component: 'chart',

      { id: 'resumo-financeiro', component: 'resumo', titulo: 'Resumo Financeiro', tipo: 'resumo', posicao: { x: 0, y: 0, largura: 3, altura: 1 }, visivel: true },

      { id: 'grafico-despesas', component: 'chart', titulo: 'Distribuição de Despesas', tipo: 'grafico', posicao: { x: 0, y: 1, largura: 2, altura: 2 }, visivel: true },      tipo: 'classico',        position: { x: 0, y: 1, width: 1, height: 2 },

      { id: 'despesas-mes', component: 'despesas-list', titulo: 'Despesas do Mês', tipo: 'lista', posicao: { x: 1, y: 1, largura: 1, altura: 2 }, visivel: true },

      { id: 'alertas-vencimento', component: 'alertas', titulo: 'Alertas de Vencimento', tipo: 'alertas', posicao: { x: 0, y: 3, largura: 3, altura: 1 }, visivel: true }      estilos: {        visible: true

    ];

  }        corPrimaria: '#059669',      },



  private getCardsCustomizavel(): DashboardCard[] {        corSecundaria: '#6b7280',      {

    return [

      { id: 'resumo-entradas', component: 'resumo-entradas', titulo: 'Entradas', tipo: 'resumo', posicao: { x: 0, y: 0, largura: 3, altura: 1 }, visivel: true },        corFundo: '#ffffff',        id: 'card-despesas',

      { id: 'resumo-despesas', component: 'resumo-despesas', titulo: 'Despesas', tipo: 'resumo', posicao: { x: 3, y: 0, largura: 3, altura: 1 }, visivel: true },

      { id: 'resumo-saldo', component: 'resumo-saldo', titulo: 'Saldo', tipo: 'resumo', posicao: { x: 6, y: 0, largura: 3, altura: 1 }, visivel: true },        corTexto: '#374151',        type: 'despesas',

      { id: 'controles', component: 'controles', titulo: 'Controles', tipo: 'personalizado', posicao: { x: 9, y: 0, largura: 3, altura: 1 }, visivel: true },

      { id: 'grafico-principal', component: 'chart', titulo: 'Gráfico Principal', tipo: 'grafico', posicao: { x: 0, y: 1, largura: 6, altura: 3 }, visivel: true },        corBorda: '#d1d5db',        title: 'Despesas do Mês',

      { id: 'despesas-detalhes', component: 'despesas-list', titulo: 'Despesas Detalhadas', tipo: 'lista', posicao: { x: 6, y: 1, largura: 6, altura: 3 }, visivel: true },

      { id: 'alertas-compacto', component: 'alertas', titulo: 'Alertas', tipo: 'alertas', posicao: { x: 0, y: 4, largura: 12, altura: 1 }, visivel: true }        bordaRadius: '12px',        component: 'despesas-list',

    ];

  }        espacamento: 'medio',        position: { x: 1, y: 1, width: 1, height: 2 },



  // Métodos principais        fonte: {        visible: true

  getTemaAtual(): DashboardTheme {

    return this.configAtualSubject.value.tema;          familia: 'Roboto, Arial, sans-serif',      },

  }

          tamanho: 'medio'      {

  alterarTema(temaId: string): void {

    const temasDisponiveis = this.getTemasDisponiveis();        }        id: 'card-alertas',

    const novoTema = temasDisponiveis.find(tema => tema.id === temaId);

          },        type: 'alertas',

    if (novoTema) {

      const novaConfig: VisualizacaoConfig = {      layout: {        title: 'Alertas e Vencimentos',

        tema: novoTema,

        personalizacao: this.configAtualSubject.value.personalizacao,        colunas: 3,        component: 'alertas',

        modoEdicao: this.configAtualSubject.value.modoEdicao

      };        espacamentoCards: 16,        position: { x: 0, y: 3, width: 2, height: 1 },

      

      this.configAtualSubject.next(novaConfig);        alturaHeader: 80,        visible: true

      this.salvarConfiguracao();

      this.aplicarTema(novoTema);        layoutType: 'grid'      }

    }

  }      },    ];



  toggleModoEdicao(): void {      cards: this.getCardsClassico()  }

    const modoAtual = this.modoEdicaoSubject.value;

    this.modoEdicaoSubject.next(!modoAtual);    };

    

    const novaConfig = {  }  getDefaultLayout(): DashboardLayout {

      ...this.configAtualSubject.value,

      modoEdicao: !modoAtual    return {

    };

    this.configAtualSubject.next(novaConfig);  private getTemaCustomizavel(): DashboardTheme {      themeId: 'compacto',

  }

    return {      cards: this.getDefaultCards(),

  resetarLayout(): void {

    const temaAtual = this.getTemaAtual();      id: 'customizavel',      settings: {

    const configDefault: VisualizacaoConfig = {

      tema: temaAtual,      nome: 'Customizável',        showAnimation: true,

      modoEdicao: false

    };      descricao: 'Layout flexível com drag & drop',        autoSave: true,

    

    this.configAtualSubject.next(configDefault);      tipo: 'customizavel',        snapToGrid: true

    this.modoEdicaoSubject.next(false);

    this.salvarConfiguracao();      estilos: {      }

  }

        corPrimaria: '#7c3aed',    };

  // Métodos privados

  private aplicarTema(tema: DashboardTheme): void {        corSecundaria: '#9ca3af',  }

    const root = document.documentElement;

            corFundo: '#f9fafb',

    // Aplicar CSS customizadas

    root.style.setProperty('--tema-cor-primaria', tema.estilos.corPrimaria);        corTexto: '#111827',  setTheme(theme: DashboardTheme): void {

    root.style.setProperty('--tema-cor-secundaria', tema.estilos.corSecundaria);

    root.style.setProperty('--tema-cor-fundo', tema.estilos.corFundo);        corBorda: '#e5e7eb',    this.currentThemeSubject.next(theme);

    root.style.setProperty('--tema-cor-texto', tema.estilos.corTexto);

    root.style.setProperty('--tema-cor-borda', tema.estilos.corBorda);        bordaRadius: '8px',    const currentLayout = this.currentLayoutSubject.value;

    root.style.setProperty('--tema-borda-radius', tema.estilos.bordaRadius);

    root.style.setProperty('--tema-fonte-familia', tema.estilos.fonte.familia);        espacamento: 'medio',    currentLayout.themeId = theme.id;

    

    // Aplicar classes de tema        fonte: {    this.currentLayoutSubject.next(currentLayout);

    document.body.className = document.body.className.replace(/tema-\w+/g, '');

    document.body.classList.add(`tema-${tema.id}`);          familia: 'Source Sans Pro, sans-serif',    this.saveLayout();

    document.body.classList.add(`espacamento-${tema.estilos.espacamento}`);

    document.body.classList.add(`fonte-${tema.estilos.fonte.tamanho}`);          tamanho: 'medio'  }

  }

        }

  private getDefaultConfig(): VisualizacaoConfig {

    return {      },  updateCardPosition(cardId: string, position: CardPosition): void {

      tema: this.getTemaClassico(),

      modoEdicao: false      layout: {    const currentLayout = this.currentLayoutSubject.value;

    };

  }        colunas: 12, // Grid mais flexível    const cardIndex = currentLayout.cards.findIndex(card => card.id === cardId);



  private carregarConfiguracao(): void {        espacamentoCards: 12,    

    try {

      const configSalva = localStorage.getItem(this.STORAGE_KEY);        alturaHeader: 70,    if (cardIndex !== -1) {

      if (configSalva) {

        const config = JSON.parse(configSalva);        layoutType: 'masonry'      currentLayout.cards[cardIndex].position = {

        

        // Garantir que o tema existe      },        x: position.x,

        const temasDisponiveis = this.getTemasDisponiveis();

        const tema = temasDisponiveis.find(t => t.id === config.tema?.id) || this.getTemaClassico();      cards: this.getCardsCustomizavel()        y: position.y,

        

        const configuracao: VisualizacaoConfig = {    };        width: position.width,

          tema,

          personalizacao: config.personalizacao,  }        height: position.height

          modoEdicao: false // Sempre iniciar com modo edição desligado

        };      };

        

        this.configAtualSubject.next(configuracao);  private getCardsCompacto(): DashboardCard[] {      

        this.aplicarTema(tema);

      }    return [      this.currentLayoutSubject.next(currentLayout);

    } catch (error) {

      console.warn('Erro ao carregar configuração do dashboard:', error);      { id: 'resumo-financeiro', component: 'resumo', titulo: 'Resumo', tipo: 'resumo', posicao: { x: 0, y: 0, largura: 4, altura: 1 }, visivel: true },      

      this.configAtualSubject.next(this.getDefaultConfig());

    }      { id: 'grafico-despesas', component: 'chart', titulo: 'Gráfico', tipo: 'grafico', posicao: { x: 0, y: 1, largura: 2, altura: 2 }, visivel: true },      if (currentLayout.settings.autoSave) {

  }

      { id: 'despesas-mes', component: 'despesas-list', titulo: 'Despesas', tipo: 'lista', posicao: { x: 2, y: 1, largura: 2, altura: 2 }, visivel: true },        this.saveLayout();

  private salvarConfiguracao(): void {

    try {      { id: 'alertas', component: 'alertas', titulo: 'Alertas', tipo: 'alertas', posicao: { x: 0, y: 3, largura: 4, altura: 1 }, visivel: true }      }

      const config = this.configAtualSubject.value;

      const configParaSalvar = {    ];    }

        tema: config.tema,

        personalizacao: config.personalizacao  }  }

      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configParaSalvar));

    } catch (error) {

      console.warn('Erro ao salvar configuração do dashboard:', error);  private getCardsClassico(): DashboardCard[] {  updateCardPositions(cards: DashboardCard[]): void {

    }

  }    return [    const currentLayout = this.currentLayoutSubject.value;

}
      { id: 'resumo-financeiro', component: 'resumo', titulo: 'Resumo Financeiro', tipo: 'resumo', posicao: { x: 0, y: 0, largura: 3, altura: 1 }, visivel: true },    currentLayout.cards = cards;

      { id: 'grafico-despesas', component: 'chart', titulo: 'Distribuição de Despesas', tipo: 'grafico', posicao: { x: 0, y: 1, largura: 2, altura: 2 }, visivel: true },    this.currentLayoutSubject.next(currentLayout);

      { id: 'despesas-mes', component: 'despesas-list', titulo: 'Despesas do Mês', tipo: 'lista', posicao: { x: 1, y: 1, largura: 1, altura: 2 }, visivel: true },    

      { id: 'alertas-vencimento', component: 'alertas', titulo: 'Alertas de Vencimento', tipo: 'alertas', posicao: { x: 0, y: 3, largura: 3, altura: 1 }, visivel: true }    if (currentLayout.settings.autoSave) {

    ];      this.saveLayout();

  }    }

  }

  private getCardsCustomizavel(): DashboardCard[] {

    return [  toggleCardVisibility(cardId: string): void {

      { id: 'resumo-entradas', component: 'resumo-entradas', titulo: 'Entradas', tipo: 'resumo', posicao: { x: 0, y: 0, largura: 3, altura: 1 }, visivel: true },    const currentLayout = this.currentLayoutSubject.value;

      { id: 'resumo-despesas', component: 'resumo-despesas', titulo: 'Despesas', tipo: 'resumo', posicao: { x: 3, y: 0, largura: 3, altura: 1 }, visivel: true },    const cardIndex = currentLayout.cards.findIndex(card => card.id === cardId);

      { id: 'resumo-saldo', component: 'resumo-saldo', titulo: 'Saldo', tipo: 'resumo', posicao: { x: 6, y: 0, largura: 3, altura: 1 }, visivel: true },    

      { id: 'controles', component: 'controles', titulo: 'Controles', tipo: 'personalizado', posicao: { x: 9, y: 0, largura: 3, altura: 1 }, visivel: true },    if (cardIndex !== -1) {

      { id: 'grafico-principal', component: 'chart', titulo: 'Gráfico Principal', tipo: 'grafico', posicao: { x: 0, y: 1, largura: 6, altura: 3 }, visivel: true },      currentLayout.cards[cardIndex].visible = !currentLayout.cards[cardIndex].visible;

      { id: 'despesas-detalhes', component: 'despesas-list', titulo: 'Despesas Detalhadas', tipo: 'lista', posicao: { x: 6, y: 1, largura: 6, altura: 3 }, visivel: true },      this.currentLayoutSubject.next(currentLayout);

      { id: 'alertas-compacto', component: 'alertas', titulo: 'Alertas', tipo: 'alertas', posicao: { x: 0, y: 4, largura: 12, altura: 1 }, visivel: true }      this.saveLayout();

    ];    }

  }  }



  // Métodos principais  resetLayout(): void {

  getTemaAtual(): DashboardTheme {    const defaultLayout = this.getDefaultLayout();

    return this.configAtualSubject.value.tema;    this.currentLayoutSubject.next(defaultLayout);

  }    this.saveLayout();

  }

  alterarTema(temaId: string): void {

    const temasDisponiveis = this.getTemasDisponiveis();  saveLayout(): void {

    const novoTema = temasDisponiveis.find(tema => tema.id === temaId);    const layout = this.currentLayoutSubject.value;

        localStorage.setItem('dashboard-layout', JSON.stringify(layout));

    if (novoTema) {  }

      const novaConfig: VisualizacaoConfig = {

        tema: novoTema,  private loadSavedLayout(): void {

        personalizacao: this.configAtualSubject.value.personalizacao,    const savedLayout = localStorage.getItem('dashboard-layout');

        modoEdicao: this.configAtualSubject.value.modoEdicao    if (savedLayout) {

      };      try {

              const layout: DashboardLayout = JSON.parse(savedLayout);

      this.configAtualSubject.next(novaConfig);        this.currentLayoutSubject.next(layout);

      this.salvarConfiguracao();        

      this.aplicarTema(novoTema);        // Encontrar e definir o tema correspondente

    }        const themes = this.getDefaultThemes();

  }        const theme = themes.find(t => t.id === layout.themeId) || themes[0];

        this.currentThemeSubject.next(theme);

  toggleModoEdicao(): void {      } catch (error) {

    const modoAtual = this.modoEdicaoSubject.value;        console.error('Erro ao carregar layout salvo:', error);

    this.modoEdicaoSubject.next(!modoAtual);      }

        }

    const novaConfig = {  }

      ...this.configAtualSubject.value,

      modoEdicao: !modoAtual  exportLayout(): string {

    };    return JSON.stringify(this.currentLayoutSubject.value, null, 2);

    this.configAtualSubject.next(novaConfig);  }

  }

  importLayout(layoutJson: string): boolean {

  salvarPersonalizacao(personalizacao: LayoutPersonalizacao): void {    try {

    const novaConfig = {      const layout: DashboardLayout = JSON.parse(layoutJson);

      ...this.configAtualSubject.value,      this.currentLayoutSubject.next(layout);

      personalizacao      this.saveLayout();

    };      return true;

    this.configAtualSubject.next(novaConfig);    } catch (error) {

    this.salvarConfiguracao();      console.error('Erro ao importar layout:', error);

  }      return false;

    }

  atualizarPosicaoCard(cardId: string, novaPosicao: DashboardCard['posicao']): void {  }

    const config = this.configAtualSubject.value;}

    const cards = config.personalizacao?.cards || config.tema.cards;
    
    const cardIndex = cards.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      cards[cardIndex].posicao = novaPosicao;
      
      if (config.personalizacao) {
        config.personalizacao.atualizadoEm = new Date();
        this.salvarPersonalizacao(config.personalizacao);
      }
    }
  }

  toggleVisibilidadeCard(cardId: string): void {
    const config = this.configAtualSubject.value;
    const cards = config.personalizacao?.cards || config.tema.cards;
    
    const card = cards.find(c => c.id === cardId);
    if (card) {
      card.visivel = !card.visivel;
      this.salvarConfiguracao();
    }
  }

  resetarLayout(): void {
    const temaAtual = this.getTemaAtual();
    const configDefault: VisualizacaoConfig = {
      tema: temaAtual,
      modoEdicao: false
    };
    
    this.configAtualSubject.next(configDefault);
    this.modoEdicaoSubject.next(false);
    this.salvarConfiguracao();
  }

  // Métodos privados
  private aplicarTema(tema: DashboardTheme): void {
    const root = document.documentElement;
    
    // Aplicar CSS customizadas
    root.style.setProperty('--tema-cor-primaria', tema.estilos.corPrimaria);
    root.style.setProperty('--tema-cor-secundaria', tema.estilos.corSecundaria);
    root.style.setProperty('--tema-cor-fundo', tema.estilos.corFundo);
    root.style.setProperty('--tema-cor-texto', tema.estilos.corTexto);
    root.style.setProperty('--tema-cor-borda', tema.estilos.corBorda);
    root.style.setProperty('--tema-borda-radius', tema.estilos.bordaRadius);
    root.style.setProperty('--tema-fonte-familia', tema.estilos.fonte.familia);
    
    // Aplicar classes de tema
    document.body.className = document.body.className.replace(/tema-\w+/g, '');
    document.body.classList.add(`tema-${tema.id}`);
    document.body.classList.add(`espacamento-${tema.estilos.espacamento}`);
    document.body.classList.add(`fonte-${tema.estilos.fonte.tamanho}`);
  }

  private getDefaultConfig(): VisualizacaoConfig {
    return {
      tema: this.getTemaClassico(),
      modoEdicao: false
    };
  }

  private carregarConfiguracao(): void {
    try {
      const configSalva = localStorage.getItem(this.STORAGE_KEY);
      if (configSalva) {
        const config = JSON.parse(configSalva);
        
        // Garantir que o tema existe
        const temasDisponiveis = this.getTemasDisponiveis();
        const tema = temasDisponiveis.find(t => t.id === config.tema?.id) || this.getTemaClassico();
        
        const configuracao: VisualizacaoConfig = {
          tema,
          personalizacao: config.personalizacao,
          modoEdicao: false // Sempre iniciar com modo edição desligado
        };
        
        this.configAtualSubject.next(configuracao);
        this.aplicarTema(tema);
      }
    } catch (error) {
      console.warn('Erro ao carregar configuração do dashboard:', error);
      this.configAtualSubject.next(this.getDefaultConfig());
    }
  }

  private salvarConfiguracao(): void {
    try {
      const config = this.configAtualSubject.value;
      const configParaSalvar = {
        tema: config.tema,
        personalizacao: config.personalizacao
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configParaSalvar));
    } catch (error) {
      console.warn('Erro ao salvar configuração do dashboard:', error);
    }
  }
}