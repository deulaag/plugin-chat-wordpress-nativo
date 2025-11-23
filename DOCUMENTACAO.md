# MK Atendimento Pro v2.0.0 - Documentação Técnica

## 1. Visão Geral

O **MK Atendimento Pro** é um plugin WordPress que implementa um sistema de chat persistente para atendimento pós-venda. O plugin permite que clientes que acabaram de realizar uma compra iniciem uma sessão de chat com atendentes disponíveis, sem necessidade de enviar links ou fazer configurações manuais.

A versão 2.0.0 foi completamente refatorada com foco em **segurança**, **escalabilidade** e **experiência do usuário**, utilizando uma arquitetura moderna baseada em **tRPC** e **React**.

## 2. Arquitetura do Sistema

### 2.1 Componentes Principais

O sistema é dividido em três camadas principais:

| Camada | Descrição | Tecnologias |
| :--- | :--- | :--- |
| **Frontend** | Interface de usuário para clientes e atendentes | React 19, Tailwind CSS 4 |
| **Backend** | API e lógica de negócio | Express, tRPC, Node.js |
| **Banco de Dados** | Armazenamento de sessões, mensagens e configurações | MySQL, Drizzle ORM |

### 2.2 Fluxo de Dados

```
1. Cliente realiza compra no WooCommerce
   ↓
2. Sistema cria automaticamente uma sessão de chat
   ↓
3. Sessão é atribuída ao atendente online com menos sessões ativas
   ↓
4. Cliente pode iniciar chat na página de agradecimento
   ↓
5. Atendente recebe notificação e responde em tempo real
   ↓
6. Histórico de mensagens é armazenado e sincronizado
   ↓
7. Sessão é encerrada automaticamente após expiração ou manualmente
```

## 3. Banco de Dados

### 3.1 Tabelas

O sistema utiliza 6 tabelas principais para armazenar todos os dados:

#### Tabela: `chat_sessions`

Armazena informações sobre cada sessão de atendimento.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | INT | ID único da sessão (chave primária) |
| `orderId` | INT | ID do pedido do WooCommerce |
| `customerId` | INT | ID do cliente (usuário WordPress) |
| `customerEmail` | VARCHAR | Email do cliente |
| `customerName` | VARCHAR | Nome do cliente |
| `agentId` | INT | ID do atendente responsável |
| `token` | VARCHAR | Token único para acesso à sessão |
| `status` | ENUM | Status: `active`, `closed`, `waiting` |
| `expiresAt` | TIMESTAMP | Data/hora de expiração da sessão |
| `createdAt` | TIMESTAMP | Data/hora de criação |
| `updatedAt` | TIMESTAMP | Data/hora da última atualização |
| `closedAt` | TIMESTAMP | Data/hora de encerramento |

#### Tabela: `chat_messages`

Armazena todas as mensagens trocadas entre cliente e atendente.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | INT | ID único da mensagem |
| `sessionId` | INT | ID da sessão a que pertence |
| `senderId` | INT | ID do remetente |
| `senderType` | ENUM | Tipo: `customer` ou `agent` |
| `content` | TEXT | Conteúdo da mensagem |
| `createdAt` | TIMESTAMP | Data/hora de criação |
| `isRead` | BOOLEAN | Flag de leitura |

#### Tabela: `agent_status`

Rastreia o status online/offline de cada atendente.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | INT | ID único do registro |
| `agentId` | INT | ID do atendente |
| `status` | ENUM | Status: `online`, `offline`, `away` |
| `activeSessions` | INT | Número de sessões ativas |
| `lastHeartbeat` | TIMESTAMP | Último heartbeat para detectar desconexões |
| `updatedAt` | TIMESTAMP | Data/hora da última atualização |

#### Tabela: `quick_replies`

Armazena templates de respostas prontas para atendentes.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | INT | ID único da resposta |
| `agentId` | INT | ID do atendente (ou null para global) |
| `title` | VARCHAR | Título/label da resposta |
| `content` | TEXT | Conteúdo da resposta |
| `createdAt` | TIMESTAMP | Data/hora de criação |

