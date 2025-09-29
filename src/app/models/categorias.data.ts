import { Categoria } from './despesa.model';

export const CATEGORIAS_PADRAO: Categoria[] = [
  { id: '1', nome: 'Parcela Moto', cor: '#FF6384', icon: '🏍️' },
  { id: '2', nome: 'Fatura Nubank', cor: '#36A2EB', icon: '💳' },
  { id: '3', nome: 'Fatura Inter', cor: '#FFCE56', icon: '🏦' },
  { id: '4', nome: 'Parcela Consórcio', cor: '#4BC0C0', icon: '🚗' },
  { id: '5', nome: 'Seguro Moto', cor: '#9966FF', icon: '🛡️' },
  { id: '6', nome: 'Pós-graduação', cor: '#FF9F40', icon: '🎓' },
  { id: '7', nome: 'Internet Fixa', cor: '#FF6384', icon: '🌐' },
  { id: '8', nome: 'Outros', cor: '#C9CBCF', icon: '📦' }
];

export const CORES_GRAFICOS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
  '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
];