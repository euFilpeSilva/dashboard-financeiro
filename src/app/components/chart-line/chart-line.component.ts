import { Component, Input, AfterViewInit, ViewChild, ElementRef, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DadosMensais } from '../../models/despesa.model';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-line',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-line.component.html',
  styleUrls: ['./chart-line.component.scss']
})
export class ChartLineComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() dadosMensais: DadosMensais[] = [];
  @Input() projection?: number | null = null; // optional projection value to render as an extra datapoint

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    setTimeout(() => this.createOrUpdate(), 0);
  }

  ngOnChanges(): void {
    if (this.chart) this.updateChart();
    else setTimeout(() => this.createOrUpdate(), 0);
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
  }

  private createOrUpdate(): void {
    if (this.chart) { this.updateChart(); return; }
    if (!this.chartCanvas || !this.chartCanvas.nativeElement) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: this.prepareData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(30,35,55,0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed.y as number;
                return `Saldo: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}`;
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
          y: { ticks: { color: '#94a3b8', callback: (v) => 'R$ ' + Number(v).toLocaleString('pt-BR') }, grid: { color: '#334155' } }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart) return;
    this.chart.data = this.prepareData();
    this.chart.update();
  }

  private prepareData() {
    const labels = (this.dadosMensais || []).map(d => d.descricao);
    const data = (this.dadosMensais || []).map(d => d.saldo);
    // If a projection is provided, append a label and projection value to show as an estimated point
    const labelsWithProjection = [...labels];
    const dataWithProjection = [...data];
    if (typeof this.projection === 'number') {
      labelsWithProjection.push('Estim.');
      dataWithProjection.push(this.projection);
    }
    const lineColor = '#60a5fa';
    const bg = 'rgba(59,130,246,0.12)';

    return {
      labels: labelsWithProjection,
      datasets: [
        {
          label: 'Saldo',
          data: dataWithProjection,
          borderColor: lineColor,
          backgroundColor: bg,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: lineColor,
          borderWidth: 2,
          fill: true
        },
        // If projection exists, add a dashed dataset to visually indicate projection between last actual and estimate
        ...(typeof this.projection === 'number' && data.length > 0 ? [{
          label: 'Projeção',
          data: (() => {
            // Create an array of same length filled with null except last two points: previous last and projection
            const arr = new Array(labelsWithProjection.length).fill(null);
            const lastIndex = dataWithProjection.length - 1;
            // place a small connector from previous actual (index last-1) to projection (lastIndex)
            if (lastIndex >= 1) {
              arr[lastIndex - 1] = dataWithProjection[lastIndex - 1];
              arr[lastIndex] = dataWithProjection[lastIndex];
            }
            return arr;
          })(),
          borderColor: '#f59e0b',
          borderDash: [6, 6],
          pointRadius: 0,
          borderWidth: 2,
          fill: false
        }] : [])
      ]
    };
  }
}