#### Tabela: `webhook_logs`

Registra todos os webhooks enviados e recebidos para depuração.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | INT | ID único do log |
| `type` | ENUM | Tipo: `outgoing` ou `incoming` |
| `url` | TEXT | URL do webhook |
| `event` | VARCHAR | Evento que acionou o webhook |
| `payload` | TEXT | Payload enviado/recebido |
| `statusCode` | INT | Status HTTP da resposta |
| `errorMessage` | TEXT | Mensagem de erro (se houver) |
| `createdAt` | TIMESTAMP | Data/hora de criação |

## 4. API tRPC

O sistema utiliza **tRPC** para comunicação entre frontend e backend. Todos os procedimentos estão organizados em routers temáticos.

### 4.1 Chat Router

Procedimentos públicos para clientes iniciarem e interagirem com sessões de chat.

#### `chat.startSession`

Inicia uma nova sessão de chat para um cliente.

```typescript
// Entrada
{
  orderId: number;           // ID do pedido WooCommerce
  customerEmail: string;     // Email do cliente
  customerName: string;      // Nome do cliente
}

// Saída
{
  sessionId: number;         // ID da sessão criada
  token: string;             // Token para acesso à sessão
}
```

**Comportamento:**
- Cria uma nova sessão com status `waiting`
- Busca atendentes online e atribui ao com menos sessões ativas
- Se houver atendente disponível, muda status para `active`
- Gera um token único para acesso sem autenticação

#### `chat.sendMessage`

Envia uma mensagem em uma sessão de chat.

```typescript
// Entrada
{
  token: string;             // Token da sessão
  content: string;           // Conteúdo da mensagem
  senderType: "customer" | "agent";
}

// Saída
{
  messageId: number;         // ID da mensagem criada
  success: boolean;          // Indicador de sucesso
}
```

**Validações:**
- Token deve ser válido
- Sessão deve estar com status `active`
- Conteúdo não pode estar vazio

#### `chat.getMessages`

Recupera mensagens de uma sessão de chat.

```typescript
// Entrada
{
  token: string;             // Token da sessão
  limit?: number;            // Número máximo de mensagens (padrão: 50, máximo: 100)
}

// Saída
{
  messages: ChatMessage[];   // Array de mensagens
  sessionId: number;         // ID da sessão
}
```

**Comportamento:**
- Marca mensagens como lidas automaticamente
- Retorna as últimas N mensagens ordenadas por data

#### `chat.closeSession`

Encerra uma sessão de chat.

```typescript
// Entrada
{
  token: string;             // Token da sessão
}

// Saída
{
  success: boolean;          // Indicador de sucesso
}
```

**Comportamento:**
- Atualiza status para `closed`
- Decrementa contador de sessões do atendente
- Define `closedAt` com timestamp atual

### 4.2 Agent Router

Procedimentos protegidos (requerem autenticação) para atendentes.

#### `agent.updateStatus`

Atualiza o status do atendente autenticado.

```typescript
// Entrada
{
  status: "online" | "offline" | "away";
}

// Saída
{
  success: boolean;
  status: string;
}
```

#### `agent.getStatus`

Recupera o status do atendente autenticado.

```typescript
// Saída
{
  agentId: number;
  status: "online" | "offline" | "away";
  activeSessions: number;
  lastHeartbeat: Date;
}
```

#### `agent.getActiveSessions`

Recupera todas as sessões ativas do atendente.

```typescript
// Saída
ChatSession[]  // Array de sessões com status "active"
```

#### `agent.getUnreadMessages`

Recupera mensagens não lidas de uma sessão específica.

```typescript
// Entrada
{
  sessionId: number;
}

// Saída
ChatMessage[]  // Array de mensagens não lidas
```

**Validações:**
- Atendente deve ser responsável pela sessão

#### `agent.sendMessage`

Envia uma mensagem como atendente.

```typescript
// Entrada
{
  sessionId: number;
  content: string;
}

// Saída
{
  messageId: number;
  success: boolean;
}
```

