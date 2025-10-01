import { firebaseConfig } from './firebase.config';

export const environment = {
  production: true,
  firebase: firebaseConfig,
  appName: 'Dashboard Financeiro',
  version: '1.0.0',
  enableDebug: false,
  enableAnalytics: true
};