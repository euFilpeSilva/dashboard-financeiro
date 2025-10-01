import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="theme-selector">
      <select [(ngModel)]="currentTheme" (change)="onThemeChange($event)" class="theme-select">
        <option value="claro">☀️ Claro</option>
        <option value="escuro">🌙 Escuro</option>
        <option value="compacto">📱 Compacto</option>
      </select>
    </div>
  `,
  styles: [`
    .theme-selector {
      display: inline-block;
    }
    
    .theme-select {
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 14px;
      cursor: pointer;
      min-width: 140px;
    }
    
    .theme-select:focus {
      outline: none;
      border-color: var(--color-blue);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
  `]
})
export class ThemeSelectorComponent implements OnInit {
  currentTheme = 'escuro';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.currentTheme = this.themeService.temaAtual;
    
    this.themeService.temaAtual$.subscribe(tema => {
      this.currentTheme = tema;
    });
  }

  onThemeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.currentTheme = select.value;
    this.themeService.alterarTema(this.currentTheme);
  }
}