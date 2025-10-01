# Configuração do Firestore

## 1. Regras de Segurança

No Firebase Console, vá em Firestore Database > Rules e configure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acesso aos dados do usuário logado
    match /despesas/{document} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.auth.uid != null;
    }
    
    match /entradas/{document} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.auth.uid != null;
    }
    
    match /anotacoes/{document} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.auth.uid != null;
    }
  }
}
```

## 2. Índices Necessários

Execute os seguintes comandos no terminal do Firebase CLI ou configure via Console:

### Para Despesas:
```bash
# Índice para consulta de despesas por usuário ordenadas por data de vencimento
Collection: despesas
Fields: userId (Ascending), dataVencimento (Ascending)
```

### Para Entradas:
```bash
# Índice para consulta de entradas por usuário ordenadas por data
Collection: entradas
Fields: userId (Ascending), data (Descending)
```

### Para Anotações:
```bash
# Índice para consulta de anotações por usuário ordenadas por data de criação
Collection: anotacoes
Fields: userId (Ascending), createdAt (Descending)
```

## 3. Como Criar os Índices

### Opção 1: Pelo Firebase Console
1. Vá para Firebase Console > Firestore Database > Indexes
2. Clique em "Create Index"
3. Configure cada índice conforme especificado acima

### Opção 2: Via Firebase CLI
1. Instale o Firebase CLI: `npm install -g firebase-tools`
2. Faça login: `firebase login`
3. Inicialize o projeto: `firebase init firestore`
4. Crie um arquivo `firestore.indexes.json` com o conteúdo abaixo:

```json
{
  "indexes": [
    {
      "collectionGroup": "despesas",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "dataVencimento",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "entradas",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "data",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "anotacoes",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

5. Deploy os índices: `firebase deploy --only firestore:indexes`

## 4. URLs dos Erros para Criação Automática

Quando os erros aparecerem no console, você pode clicar nos links para criar automaticamente os índices:

- Para despesas: `https://console.firebase.google.com/project/financeiro-a-56bd0/firestore/indexes`
- Para entradas: (mesmo link acima)
- Para anotações: (mesmo link acima)

## Status Atual

✅ Regras de segurança temporárias removidas (orderBy removido das consultas)
⚠️ Ordenação sendo feita no frontend temporariamente
📋 Necessário configurar índices para melhor performance