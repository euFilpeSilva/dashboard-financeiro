# Como Limpar a Base de Dados do Firebase

## 🗑️ Método 1: Apagar Collections pelo Firebase Console (Recomendado)

### Passo a Passo:
1. **Acesse o Firebase Console**
   - Vá para https://console.firebase.google.com
   - Selecione seu projeto

2. **Navegar para Firestore**
   - No menu lateral, clique em **"Firestore Database"**
   - Clique na aba **"Data"**

3. **Apagar Collections**
   - Clique na collection que deseja apagar (`despesas`, `entradas`, `anotacoes`)
   - Clique no ícone de **três pontos (⋮)** ao lado do nome da collection
   - Selecione **"Delete collection"**
   - Confirme a exclusão digitando o nome da collection

### Collections para apagar:
- ✅ `despesas`
- ✅ `entradas` 
- ✅ `anotacoes`

## 🔄 Recriação Automática
- As collections serão **recriadas automaticamente** quando a aplicação tentar adicionar novos dados
- Os índices continuarão existindo e funcionando
- As regras de segurança permanecerão inalteradas

## ⚡ Método 2: Script de Limpeza (Opcional)

Se quiser automatizar, posso criar um script para limpar via código:

```typescript
// firebase-cleanup.ts
import { AngularFirestore } from '@angular/fire/compat/firestore';

async cleanupFirestore(firestore: AngularFirestore) {
  const collections = ['despesas', 'entradas', 'anotacoes'];
  
  for (const collectionName of collections) {
    const snapshot = await firestore.collection(collectionName).get().toPromise();
    const batch = firestore.firestore.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Collection ${collectionName} limpa`);
  }
}
```

## 🚨 Importante:
- ✅ **Método seguro**: Apagar pelo console é o método mais seguro
- ✅ **Sem problemas**: Collections são recriadas automaticamente
- ✅ **Índices preservados**: Os índices criados anteriormente continuarão existindo
- ✅ **Regras mantidas**: As regras de segurança não serão afetadas

## 🔍 Verificação após limpeza:
1. Faça login na aplicação
2. Tente criar uma nova despesa ou entrada
3. Verifique se os dados aparecem corretamente
4. As collections aparecerão novamente no Firebase Console

**Recomendação**: Use o método 1 (Firebase Console) por ser mais visual e seguro!