import { firebaseConfig } from './firebase.config';

export const environment = {
  production: false,
  firebase: firebaseConfig,
  appName: 'Dashboard Financeiro',
  version: '1.0.0',
  enableDebug: true,
  enableAnalytics: false
};