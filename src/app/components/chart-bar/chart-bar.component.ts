import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { DespesaService } from '../../services/despesa.service';
import { GraficoBarra } from '../../models/despesa.model';
import { Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-bar.component.html',
  styleUrl: './chart-bar.component.scss'
})
export class ChartBarComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private chart?: Chart;
  private subscription?: Subscription;

  constructor(private despesaService: DespesaService) {}

  ngOnInit(): void {
    this.carregarGrafico();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private carregarGrafico(): void {
    this.subscription = this.despesaService.getGraficoComparativo().subscribe({
      next: (dadosGrafico: GraficoBarra) => {
        this.criarGrafico(dadosGrafico);
      },
      error: (erro) => {
        console.error('Erro ao carregar dados do gráfico:', erro);
      }
    });
  }

  private criarGrafico(dados: GraficoBarra): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const configuracao: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: dados.labels,
        datasets: dados.datasets.map(dataset => ({
          ...dataset,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#ffffff',
              font: {
                size: 12,
                family: 'Segoe UI'
              },
              usePointStyle: true,
              pointStyle: 'rect'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(30, 35, 55, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#374151',
            borderWidth: 1,
            cornerRadius: 8,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 12
            },
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.raw as number;
                return `${label}: R$ ${value.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: '#374151',
              lineWidth: 1
            },
            ticks: {
              color: '#94a3b8',
              font: {
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#374151',
              lineWidth: 1
            },
            ticks: {
              color: '#94a3b8',
              font: {
                size: 11
              },
              callback: function(value) {
                return 'R$ ' + Number(value).toLocaleString('pt-BR');
              }
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    };

    this.chart = new Chart(ctx, configuracao);
  }
}
