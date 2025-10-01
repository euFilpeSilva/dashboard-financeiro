// Configuração do Firebase
// IMPORTANTE: Substitua pelos valores do seu projeto Firebase
export const firebaseConfig = {
  apiKey: "sua-api-key-aqui",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
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