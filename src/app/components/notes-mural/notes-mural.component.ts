import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Anotacao {
  id: string;
  texto: string;
  dataHora: Date;
  cor?: string;
}

@Component({
  selector: 'app-notes-mural',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes-mural.component.html',
  styleUrls: ['./notes-mural.component.scss']
})
export class NotesMuralComponent implements OnInit {
  anotacoes: Anotacao[] = [];
  novaAnotacao: string = '';
  editandoAnotacao: string | null = null;
  textoEdicao: string = '';
  mostrarMuralAnotacoes: boolean = true;

  ngOnInit(): void {
    const muralVisivel = localStorage.getItem('dashboard-mural-visivel');
    if (muralVisivel !== null) {
      this.mostrarMuralAnotacoes = muralVisivel === 'true';
    }
    this.carregarAnotacoes();
  }

  private carregarAnotacoes(): void {
    const anotacoesSalvas = localStorage.getItem('dashboard-anotacoes');
    if (anotacoesSalvas) {
      try {
        this.anotacoes = JSON.parse(anotacoesSalvas).map((anotacao: any) => ({
          ...anotacao,
          dataHora: new Date(anotacao.dataHora)
        }));
      } catch (error) {
        console.error('Erro ao carregar anotações:', error);
        this.anotacoes = [];
      }
    }
  }

  private salvarAnotacoes(): void {
    localStorage.setItem('dashboard-anotacoes', JSON.stringify(this.anotacoes));
  }

  adicionarAnotacao(): void {
    if (this.novaAnotacao.trim()) {
      const nova: Anotacao = {
        id: this.gerarIdUnico(),
        texto: this.novaAnotacao.trim(),
        dataHora: new Date(),
        cor: this.obterCorAleatoria()
      };
      this.anotacoes.unshift(nova);
      this.novaAnotacao = '';
      this.salvarAnotacoes();
    }
  }

  iniciarEdicao(anotacao: Anotacao): void {
    this.editandoAnotacao = anotacao.id;
    this.textoEdicao = anotacao.texto;
  }

  cancelarEdicao(): void {
    this.editandoAnotacao = null;
    this.textoEdicao = '';
  }

  salvarEdicao(): void {
    if (this.editandoAnotacao && this.textoEdicao.trim()) {
      const anot = this.anotacoes.find(a => a.id === this.editandoAnotacao);
      if (anot) {
        anot.texto = this.textoEdicao.trim();
        this.salvarAnotacoes();
      }
    }
    this.cancelarEdicao();
  }

  removerAnotacao(id: string): void {
    if (confirm('Tem certeza que deseja remover esta anotação?')) {
      this.anotacoes = this.anotacoes.filter(a => a.id !== id);
      this.salvarAnotacoes();
    }
  }

  toggleMuralAnotacoes(): void {
    this.mostrarMuralAnotacoes = !this.mostrarMuralAnotacoes;
    localStorage.setItem('dashboard-mural-visivel', this.mostrarMuralAnotacoes.toString());
  }

  private gerarIdUnico(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private obterCorAleatoria(): string {
    const cores = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#10AC84', '#EE5A24', '#0FB9B1', '#3742FA', '#F79F1F'
    ];
    return cores[Math.floor(Math.random() * cores.length)];
  }

  formatarDataHora(dataHora: Date): string {
    const agora = new Date();
    const diferenca = agora.getTime() - dataHora.getTime();
    const minutos = Math.floor(diferenca / (1000 * 60));
    const horas = Math.floor(diferenca / (1000 * 60 * 60));
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Agora';
    if (minutos < 60) return `${minutos}min atrás`;
    if (horas < 24) return `${horas}h atrás`;
    if (dias < 7) return `${dias}d atrás`;

    return dataHora.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByAnotacao(index: number, anotacao: Anotacao): string {
    return anotacao.id;
  }
}
