// Configuração do Firebase
// IMPORTANTE: Substitua pelos valores do seu projeto Firebase
// First, attempt to read runtime config injected into window.__env (created by index.html loader).
declare const window: any;

const runtime = (typeof window !== 'undefined' && window.__env) ? window.__env : null;

export const firebaseConfig = runtime && runtime.firebase ? runtime.firebase : {
  apiKey: 'REPLACE_WITH_RUNTIME_ENV',
  authDomain: 'REPLACE_WITH_RUNTIME_ENV',
  projectId: 'REPLACE_WITH_RUNTIME_ENV',
  storageBucket: 'REPLACE_WITH_RUNTIME_ENV',
  messagingSenderId: 'REPLACE_WITH_RUNTIME_ENV',
  appId: 'REPLACE_WITH_RUNTIME_ENV',
  measurementId: 'REPLACE_WITH_RUNTIME_ENV'
};

// Configurações específicas do Firestore
export const firestoreConfig = {
  enablePersistence: true,
  cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache
  ignoreUndefinedProperties: true
};

// Configurações de autenticação
export const authConfig = {
  persistence: 'local' as const,
  enableEmailVerification: true,
  enablePasswordReset: true
};