import { Component } from '@angular/core';import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';import { CommonModule } from '@angular/common';

import { DashboardLayoutService } from '../../services/dashboard-layout.service';

@Component({import { DashboardTheme } from '../../models/despesa.model';

  selector: 'app-theme-selector',

  standalone: true,@Component({

  imports: [CommonModule],  selector: 'app-theme-selector',

  template: `  standalone: true,

    <div class="theme-selector">  imports: [CommonModule],

      <label for="theme-select">Tema:</label>  templateUrl: './theme-selector.component.html',

      <select id="theme-select" (change)="onThemeChange($event)" [value]="currentTheme">  styleUrl: './theme-selector.component.scss'

        <option value="classico">🎨 Clássico</option>})

        <option value="compacto">📱 Compacto</option>export class ThemeSelectorComponent implements OnInit {

        <option value="customizavel">⚙️ Customizável</option>  themes: DashboardTheme[] = [];

      </select>  currentTheme: DashboardTheme | null = null;

    </div>  isOpen = false;

  `,

  styles: [`  constructor(private layoutService: DashboardLayoutService) {}

    .theme-selector {

      display: flex;  ngOnInit(): void {

      align-items: center;    this.themes = this.layoutService.getDefaultThemes();

      gap: 8px;    

      font-size: 14px;    this.layoutService.currentTheme$.subscribe(theme => {

    }      this.currentTheme = theme;

    });

    label {  }

      font-weight: 500;

      color: #374151;  toggleSelector(): void {

    }    this.isOpen = !this.isOpen;

  }

    select {

      padding: 6px 12px;  selectTheme(theme: DashboardTheme): void {

      border: 1px solid #d1d5db;    this.layoutService.setTheme(theme);

      border-radius: 6px;    this.isOpen = false;

      background: white;  }

      font-size: 14px;

      cursor: pointer;  resetLayout(): void {

      min-width: 140px;    this.layoutService.resetLayout();

    }    this.isOpen = false;

  }

    select:focus {}

      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
    }
  `]
})
export class ThemeSelectorComponent {
  currentTheme = 'classico';

  onThemeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.currentTheme = select.value;
    this.applyTheme(this.currentTheme);
  }

  private applyTheme(theme: string): void {
    // Remove classes de tema anteriores
    document.body.className = document.body.className.replace(/tema-\w+/g, '');
    document.body.classList.add(`tema-${theme}`);

    // Aplica variáveis CSS
    const root = document.documentElement;
    
    switch (theme) {
      case 'compacto':
        root.style.setProperty('--tema-cor-primaria', '#2563eb');
        root.style.setProperty('--tema-espacamento', '8px');
        root.style.setProperty('--tema-borda-radius', '4px');
        break;
      case 'classico':
        root.style.setProperty('--tema-cor-primaria', '#059669');
        root.style.setProperty('--tema-espacamento', '16px');
        root.style.setProperty('--tema-borda-radius', '8px');
        break;
      case 'customizavel':
        root.style.setProperty('--tema-cor-primaria', '#7c3aed');
        root.style.setProperty('--tema-espacamento', '12px');
        root.style.setProperty('--tema-borda-radius', '6px');
        break;
    }

    // Salva no localStorage
    localStorage.setItem('dashboard-tema', theme);
  }
}