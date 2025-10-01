import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DashboardTheme, DashboardCard, LayoutPersonalizacao, VisualizacaoConfig } from '../models/tema.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardLayoutService {
  private readonly THEME_KEY = 'dashboard-current-theme';
  private readonly STORAGE_KEY = 'dashboard-layout-config';

  private temaAtualSubject = new BehaviorSubject<string>('escuro');
  private configAtualSubject = new BehaviorSubject<VisualizacaoConfig>(this.getDefaultConfig());

  public temaAtual$ = this.temaAtualSubject.asObservable();
  public configAtual$ = this.configAtualSubject.asObservable();

  constructor() {
    this.carregarConfiguracao();
  }

  private carregarConfiguracao(): void {
    const temaSalvo = localStorage.getItem(this.THEME_KEY);
    if (temaSalvo) {
      this.temaAtualSubject.next(temaSalvo);
      this.aplicarTema(temaSalvo);
    }

    const configSalva = localStorage.getItem(this.STORAGE_KEY);
    if (configSalva) {
      try {
        const config = JSON.parse(configSalva);
        this.configAtualSubject.next(config);
      } catch (error) {
        console.warn('Erro ao carregar configuração salva:', error);
      }
    }
  }

  getTemasDisponiveis() {
    return [
      { id: 'claro', nome: 'Claro', descricao: 'Tema claro e suave' },
      { id: 'escuro', nome: 'Escuro', descricao: 'Tema escuro moderno' },
      { id: 'compacto', nome: 'Compacto', descricao: 'Layout otimizado' },
      { id: 'classico', nome: 'Clássico', descricao: 'Layout tradicional' },
      { id: 'customizavel', nome: 'Customizável', descricao: 'Layout flexível' }
    ];
  }

  alterarTema(temaId: string): void {
    this.temaAtualSubject.next(temaId);
    this.salvarTema(temaId);
    this.aplicarTema(temaId);
  }

  private aplicarTema(temaId: string): void {
    const body = document.body;
    body.classList.remove('tema-claro', 'tema-escuro', 'tema-compacto', 'tema-classico');
    body.classList.add(`tema-${temaId}`);
  }

  private salvarTema(temaId: string): void {
    localStorage.setItem(this.THEME_KEY, temaId);
  }

  getDefaultConfig(): VisualizacaoConfig {
    return {
      tema: {
        id: 'escuro',
        nome: 'Escuro',
        descricao: 'Tema escuro moderno',
        tipo: 'classico',
        estilos: {
          corPrimaria: '#2196f3',
          corSecundaria: '#1976d2',
          corFundo: '#1a1a1a',
          corTexto: '#ffffff',
          corBorda: '#333333',
          bordaRadius: '8px',
          espacamento: 'medio',
          fonte: {
            familia: 'Roboto, sans-serif',
            tamanho: 'medio'
          }
        },
        layout: {
          colunas: 3,
          espacamentoCards: 16,
          alturaHeader: 64,
          layoutType: 'grid'
        },
        cards: []
      },
      modoEdicao: false
    };
  }

  atualizarConfig(novaConfig: Partial<VisualizacaoConfig>): void {
    const configAtual = this.configAtualSubject.value;
    const configAtualizada = { ...configAtual, ...novaConfig };
    
    this.configAtualSubject.next(configAtualizada);
    this.salvarConfig(configAtualizada);
  }

  private salvarConfig(config: VisualizacaoConfig): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  }

  resetarConfig(): void {
    const configDefault = this.getDefaultConfig();
    this.configAtualSubject.next(configDefault);
    this.salvarConfig(configDefault);
  }

  toggleCardVisibilidade(cardId: string): void {
    const configAtual = this.configAtualSubject.value;
    const cardsAtualizados = configAtual.tema.cards.map(card => 
      card.id === cardId ? { ...card, visivel: !card.visivel } : card
    );
    
    this.atualizarConfig({ 
      tema: { 
        ...configAtual.tema, 
        cards: cardsAtualizados 
      }
    });
  }

  alterarModoEdicao(ativo: boolean): void {
    this.atualizarConfig({ modoEdicao: ativo });
  }

  alterarTemaEstilo(estilos: Partial<DashboardTheme['estilos']>): void {
    const configAtual = this.configAtualSubject.value;
    this.atualizarConfig({ 
      tema: { 
        ...configAtual.tema, 
        estilos: { ...configAtual.tema.estilos, ...estilos }
      }
    });
  }

  getLayoutsDisponiveis() {
    return [
      { id: 'grid', nome: 'Grade', descricao: 'Layout em grade responsiva' },
      { id: 'lista', nome: 'Lista', descricao: 'Layout em lista vertical' },
      { id: 'compacto', nome: 'Compacto', descricao: 'Layout compacto' }
    ];
  }

  exportarConfiguracao(): string {
    const config = {
      tema: this.temaAtualSubject.value,
      configuracao: this.configAtualSubject.value
    };
    return JSON.stringify(config, null, 2);
  }

  importarConfiguracao(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      
      if (config.tema) {
        this.alterarTema(config.tema);
      }
      
      if (config.configuracao) {
        this.atualizarConfig(config.configuracao);
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao importar configuração:', error);
      return false;
    }
  }
}