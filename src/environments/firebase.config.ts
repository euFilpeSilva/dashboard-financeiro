// Configuração do Firebase
// IMPORTANTE: Substitua pelos valores do seu projeto Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyAIvqp1MZ1r7guz3ABcCRk-3Gq7zLUBOsQ",
  authDomain: "financeiro-app-64391.firebaseapp.com",
  projectId: "financeiro-app-64391",
  storageBucket: "financeiro-app-64391.firebasestorage.app",
  messagingSenderId: "213152588465",
  appId: "1:213152588465:web:a84fc2a937ae8876013890",
  measurementId: "G-M1LBJCDGZD"
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