**Validações:**
- Atendente deve ser responsável pela sessão
- Conteúdo não pode estar vazio

### 4.3 Quick Replies Router

Procedimentos para gerenciar respostas prontas.

#### `quickReplies.list`

Lista respostas prontas do atendente autenticado.

```typescript
// Saída
QuickReply[]  // Array de respostas prontas (pessoais + globais)
```

#### `quickReplies.create`

Cria uma nova resposta pronta.

```typescript
// Entrada
{
  title: string;            // Título/label da resposta
  content: string;          // Conteúdo da resposta
}

// Saída
{
  id: number;
  success: boolean;
}
```

## 5. Segurança

### 5.1 Autenticação e Autorização

- **Clientes:** Utilizam token único gerado por sessão (sem autenticação obrigatória)
- **Atendentes:** Utilizam autenticação OAuth via Manus (requerida para todos os procedimentos protegidos)
- **Validação de Autorização:** Cada procedimento valida que o usuário tem permissão para acessar o recurso

### 5.2 Validação de Entrada

Todos os procedimentos tRPC validam e sanitizam a entrada:

- **Tipos:** Validação de tipos TypeScript em tempo de compilação
- **Comprimento:** Limites de tamanho para strings e arrays
- **Conteúdo:** Sanitização de HTML/scripts para prevenir XSS
- **Formato:** Validação de formato para emails, URLs, etc.

### 5.3 Proteção contra Ataques

| Tipo de Ataque | Proteção |
| :--- | :--- |
| **SQL Injection** | Drizzle ORM com prepared statements |
| **XSS** | Sanitização de entrada e escaping de output |
| **CSRF** | tRPC com validação de origem |
| **DoS** | Limites de taxa (a implementar) |
| **Força Bruta** | Autenticação OAuth (não aplicável a tokens de sessão) |

## 6. Funcionalidades

### 6.1 Criação Automática de Sessões

Quando um cliente completa uma compra no WooCommerce, o sistema automaticamente:

1. Cria uma nova sessão de chat
2. Busca atendentes online
3. Atribui a sessão ao atendente com menos sessões ativas
4. Envia notificação ao atendente (opcional)
5. Exibe link de chat na página de agradecimento

### 6.2 Chat Persistente para Atendentes

Os atendentes têm acesso a uma interface persistente que mostra:

- **Lista de Sessões Ativas:** Todas as sessões atribuídas ao atendente
- **Status Indicator:** Mostra quantas sessões estão ativas
- **Histórico de Mensagens:** Acesso completo ao histórico de cada sessão
- **Respostas Prontas:** Templates de respostas para responder rapidamente
- **Status Online/Offline:** Controle de disponibilidade

### 6.3 Roteamento Automático

O sistema distribui automaticamente novas sessões para atendentes online:

- **Algoritmo:** Round-robin baseado em número de sessões ativas
- **Prioridade:** Atendentes com menos sessões ativas recebem novas sessões
- **Fallback:** Se nenhum atendente estiver online, sessão fica em `waiting`

### 6.4 Expiração de Sessões

Sessões expiram automaticamente após um período configurável:

- **Duração Padrão:** 24 horas
- **Configurável:** Pode ser alterada nas configurações do plugin
- **Limpeza:** Sessões expiradas são marcadas como `closed`

## 7. Instalação e Configuração

### 7.1 Requisitos

- WordPress 5.8 ou superior
- PHP 7.4 ou superior
- MySQL 5.7 ou superior
- Node.js 18+ (para desenvolvimento)

### 7.2 Instalação

1. Descompacte o arquivo ZIP na pasta `/wp-content/plugins/`
2. Acesse o painel de administração do WordPress
3. Vá para "Plugins" e ative "MK Atendimento Pro"
4. Acesse "MK Atendimento" no menu lateral para configurar

### 7.3 Configuração Inicial

1. **Página de Chat:** Selecione a página onde o chat será exibido
2. **Duração da Sessão:** Configure o tempo de expiração (padrão: 24 horas)
3. **Notificações:** Configure emails para notificar atendentes
4. **Webhook:** (Opcional) Configure URL para webhooks de eventos

