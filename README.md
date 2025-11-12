# 💰 Dashboard Financeiro

Uma aplicação Angular 17 completa para gestão financeira pessoal com dashboard interativo, desenvolvida especificamente para controle de despesas, entradas e planejamento financeiro.

## 🚀 Funcionalidades Principais

### 📊 Dashboard Interativo
- **Cards de Resumo**: Visualização das entradas, saldo previsto e total de despesas
- **Período Atual**: Navegação por mês/ano
- **Gráficos Dinâmicos**: Distribuição de despesas por categoria usando Chart.js
- **Cálculos em Tempo Real**: Todos os valores são atualizados automaticamente

### 📋 Gestão de Despesas
- ✅ **Adicionar**: Nova despesa com categoria, valor, vencimento e prioridade
- ✏️ **Editar**: Modificar despesas existentes com formulário completo
- 🗑️ **Remover**: Excluir despesas com confirmação
```markdown
# 💰 Dashboard Financeiro

Uma aplicação Angular 17 para gestão financeira pessoal com foco em controle de despesas, alertas, metas e visualizações interativas.

---

## � Sumário
- Visão geral das features
- Instalação e execução
- Estrutura do projeto
- Configuração do Firebase (Auth/Firestore)
- Funcionalidades avançadas (Calculadora, Preferências, Alertas)
- Deploy e hosting
- Known issues e notas de desenvolvimento
- Contribuição

---

## 🚀 Funcionalidades Principais

Visão geral das funcionalidades implementadas nesta versão:

- � Dashboard interativo com cards e gráficos (Chart.js)
- 📋 Gestão completa de despesas (CRUD) com categorias, vencimentos e prioridades
- 🔔 Sistema de alertas: vencidas, próximas ao vencimento e metas mensais
- 🧮 Calculadora integrada (simples) + Calculadora de juros compostos com gráfico e histórico
- ⚙️ Preferências de usuário (tema, metas) persistidas no Firestore quando possível, com fallback para localStorage
- ♿ Melhorias de usabilidade: modal de alertas, suporte a teclado na calculadora e componentes responsivos

---

## 🛠️ Tecnologias

- Angular 17 (standalone components)
- TypeScript
- SCSS
- Chart.js (visualizações)
- Firebase (Auth, Firestore, Hosting)
- RxJS

---

## 📦 Instalação & Execução (desenvolvimento)

### Pré-requisitos
- Node.js 18+
- npm (ou yarn)
- Angular CLI 17 (opcional, o script npm já roda)

### Passos

```powershell
git clone <url-do-repositorio>
cd dashboard-financeiro
npm install
npm start
# ou
ng serve
```

Abra http://localhost:4200 no navegador.

Observação: o projeto inclui scripts úteis no `package.json`:

- `npm run build:prod` — build produção
- `npm run deploy` — build produção + deploy para Firebase Hosting (se configurado)

---

## 🔧 Configuração do Firebase

O projeto usa Firebase para Auth, Firestore e Hosting. Há arquivos de configuração no diretório `src/environments/` (`firebase.config.ts`) e instruções de setup no repositório (`FIREBASE_SETUP.md`, `FIREBASE_CONFIG_INSTRUCTIONS.md`).

Passos rápidos:

1. Crie um projeto no Firebase Console.
2. Configure Authentication (Email/Password ou provedores que preferir).
3. Crie uma coleção `user-preferences` e (opcionalmente) `auditLogs` no Firestore.
4. Atualize `src/environments/firebase.config.ts` com as credenciais do seu projeto.
5. Ajuste regras do Firestore para permitir leituras/escritas somente a usuários autenticados (recomendo revisar `FIRESTORE_SETUP.md`).

Se o Firestore recusar gravações de preferência (por regras), o app automáticamente usa um fallback em `localStorage` (chaves como `user-preferences-local-{uid}`).

---

## 🧭 Estrutura do Projeto (detalhada)

```
src/
├─ app/
│  ├─ components/
│  │  ├─ navbar/                       # Navegação (menu mobile/menu desktop)
│  │  ├─ dashboard/                    # Visualizações e lógica do dashboard
│  │  ├─ chart/                        # Componentes Chart.js reutilizáveis
│  │  ├─ despesa-form/                 # Formulário para criar/editar despesas
+│  │  ├─ despesa-list/                 # Listagem, filtros e ações em despesas
│  │  ├─ calculadora/                  # Calculadora simples + juros compostos
│  │  ├─ customizable-layout/          # Layouts e widgets
│  │  ├─ theme-selector/               # Seleção de tema/compacto
│  │  └─ shared/                       # Componentes compartilhados (modals, toasts)
│  ├─ services/
│  │  ├─ auth.service.ts               # Autenticação com Firebase
│  │  ├─ firestore.service.ts          # Abstração Firestore
│  │  ├─ despesa.service.ts            # CRUD de despesas
│  │  ├─ user-preferences.service.ts   # Preferências do usuário (Firestor/localStorage)
│  │  └─ toast.service.ts              # Mensagens/toasts
│  ├─ models/
│  │  ├─ despesa.model.ts
│  │  └─ tema.model.ts
│  ├─ app.routes.ts
│  └─ app.component.ts
├─ assets/
├─ environments/
│  ├─ environment.ts
│  └─ environment.prod.ts
└─ styles.scss
```

---

## � Funcionalidades Detalhadas

### Calculadora

- Duas modos: calculadora padrão (expressões rápidas) e calculadora de juros compostos.
- Histórico local salvo em `localStorage` (chave: `calculator-history-v1`).
- A calculadora de juros gera uma série por período e exibe gráfico usando Chart.js.
- Suporte básico de teclado (números, operadores, Enter, Backspace).

### Preferências do Usuário

- Tema, metas e outras preferências são salvas em `user-preferences/{uid}` no Firestore quando permitido.
- Caso Firestore negue a gravação (regras), o app salva automaticamente em `localStorage` com chave `user-preferences-local-{uid}`.

### Alertas e Modal "Ver todos"

- Alertas para despesas vencidas, próximas e metas de gasto.
- Modal com lista completa de alertas; o modal fecha com ESC e tem tratamento para evitar problemas de stacking context.

### Navbar / Mobile

- Menu hambúrguer com navegação e opções de usuário.
- Comportamento aprimorado para mobile (z-index ajustado e lógica de abertura/fechamento para evitar race conditions).

---

## 🔁 Fluxos de Dados e Persistência

- Despesas & entradas: armazenadas no Firestore (`despesas`, `entradas` collections) com observables para atualizações em tempo real.
- Preferências: `user-preferences` collection; fallback local quando necessário.
- Auditoria: (se habilitada) logs de ações podem ser gravados em `auditLogs`.

---

## � Deploy (Firebase Hosting)

O repositório contém scripts para build e deploy:

```powershell
npm run build:prod     # build produção
npm run deploy         # build produção e deploy no Firebase Hosting
```

O site está (ou pode ser) publicado em Firebase Hosting. Se quiser, posso incluir a URL pública atual. No deploy automático que rodamos, a URL foi:

`https://financeiro-app-64391.web.app`

