import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/auth/login.component';
import { GestaoComponent } from './components/gestao/gestao.component';
import { ConfiguracoesComponent } from './components/configuracoes/configuracoes.component';
import { AuthGuard, RedirectAuthenticatedGuard } from './guards/auth.guard';
import { CalculatorComponent } from './components/calculator/calculator.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [RedirectAuthenticatedGuard],
    title: 'Login - Dashboard Financeiro'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    title: 'Dashboard - Financeiro'
  },
  {
    path: 'gestao',
    component: GestaoComponent,
    canActivate: [AuthGuard],
    title: 'Gestão - Dashboard Financeiro'
  },
  {
    path: 'configuracoes',
    component: ConfiguracoesComponent,
    canActivate: [AuthGuard],
    title: 'Configurações'
  },
  {
    path: 'calculator',
    component: CalculatorComponent,
    canActivate: [AuthGuard],
    title: 'Calculadora'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
