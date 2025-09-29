import { Component, Input, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { DespesaPorCategoria } from '../../models/despesa.model';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss'
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() despesasPorCategoria: DespesaPorCategoria[] = [];
  @Input() chartType: ChartType = 'pie';

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  ngOnChanges(): void {
    if (this.chart) {
      this.updateChart();
    }
  }

  private createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.prepareChartData();
    
    const config: ChartConfiguration = {
      type: this.chartType,
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Vamos usar nossa própria legenda
          },
          title: {
            display: true,
            text: 'Distribuição de Despesas',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#333'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const categoria = this.despesasPorCategoria[context.dataIndex];
                const valor = new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(categoria.valor);
                const percentual = categoria.percentual.toFixed(1);
                return `${categoria.categoria.nome}: ${valor} (${percentual}%)`;
              }
            }
          }
        },
        elements: {
          arc: {
            borderWidth: 2,
            borderColor: '#fff'
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart) return;

    const data = this.prepareChartData();
    this.chart.data = data;
    this.chart.update();
  }

  private prepareChartData() {
    const labels = this.despesasPorCategoria.map(item => item.categoria.nome);
    const valores = this.despesasPorCategoria.map(item => item.valor);
    const cores = this.despesasPorCategoria.map(item => item.categoria.cor);

    return {
      labels: labels,
      datasets: [{
        data: valores,
        backgroundColor: cores,
        borderColor: cores.map(cor => this.darkenColor(cor, 0.1)),
        borderWidth: 2,
        hoverBackgroundColor: cores.map(cor => this.lightenColor(cor, 0.1)),
        hoverBorderColor: cores.map(cor => this.darkenColor(cor, 0.2)),
        hoverBorderWidth: 3
      }]
    };
  }

  private darkenColor(color: string, amount: number): string {
    const colorWithoutHash = color.replace('#', '');
    const num = parseInt(colorWithoutHash, 16);
    const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
    const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * amount));
    const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  private lightenColor(color: string, amount: number): string {
    const colorWithoutHash = color.replace('#', '');
    const num = parseInt(colorWithoutHash, 16);
    const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(255 * amount));
    const b = Math.min(255, (num & 0x0000FF) + Math.round(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  formatarMoedaTotal(): string {
    const total = this.despesasPorCategoria.reduce((sum, categoria) => sum + categoria.valor, 0);
    return this.formatarMoeda(total);
  }
}