---

## ⚠️ Known issues & observações de desenvolvimento

- CSS size/budget: `src/app/components/dashboard/dashboard.component.scss` excede o orçamento de CSS configurado (warning no build). Recomendo refatorar SCSS em partials e remover duplicações.
- Stacking context: alguns overlays/modals precisaram de ajustes de z-index e lógica para garantir que apareçam acima do conteúdo.
- Melhorias de acessibilidade pendentes: foco no modal, aria attributes e testes com leitor de tela.

---

## 🧪 Testes e qualidade

- Há testes unitários básicos (se aplicável) — rodar `npm test` para executar.
- Recomenda-se rodar `ng lint` e `ng test` durante contributuições significativas.

---

## 🔐 Segurança

- Não inclua credenciais sensíveis no repositório.
- Use variáveis de ambiente ou Firebase config para chaves.
- Revise regras do Firestore antes de publicar em produção.

---

## ♻️ Roadmap / Próximas melhorias

- Persistência de histórico da calculadora no Firestore (sincronizar entre dispositivos)
- Integração com WhatsApp/Telegram para registrar despesas via mensagem (POC sugerido: Telegram Bot)
- Migração de modals para Angular CDK Overlay para melhor acessibilidade
- Relatórios avançados (CSV, exportação/impressoes)

---

## 🤝 Como contribuir

1. Fork do repositório
2. Crie uma branch com a sua feature: `git checkout -b feat/minha-feature`
3. Commit & PR

Por favor, abra issues com contexto e passos para reproduzir bugs.

---

## 📄 Licença

Este projeto é um exemplo de aplicação Angular para gestão financeira pessoal.

---

**Desenvolvido com ❤️ usando Angular 17**

```