## 8. Testes

O plugin inclui testes unitários com Vitest para validar todas as funcionalidades:

```bash
# Executar todos os testes
pnpm test

# Executar testes com cobertura
pnpm test:coverage

# Executar testes em modo watch
pnpm test:watch
```

**Cobertura de Testes:**
- ✅ Criação de sessões de chat
- ✅ Envio e recebimento de mensagens
- ✅ Gerenciamento de status de atendentes
- ✅ Respostas prontas
- ✅ Validação de entrada
- ✅ Autorização e autenticação

## 9. Troubleshooting

### Problema: Sessão não é criada

**Possíveis Causas:**
- Banco de dados não está conectado
- Tabelas não foram criadas corretamente

**Solução:**
1. Verifique a conexão com o banco de dados
2. Execute as migrações: `pnpm db:push`
3. Verifique os logs em "MK Atendimento > Diagnóstico"

### Problema: Atendente não recebe mensagens

**Possíveis Causas:**
- Atendente não está online
- Sessão expirou
- Problema de sincronização

**Solução:**
1. Verifique o status do atendente em "MK Atendimento > Sessões"
2. Verifique se a sessão ainda está ativa
3. Recarregue a página do atendente

### Problema: Mensagens não aparecem

**Possíveis Causas:**
- Problema de polling (sincronização)
- Cache do navegador
- Problema de conexão

**Solução:**
1. Limpe o cache do navegador
2. Recarregue a página
3. Verifique a conexão de internet
4. Verifique os logs em "MK Atendimento > Diagnóstico"

## 10. Desenvolvimento

### 10.1 Estrutura do Projeto

```
mk-atendimento-pro-v2/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilitários
│   └── public/            # Arquivos estáticos
├── server/                 # Backend Express + tRPC
│   ├── routers.ts         # Definição de procedimentos tRPC
│   ├── db.ts              # Funções de banco de dados
│   └── _core/             # Configuração e middleware
├── drizzle/               # Schema e migrações
│   └── schema.ts          # Definição das tabelas
├── shared/                # Código compartilhado
└── package.json           # Dependências do projeto
```

### 10.2 Adicionando Novos Procedimentos

Para adicionar um novo procedimento tRPC:

1. Crie uma função em `server/db.ts` para a lógica de banco de dados
2. Adicione o procedimento em `server/routers.ts`:

```typescript
myRouter: router({
  myProcedure: publicProcedure
    .input((val: unknown) => {
      // Validação de entrada
      return { /* dados validados */ };
    })
    .query(async ({ input }) => {
      // Lógica de consulta
      return { /* resultado */ };
    }),
}),
```

3. Adicione testes em `server/*.test.ts`
4. Consuma no frontend com `trpc.myRouter.myProcedure.useQuery()`

### 10.3 Modificando o Schema

Para adicionar novas tabelas ou colunas:

1. Edite `drizzle/schema.ts`
2. Execute `pnpm db:push` para gerar e aplicar migrações
3. Atualize as funções em `server/db.ts`

## 11. Changelog

### v2.0.0 (Atual)

- ✨ Refatoração completa da arquitetura
- ✨ Implementação de chat persistente com tRPC
- ✨ Sistema de status para atendentes (Online/Offline/Away)
- ✨ Roteamento automático de sessões
- ✨ Respostas prontas para atendentes
- 🔒 Autenticação segura com validação de entrada
- 🧪 Testes unitários com Vitest
- 📚 Documentação técnica completa

### v1.6.0 (Anterior)

- Sistema básico de chat
- Integração com Tawk.to
- Relatórios simples

## 12. Suporte

Para suporte, entre em contato através de:

- Email: support@example.com
- GitHub Issues: https://github.com/example/mk-atendimento-pro/issues
- Documentação: https://docs.example.com

---

**Versão:** 2.0.0  
**Última Atualização:** Novembro 2025  
**Autor:** Manus AI
