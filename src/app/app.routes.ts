import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/auth/login.component';
import { GestaoComponent } from './components/gestao/gestao.component';
import { AuthGuard, RedirectAuthenticatedGuard } from './guards/auth.guard';

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
    path: '**',
    redirectTo: '/dashboard'
  }
];
