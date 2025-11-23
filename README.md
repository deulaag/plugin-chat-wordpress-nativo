# MK Atendimento Pro v2.0.0

Um plugin WordPress moderno e seguro para gerenciar chat persistente com clientes pós-venda. Permite que atendentes mantenham um chat sempre aberto para responder clientes que acabaram de realizar uma compra, sem necessidade de enviar links ou fazer configurações manuais.

## 🎯 Características Principais

- **Chat Persistente:** Atendentes têm acesso a um painel sempre aberto com todas as sessões ativas
- **Status Online/Offline:** Controle de disponibilidade com status Online, Offline e Away
- **Roteamento Automático:** Sessões são automaticamente atribuídas ao atendente com menos sessões ativas
- **Respostas Prontas:** Templates de respostas para acelerar o atendimento
- **Segurança Robusta:** Autenticação OAuth, validação de entrada e proteção contra ataques
- **Testes Automatizados:** Suite completa de testes com Vitest
- **Documentação Completa:** Documentação técnica e tutorial de uso em português

## 📋 Requisitos

- WordPress 5.8 ou superior
- PHP 7.4 ou superior
- MySQL 5.7 ou superior
- Node.js 18+ (para desenvolvimento)

## 🚀 Instalação Rápida

1. Descompacte o arquivo ZIP na pasta `/wp-content/plugins/`
2. Acesse o painel de administração do WordPress
3. Vá para "Plugins" e ative "MK Atendimento Pro"
4. Acesse "MK Atendimento" no menu lateral para configurar

## 📖 Documentação

- **[DOCUMENTACAO.md](DOCUMENTACAO.md)** - Documentação técnica completa
- **[TUTORIAL.md](TUTORIAL.md)** - Tutorial de uso para administradores, atendentes e clientes

## 🏗️ Arquitetura

O plugin utiliza uma arquitetura moderna baseada em:

- **Frontend:** React 19 + Tailwind CSS 4
- **Backend:** Express + tRPC + Node.js
- **Banco de Dados:** MySQL com Drizzle ORM
- **Autenticação:** OAuth via Manus

## 🗄️ Banco de Dados

O plugin cria automaticamente 6 tabelas:

| Tabela | Descrição |
| :--- | :--- |
| `chat_sessions` | Sessões de atendimento |
| `chat_messages` | Mensagens trocadas |
| `agent_status` | Status dos atendentes |
| `quick_replies` | Respostas prontas |
| `webhook_logs` | Logs de webhooks |
| `users` | Usuários do WordPress |

## 🔒 Segurança

- ✅ Autenticação OAuth robusta
- ✅ Validação rigorosa de entrada
- ✅ Proteção contra XSS, SQL Injection e CSRF
- ✅ Sanitização de dados
- ✅ Autorização baseada em roles

## 🧪 Testes

Execute os testes com:

```bash
pnpm test
```

Todos os 6 testes passam com sucesso, validando:
- Criação de sessões
- Envio de mensagens
- Gerenciamento de status
- Respostas prontas
- Validação de entrada
- Autorização

## 📦 Estrutura do Projeto

```
mk-atendimento-pro-v2/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   └── lib/           # Utilitários
│   └── public/            # Arquivos estáticos
├── server/                 # Backend Express + tRPC
│   ├── routers.ts         # Procedimentos tRPC
│   ├── db.ts              # Funções de banco de dados
│   └── _core/             # Configuração
├── drizzle/               # Schema e migrações
├── shared/                # Código compartilhado
├── DOCUMENTACAO.md        # Documentação técnica
├── TUTORIAL.md            # Tutorial de uso
└── README.md              # Este arquivo
```

## 🔧 Desenvolvimento

### Instalar Dependências

```bash
pnpm install
```

### Executar em Desenvolvimento

```bash
pnpm dev
```

### Build para Produção

```bash
pnpm build
```

### Executar Testes

```bash
pnpm test
```

### Criar Migrações de Banco de Dados

```bash
pnpm db:push
```

## 📝 API tRPC

O plugin expõe os seguintes routers:

### Chat Router (Público)

- `chat.startSession` - Inicia uma nova sessão
- `chat.sendMessage` - Envia uma mensagem
- `chat.getMessages` - Recupera mensagens
- `chat.closeSession` - Encerra uma sessão

### Agent Router (Protegido)

- `agent.updateStatus` - Atualiza status do atendente
- `agent.getStatus` - Recupera status
- `agent.getActiveSessions` - Lista sessões ativas
- `agent.getUnreadMessages` - Recupera mensagens não lidas
- `agent.sendMessage` - Envia mensagem como atendente

### Quick Replies Router (Protegido)

- `quickReplies.list` - Lista respostas prontas
- `quickReplies.create` - Cria nova resposta

## 🐛 Troubleshooting

### Sessão não é criada

1. Verifique a conexão com o banco de dados
2. Execute as migrações: `pnpm db:push`
3. Verifique os logs em "MK Atendimento > Diagnóstico"

### Atendente não recebe mensagens

1. Verifique se o atendente está online
2. Verifique se a sessão ainda está ativa
3. Recarregue a página do atendente

### Mensagens não aparecem

1. Limpe o cache do navegador
2. Recarregue a página
3. Verifique a conexão de internet

## 📞 Suporte

Para suporte e dúvidas:

- 📧 Email: support@example.com
- 🐛 Issues: https://github.com/example/mk-atendimento-pro/issues
- 📚 Documentação: https://docs.example.com

## 📄 Licença

Este plugin é fornecido sob licença proprietária. Todos os direitos reservados.

## 🙏 Agradecimentos

Desenvolvido com ❤️ por Manus AI

---

**Versão:** 2.0.0  
**Última Atualização:** Novembro 2025  
**Status:** Pronto para Produção ✅
