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
- ✅ **Marcar como Paga**: Controle do status de pagamento
- 🎯 **Sistema de Prioridades**: Alta, média e baixa prioridade

### 🔔 Sistema de Alertas
- **Despesas Vencidas**: Notificação visual para contas atrasadas
- **Próximas ao Vencimento**: Alertas para despesas dos próximos 7 dias
- **Indicadores Visuais**: Cores e ícones para fácil identificação

### 📱 Interface Responsiva
- **Desktop**: Layout completo com todas as funcionalidades
- **Tablet**: Adaptação otimizada para telas médias
- **Mobile**: Interface adaptada para smartphones

## 🛠️ Tecnologias Utilizadas

- **Angular 17**: Framework frontend moderno
- **TypeScript**: Linguagem de programação tipada
- **RxJS**: Programação reativa e observables
- **Chart.js**: Biblioteca de gráficos interativos
- **SCSS**: Estilização avançada com preprocessador CSS
- **Angular Reactive Forms**: Formulários reativos com validação

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Angular CLI 17+

### Passos para Instalação

1. **Clone o repositório** (se aplicável):
```bash
git clone [url-do-repositorio]
cd dashboard-financeiro
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Execute a aplicação**:
```bash
npm start
# ou
ng serve
```

4. **Acesse a aplicação**:
Abra seu navegador em `http://localhost:4200`

## 🎨 Estrutura da Aplicação

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/          # Componente principal do dashboard
│   │   ├── chart/              # Componente de gráficos Chart.js
│   │   ├── despesa-form/       # Formulário de despesas
│   │   └── despesa-list/       # Lista e gestão de despesas
│   ├── models/
│   │   ├── despesa.model.ts    # Interfaces e tipos TypeScript
│   │   └── categorias.data.ts  # Dados das categorias padrão
│   ├── services/
│   │   └── despesa.service.ts  # Serviço de gestão de dados
│   └── app.component.*         # Componente raiz
└── styles.scss                # Estilos globais
```

## 💡 Como Usar

### 1. Dashboard Principal
- Visualize o resumo financeiro nos cards superiores
- Acompanhe o gráfico de distribuição de despesas por categoria
- Monitore alertas de vencimento na parte inferior

### 2. Gestão de Despesas
- Clique em "📋 Gerenciar Despesas" no menu superior
- Use "➕ Nova Despesa" para adicionar despesas
- Clique nos botões dos cards para editar ou remover
- Use o botão de toggle (✅/↩️) para marcar como paga/pendente

### 3. Prioridades
- **🔴 Alta**: Despesas críticas e urgentes
- **🟡 Média**: Despesas importantes mas não urgentes
- **🟢 Baixa**: Despesas menos prioritárias

### 4. Categorias Disponíveis
- 🏍️ Parcela Moto
- 💳 Fatura Nubank  
- 🏦 Fatura Inter
- 🚗 Parcela Consórcio
- 🛡️ Seguro Moto
- 🎓 Pós-graduação
- 🌐 Internet Fixa
- 📦 Outros

## 📊 Dados de Exemplo

A aplicação vem com dados de exemplo pré-carregados:
- **Entradas**: Salário (R$ 4.130,13), Adiantamento (R$ 2.364,31), Retorno Ticket (R$ 489,09)
- **Despesas**: 10 despesas distribuídas nas diferentes categorias
- **Total**: R$ 7.003,53 em entradas, R$ 5.792,21 em despesas

## 🎯 Funcionalidades em Tempo Real

- **Cálculos Automáticos**: Saldo e totais são recalculados instantaneamente
- **Gráficos Dinâmicos**: Chart.js atualiza automaticamente com mudanças
- **Status Visual**: Cores e indicadores mudam conforme o status das despesas
- **Validação**: Formulários com validação em tempo real

## 🚀 Próximas Funcionalidades

- Gestão de Entradas
- Relatórios mensais/anuais
- Backup e restauração de dados
- Categorias personalizadas
- Metas de economia
- Integração com bancos (API)

## 📝 Licença

Este projeto foi desenvolvido como exemplo de aplicação Angular para gestão financeira pessoal.

## 🤝 Contribuições

Sinta-se à vontade para fazer fork, sugerir melhorias ou reportar bugs!

---

**Desenvolvido com ❤️ usando Angular 17**
