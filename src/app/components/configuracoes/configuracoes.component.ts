import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserPreferencesService } from '../../services/user-preferences.service';
import { ToastService } from '../../services/toast.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.scss']
})
export class ConfiguracoesComponent implements OnInit, OnDestroy {
  gastoMetaPercentual: number = 100;
  gastoMetaPercentualMensal: number = 100;
  gastoMetaMesReferencia: string = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
  loading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private prefs: UserPreferencesService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    // Subscribe to preference so value is updated when loaded from Firestore
    this.prefs.getPreference$('gastoMetaPercentual')
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        if (v !== null && v !== undefined) {
          this.gastoMetaPercentual = v as number;
        }
      });

    this.prefs.getPreference$('gastoMetaPercentualMensal')
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        if (v !== null && v !== undefined) {
          this.gastoMetaPercentualMensal = v as number;
        }
      });

    this.prefs.getPreference$('gastoMetaMesReferencia')
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        if (v) this.gastoMetaMesReferencia = v as string;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async salvar(): Promise<void> {
    this.loading = true;
    try {
      // Update multiple preferences atomically
      await this.prefs.updateMultiplePreferences({
        gastoMetaPercentual: this.gastoMetaPercentual,
        gastoMetaPercentualMensal: this.gastoMetaPercentualMensal,
        gastoMetaMesReferencia: this.gastoMetaMesReferencia
      } as any);

      this.toast.success('Meta salva', `Metas salvas — Geral: ${this.gastoMetaPercentual}%, Mensal: ${this.gastoMetaPercentualMensal}% (${this.gastoMetaMesReferencia})`);
    } catch (err) {
      console.error('Erro ao salvar meta de gastos', err);
      this.toast.error('Erro', 'Não foi possível salvar a meta. Tente novamente.');
    } finally {
      this.loading = false;
    }
  }
}
