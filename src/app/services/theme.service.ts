import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Tema {
  id: string;
  nome: string;
  descricao: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private temaAtualSubject = new BehaviorSubject<string>('classico');
  public temaAtual$ = this.temaAtualSubject.asObservable();

  temasDisponiveis: Tema[] = [
    { id: 'compacto', nome: '📱 Compacto', descricao: 'Layout otimizado' },
    { id: 'classico', nome: '🎨 Clássico', descricao: 'Layout tradicional' },
    { id: 'customizavel', nome: '⚙️ Customizável', descricao: 'Layout flexível' }
  ];

  constructor() {
    this.carregarTema();
  }

  get temaAtual(): string {
    return this.temaAtualSubject.value;
  }

  alterarTema(temaId: string): void {
    if (this.temasDisponiveis.some(t => t.id === temaId)) {
      this.temaAtualSubject.next(temaId);
      this.aplicarTema(temaId);
      this.salvarTema(temaId);
    }
  }

  private aplicarTema(temaId: string): void {
    // Remove classes de tema anteriores
    document.body.className = document.body.className.replace(/tema-\w+/g, '');
    document.body.classList.add(`tema-${temaId}`);

    // Aplica variáveis CSS baseadas no tema
    const root = document.documentElement;
    
    switch (temaId) {
      case 'compacto':
        root.style.setProperty('--tema-cor-primaria', '#2563eb');
        root.style.setProperty('--tema-cor-secundaria', '#64748b');
        root.style.setProperty('--tema-espacamento', '8px');
        root.style.setProperty('--tema-borda-radius', '4px');
        root.style.setProperty('--tema-fonte-tamanho', '0.875rem');
        break;
      case 'classico':
        root.style.setProperty('--tema-cor-primaria', '#059669');
        root.style.setProperty('--tema-cor-secundaria', '#6b7280');
        root.style.setProperty('--tema-espacamento', '16px');
        root.style.setProperty('--tema-borda-radius', '8px');
        root.style.setProperty('--tema-fonte-tamanho', '1rem');
        break;
      case 'customizavel':
        root.style.setProperty('--tema-cor-primaria', '#7c3aed');
        root.style.setProperty('--tema-cor-secundaria', '#9ca3af');
        root.style.setProperty('--tema-espacamento', '12px');
        root.style.setProperty('--tema-borda-radius', '6px');
        root.style.setProperty('--tema-fonte-tamanho', '1rem');
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