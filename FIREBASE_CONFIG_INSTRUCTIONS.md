# Instruções de Configuração do Firebase

## 🔥 URGENTE: Configurar Regras de Segurança do Firestore

### 1. Acesse o Firebase Console
1. Vá para https://console.firebase.google.com
2. Selecione seu projeto
3. No menu lateral, clique em **"Firestore Database"**
4. Clique na aba **"Rules"** (Regras)

### 2. Configure as Regras de Segurança
Substitua as regras existentes por estas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para despesas
    match /despesas/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Regras para entradas
    match /entradas/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Regras para anotações
    match /anotacoes/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 3. Criar Índices Necessários

#### Ir para Índices:
1. Na mesma tela do Firestore, clique na aba **"Indexes"** (Índices)
2. Clique em **"Create Index"** (Criar Índice)

#### Criar os seguintes índices:

**Índice 1 - Despesas por usuário e data:**
- Collection ID: `despesas`
- Fields:
  - `userId` (Ascending)
  - `dataVencimento` (Descending)
- Query scopes: Collection

**Índice 2 - Entradas por usuário e data:**
- Collection ID: `entradas`
- Fields:
  - `userId` (Ascending)
  - `data` (Descending)
- Query scopes: Collection

**Índice 3 - Despesas por usuário e valor:**
- Collection ID: `despesas`
- Fields:
  - `userId` (Ascending)
  - `valor` (Descending)
- Query scopes: Collection

**Índice 4 - Entradas por usuário e valor:**
- Collection ID: `entradas`
- Fields:
  - `userId` (Ascending)
  - `valor` (Descending)
- Query scopes: Collection

### 4. Aguardar Propagação
- Depois de criar os índices, aguarde alguns minutos para que sejam construídos
- Os índices aparecerão com status "Building" e depois "Enabled"

### 5. Verificar Authentication
1. No menu lateral, clique em **"Authentication"**
2. Verifique se o método de login por email/senha está habilitado
3. Confirme se há usuários cadastrados

## 🚨 Passos Críticos:
1. **CONFIGURAR AS REGRAS** (mais importante)
2. **CRIAR OS ÍNDICES** 
3. **AGUARDAR PROPAGAÇÃO**

Após fazer essas configurações, a aplicação deve funcionar corretamente!