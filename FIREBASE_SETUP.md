# 🔥 Configuração do Firebase - Dashboard Financeiro

## 📋 Pré-requisitos
- Conta no Google/Firebase
- Projeto Angular configurado
- Node.js e npm instalados

## 🚀 Passo a Passo para Configurar Firebase

### 1. Criar Projeto no Firebase Console

1. **Acesse o Firebase Console**: https://console.firebase.google.com/
2. **Clique em "Criar um projeto"**
3. **Nome do projeto**: `dashboard-financeiro` (ou nome de sua escolha)
4. **Ative o Google Analytics** (opcional)
5. **Clique em "Criar projeto"**

### 2. Configurar Aplicação Web

1. **No Console do Firebase**, clique no ícone `</>` para adicionar app web
2. **Nome do app**: `Dashboard Financeiro Web`
3. **NÃO marque** "Configurar Firebase Hosting" (por enquanto)
4. **Clique em "Registrar app"**
5. **Copie a configuração** fornecida (objeto `firebaseConfig`)

### 3. Configurar Authentication

1. **No menu lateral**, vá para `Authentication > Get started`
2. **Na aba "Sign-in method"**, habilite:
   - ✅ **Email/Password**
   - ✅ **Google** (opcional, mas recomendado)
3. **Para Google Sign-in**:
   - Adicione seu email como usuário de teste
   - Configure a tela de consentimento OAuth

### 4. Configurar Firestore Database

1. **No menu lateral**, vá para `Firestore Database > Create database`
2. **Escolha o modo**: `Start in test mode` (alteraremos depois)
3. **Localização**: `southamerica-east1 (São Paulo)` ou região mais próxima
4. **Clique em "Done"**

### 5. Configurar Storage (Opcional)

1. **No menu lateral**, vá para `Storage > Get started`
2. **Aceite as regras padrão** (alteraremos depois)
3. **Escolha a mesma localização** do Firestore

### 6. Atualizar Configuração Local

1. **Abra o arquivo**: `src/environments/firebase.config.ts`
2. **Substitua a configuração** pela fornecida no Console do Firebase:

```typescript
export const firebaseConfig = {
  apiKey: "sua-api-key-real",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};
```

### 7. Regras de Segurança Firestore

**Substitua as regras do Firestore** por estas regras de segurança:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para despesas
    match /despesas/{despesaId} {
      allow read, write, delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
    }
    
    // Regras para anotações
    match /anotacoes/{anotacaoId} {
      allow read, write, delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
    }
    
    // Regras para perfis de usuário (futuro)
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}
```

### 8. Regras de Segurança Storage

**Substitua as regras do Storage** por estas:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}
```

## 🧪 Testando a Integração

### 1. Iniciar a Aplicação
```bash
npm start
```

### 2. Primeira Execução
1. **Acesse**: http://localhost:4200
2. **Será redirecionado** para `/login`
3. **Crie uma conta** com email/senha
4. **Será redirecionado** para `/dashboard`

### 3. Verificar Firestore
1. **No Console do Firebase** > Firestore Database
2. **Deve aparecer** a coleção `despesas` (quando criar uma despesa)
3. **Deve aparecer** a coleção `anotacoes` (quando criar uma anotação)

## 🔄 Migração de Dados Locais

A aplicação possui migração automática dos dados do localStorage para o Firestore:

1. **Primeiro login** → Migração automática executada
2. **Dados locais** são transferidos para Firestore
3. **localStorage é limpo** após migração bem-sucedida

## 🛠️ Comandos Úteis

### Instalar Firebase CLI (Opcional)
```bash
npm install -g firebase-tools
firebase login
firebase init
```

### Verificar Configuração
```bash
# No console do navegador (F12)
console.log('Firebase inicializado:', firebase.apps.length > 0);
```

## 📱 Recursos Implementados

### ✅ Autenticação
- [x] Login com email/senha
- [x] Registro de novos usuários
- [x] Login com Google
- [x] Recuperação de senha
- [x] Guards de rota
- [x] Gerenciamento de estado

### ✅ Firestore
- [x] CRUD de despesas
- [x] CRUD de anotações
- [x] Sincronização em tempo real
- [x] Dados por usuário
- [x] Migração automática

### ✅ Segurança
- [x] Regras de segurança Firestore
- [x] Autenticação obrigatória
- [x] Isolamento de dados por usuário

## 🎯 Próximos Passos

1. **Testar todas as funcionalidades**
2. **Configurar produção** (regras mais restritivas)
3. **Implementar backup/export**
4. **Adicionar notificações push**
5. **Implementar analytics**

## 🆘 Solução de Problemas

### Erro de CORS
- Verificar domínio autorizado no Firebase Console
- Adicionar `localhost:4200` nos domínios autorizados

### Erro de Permissão Firestore
- Verificar regras de segurança
- Confirmar autenticação do usuário
- Verificar estrutura dos documentos

### Erro de Autenticação
- Verificar configuração do `firebaseConfig`
- Confirmar métodos de login habilitados
- Verificar configuração OAuth (se usando Google)

---

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs do console (F12)
2. Verificar Console do Firebase > Authentication/Firestore
3. Revisar regras de segurança
4. Confirmar configuração da aplicação