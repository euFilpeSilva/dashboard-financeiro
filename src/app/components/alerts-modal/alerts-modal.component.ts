import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumoDashboard, Despesa } from '../../models/despesa.model';

@Component({
  selector: 'app-alerts-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts-modal.component.html',
  styleUrls: ['./alerts-modal.component.scss']
})
export class AlertsModalComponent implements OnInit, OnDestroy {
  @Input() despesasVencidas: Despesa[] = [];
  @Input() despesasProximasVencimento: Despesa[] = [];
  @Input() gastoMetaPercentualGeral: number = 100;
  @Input() gastoMetaPercentualMensal: number = 100;
  @Input() gastoMetaMesReferencia: string = '';
  @Input() resumo: ResumoDashboard | null = null;
  @Input() metaPercentUsed: number | null = null;
  @Input() metaMesPercentUsed: number | null = null;

  @Output() close = new EventEmitter<void>();

  private escUnlisten: (() => void) | null = null;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    // Listen to ESC to close modal
    this.escUnlisten = this.renderer.listen('window', 'keydown', (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' || ev.key === 'Esc') {
        this.onClose();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.escUnlisten) {
      try { this.escUnlisten(); } catch (e) { /* ignore */ }
      this.escUnlisten = null;
    }
  }

  onClose(): void {
    this.close.emit();
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }
}
