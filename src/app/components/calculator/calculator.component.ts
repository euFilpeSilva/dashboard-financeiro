import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss']
})
export class CalculatorComponent implements AfterViewInit, OnDestroy {
  // Standard calculator state
  expr: string = '';
  result: string = '';

  // Compound interest state
  principal: number | null = null;
  annualRate: number | null = null; // percent
  periodsPerYear: number = 12;
  years: number | null = null;
  periodicContribution: number | null = 0; // optional contribution per period
  compoundResult: {
    futureValue: number;
    totalContributed: number;
    interestEarned: number;
  } | null = null;

  // UI
  activeTab: 'standard' | 'compound' = 'standard';

  // history
  historyKey = 'calculator-history-v1';
  history: Array<any> = [];

  // chart
  @ViewChild('compoundChart', { static: false }) compoundChartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;
  chartDataPoints: number[] = [];
  chartLabels: string[] = [];

  // --- Standard calculator methods ---
  append(value: string) {
    // allow only digits, operators and parentheses and dot
    const allowed = /[0-9+\-*/(). ]/;
    if (value.split('').every(ch => allowed.test(ch))) {
      this.expr += value;
    }
  }

  clear() {
    this.expr = '';
    this.result = '';
  }

  backspace() {
    this.expr = this.expr.slice(0, -1);
  }

  evaluate() {
    const sanitized = this.expr.replace(/[^0-9+\-*/(). ]/g, '');
    if (!sanitized) {
      this.result = '';
      return;
    }
    try {
      // Use Function to evaluate safely after sanitization
      // (we've removed any chars except digits and math ops)
      // eslint-disable-next-line no-new-func
      const val = new Function(`return (${sanitized});`)();
      if (typeof val === 'number' && isFinite(val)) {
        this.result = this.formatNumber(val);
      } else {
        this.result = 'Erro';
      }
    } catch (e) {
      this.result = 'Erro';
    }

    // save to history
    if (this.result && this.result !== 'Erro') {
      this.pushHistory({ type: 'standard', expr: sanitized, result: this.result, timestamp: Date.now() });
    }
  }

  formatNumber(v: number) {
    // Format using pt-BR locale with up to 2 decimals when needed
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v);
  }

  // --- Compound interest methods ---
  calculateCompound() {
    // Validate inputs
    if (this.principal == null || this.annualRate == null || this.years == null) {
      this.compoundResult = null;
      return;
    }

    const P = Number(this.principal);
    const r = Number(this.annualRate) / 100; // convert percent to decimal
    const n = Number(this.periodsPerYear) || 1;
    const t = Number(this.years);
    const PMT = Number(this.periodicContribution) || 0; // contribution per period

    // Compound formula with periodic contributions (future value of a series)
    // FV = P*(1 + r/n)^(n*t) + PMT * [((1 + r/n)^(n*t) - 1) / (r/n)]
    const base = 1 + r / n;
    const exp = Math.pow(base, n * t);
    const fvPrincipal = P * exp;
    let fvContrib = 0;
    if (PMT !== 0 && r !== 0) {
      fvContrib = PMT * ((exp - 1) / (r / n));
    } else if (PMT !== 0 && r === 0) {
      // when rate is 0, contributions just sum
      fvContrib = PMT * n * t;
    }

    const futureValue = fvPrincipal + fvContrib;
    const totalContributed = P + PMT * n * t;
    const interestEarned = futureValue - totalContributed;

    this.compoundResult = {
      futureValue: Math.round(futureValue * 100) / 100,
      totalContributed: Math.round(totalContributed * 100) / 100,
      interestEarned: Math.round(interestEarned * 100) / 100
    };

    // build period-by-period series
    const periods = n * t;
    const series: number[] = [];
    let balance = P;
    series.push(Math.round(balance * 100) / 100);
    for (let i = 1; i <= periods; i++) {
      balance = balance * base + PMT;
      series.push(Math.round(balance * 100) / 100);
    }
    this.chartDataPoints = series;
    this.chartLabels = series.map((_, idx) => `Per ${idx}`);
    this.updateChart();

    // save to history
    this.pushHistory({
      type: 'compound',
      inputs: { principal: P, annualRate: Number(this.annualRate), periodsPerYear: n, years: t, periodicContribution: PMT },
      result: this.compoundResult,
      series: series,
      timestamp: Date.now()
    });
  }

  resetCompound() {
    this.principal = null;
    this.annualRate = null;
    this.periodsPerYear = 12;
    this.years = null;
    this.periodicContribution = 0;
    this.compoundResult = null;
    this.destroyChart();
  }

  // --- history helpers ---
  ngOnInitHistory() {
    try {
      const raw = localStorage.getItem(this.historyKey);
      if (raw) this.history = JSON.parse(raw) || [];
    } catch (e) { this.history = []; }
  }

  pushHistory(item: any) {
    this.history = [item].concat(this.history).slice(0, 20);
    try { localStorage.setItem(this.historyKey, JSON.stringify(this.history)); } catch (e) { /* ignore */ }
  }

  clearHistory() {
    this.history = [];
    try { localStorage.removeItem(this.historyKey); } catch (e) { /* ignore */ }
  }

  // --- chart helpers ---
  ngAfterViewInit(): void {
    this.ngOnInitHistory();
  }

  private updateChart() {
    // create or update chart using chartDataPoints and chartLabels
    try {
      if (!this.compoundChartCanvas) return;
      const ctx = this.compoundChartCanvas.nativeElement.getContext('2d');
      if (!ctx) return;
      if (this.chart) {
        this.chart.data.labels = this.chartLabels;
        // @ts-ignore
        this.chart.data.datasets[0].data = this.chartDataPoints;
        this.chart.update();
        return;
      }
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.chartLabels,
          datasets: [{
            label: 'Saldo por período',
            data: this.chartDataPoints,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            fill: true,
            tension: 0.2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    } catch (e) {
      console.warn('Erro ao criar/atualizar gráfico', e);
    }
  }

  private destroyChart() {
    if (this.chart) {
      try { this.chart.destroy(); } catch (e) { /* ignore */ }
      this.chart = null;
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  /**
   * Keyboard handler so the user can type numbers/operators on the physical keyboard
   * Works only when the standard calculator tab is active and the focused element is not an input/textarea.
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    try {
      // don't intercept when user is typing in an input/textarea/contenteditable
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

      if (this.activeTab !== 'standard') return;

      const k = event.key;
      // digits
      if (/^[0-9]$/.test(k)) {
        this.append(k);
        event.preventDefault();
        return;
      }

      // operators and punctuation
      if (['+', '-', '*', '/', '.', '(', ')'].includes(k)) {
        this.append(k);
        event.preventDefault();
        return;
      }

      if (k === 'Enter') {
        this.evaluate();
        event.preventDefault();
        return;
      }

      if (k === 'Backspace') {
        this.backspace();
        event.preventDefault();
        return;
      }

      if (k === 'Escape') {
        this.clear();
        event.preventDefault();
        return;
      }
    } catch (e) {
      // swallow errors from keyboard handler
    }
  }
}
