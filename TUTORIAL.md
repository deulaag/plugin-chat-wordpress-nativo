# MK Atendimento Pro v2.0.0 - Tutorial de Uso

## Índice

1. [Para Administradores](#para-administradores)
2. [Para Atendentes](#para-atendentes)
3. [Para Clientes](#para-clientes)
4. [Perguntas Frequentes](#perguntas-frequentes)

---

## Para Administradores

### 1. Instalação do Plugin

#### Passo 1: Descompactar o Arquivo

1. Faça download do arquivo `mk-atendimento-pro-v2.0.0.zip`
2. Acesse o painel de administração do WordPress
3. Vá para **Plugins > Adicionar Novo**
4. Clique em **Enviar Plugin**
5. Selecione o arquivo ZIP e clique em **Instalar Agora**
6. Após a instalação, clique em **Ativar Plugin**

#### Passo 2: Verificar a Instalação

Após ativar o plugin, você deve ver um novo menu **MK Atendimento** na barra lateral do WordPress. Se não aparecer, verifique:

- Se o plugin foi ativado corretamente
- Se o banco de dados foi criado (verifique em **MK Atendimento > Diagnóstico**)

### 2. Configuração Inicial

#### Passo 1: Acessar as Configurações

1. Clique em **MK Atendimento** no menu lateral
2. Selecione **Configurações**
3. Você verá as seguintes opções:

| Opção | Descrição | Padrão |
| :--- | :--- | :--- |
| **Página de Chat** | Página onde o chat será exibido | - |
| **Duração da Sessão** | Tempo de expiração em horas | 24 |
| **Notificar por Email** | Enviar email quando novo chat chegar | Ativado |
| **Email de Notificação** | Email para receber notificações | admin@site.com |

#### Passo 2: Configurar a Página de Chat

1. Selecione uma página existente ou crie uma nova
2. Esta página será exibida aos clientes para iniciar o chat
3. O plugin automaticamente adicionará o widget de chat

#### Passo 3: Adicionar Atendentes

1. Vá para **Usuários > Adicionar Novo**
2. Crie um novo usuário com a função **Atendente**
3. Este usuário poderá acessar o painel de atendimento

### 3. Gerenciamento de Sessões

#### Visualizar Sessões Ativas

1. Clique em **MK Atendimento > Sessões**
2. Você verá uma lista com:
   - **Cliente:** Nome do cliente
   - **Email:** Email do cliente
   - **Atendente:** Atendente responsável
   - **Status:** Status da sessão (Ativa, Aguardando, Encerrada)
   - **Criada em:** Data/hora de criação
   - **Ações:** Visualizar, Encerrar

#### Visualizar Mensagens

1. Clique em **Visualizar** em uma sessão
2. Você verá o histórico completo de mensagens
3. Pode enviar mensagens como administrador

#### Encerrar Sessão

1. Clique em **Encerrar** em uma sessão
2. A sessão será marcada como encerrada
3. Cliente e atendente não poderão enviar mais mensagens

### 4. Gerenciamento de Atendentes

#### Visualizar Status de Atendentes

1. Clique em **MK Atendimento > Atendentes**
2. Você verá uma lista com:
   - **Nome:** Nome do atendente
   - **Status:** Online, Offline ou Away
   - **Sessões Ativas:** Número de sessões ativas
   - **Último Acesso:** Última vez que esteve online

#### Forçar Status

1. Clique em um atendente
2. Você pode forçar o status (útil se o atendente ficar offline sem avisar)

### 5. Relatórios e Análises

#### Acessar Relatórios

1. Clique em **MK Atendimento > Relatórios**
2. Você verá gráficos com:
   - **Sessões por Dia:** Número de sessões criadas
   - **Tempo Médio de Resposta:** Tempo até primeira resposta
   - **Taxa de Satisfação:** Avaliação dos clientes (se habilitado)
   - **Atendentes Mais Ativos:** Ranking de atendentes

#### Exportar Dados

1. Clique em **Exportar** em qualquer relatório
2. Selecione o formato (CSV ou PDF)
3. O arquivo será baixado automaticamente

### 6. Logs e Diagnóstico

#### Acessar Logs

1. Clique em **MK Atendimento > Diagnóstico**
2. Você verá:
   - **Status do Banco de Dados:** Conectado ou Erro
   - **Tabelas:** Criadas ou Faltando
   - **Logs de Erro:** Erros recentes
   - **Webhooks:** Logs de webhooks enviados/recebidos

#### Limpar Logs

1. Clique em **Limpar Logs**
2. Todos os logs antigos serão removidos
3. Logs recentes serão mantidos

---

## Para Atendentes

### 1. Primeiro Acesso

#### Passo 1: Fazer Login

1. Acesse o painel de administração do WordPress
2. Faça login com sua conta de atendente
3. Você verá um novo menu **MK Atendimento**

#### Passo 2: Acessar o Painel de Atendimento

1. Clique em **MK Atendimento > Meu Painel**
2. Você verá:
   - **Seu Status:** Online, Offline ou Away
   - **Sessões Ativas:** Lista de chats ativos
   - **Respostas Prontas:** Templates de respostas

### 2. Gerenciar Seu Status

#### Mudar Status para Online

1. No painel, clique em **Seu Status**
2. Selecione **Online**
3. Você começará a receber novas sessões

#### Mudar Status para Away

1. Clique em **Seu Status**
2. Selecione **Away**
3. Você não receberá novas sessões, mas pode responder as existentes

#### Mudar Status para Offline

1. Clique em **Seu Status**
2. Selecione **Offline**
3. Você não receberá novas sessões

### 3. Responder Chats

#### Visualizar Sessão

1. Na lista de **Sessões Ativas**, clique em uma sessão
2. Você verá:
   - **Informações do Cliente:** Nome, email, pedido
   - **Histórico de Mensagens:** Todas as mensagens anteriores
   - **Caixa de Entrada:** Para digitar sua resposta

#### Enviar Mensagem

1. Clique na caixa de entrada
2. Digite sua mensagem
3. Clique em **Enviar** ou pressione **Ctrl+Enter**
4. A mensagem será enviada imediatamente ao cliente

#### Usar Resposta Pronta

1. Clique em **Respostas Prontas** no painel
2. Selecione uma resposta
3. A resposta será inserida na caixa de entrada
4. Você pode editar antes de enviar

### 4. Criar Respostas Prontas

#### Adicionar Nova Resposta

1. Clique em **MK Atendimento > Respostas Prontas**
2. Clique em **Adicionar Nova**
3. Preencha:
   - **Título:** Nome da resposta (ex: "Saudação")
   - **Conteúdo:** Texto da resposta (ex: "Olá! Como posso ajudá-lo?")
4. Clique em **Salvar**

#### Editar Resposta

1. Clique em **MK Atendimento > Respostas Prontas**
2. Clique em uma resposta existente
3. Edite o título ou conteúdo
4. Clique em **Atualizar**

#### Deletar Resposta

1. Clique em **MK Atendimento > Respostas Prontas**
2. Clique em **Deletar** em uma resposta
3. Confirme a exclusão

### 5. Encerrar Sessão

#### Fechar Chat

1. Na sessão, clique em **Encerrar Chat**
2. Você pode deixar uma mensagem de encerramento
3. A sessão será marcada como encerrada
4. Cliente não poderá enviar mais mensagens

#### Reabrindo Chat

Se o cliente enviar uma mensagem após encerramento, a sessão será reaberta automaticamente.

### 6. Notificações

#### Receber Notificações

Você receberá notificações quando:

- Uma nova sessão é atribuída a você
- Um cliente envia uma mensagem
- Uma sessão está prestes a expirar

#### Configurar Notificações

1. Clique em **MK Atendimento > Configurações**
2. Em **Notificações**, selecione suas preferências:
   - Email
   - Notificação no navegador
   - Som

---

## Para Clientes

### 1. Iniciar um Chat

#### Após Realizar uma Compra

1. Após completar a compra, você será redirecionado para a página de agradecimento
2. Na página, você verá um widget de chat
3. Clique em **Iniciar Chat**

#### Informações Necessárias

O sistema já possui suas informações da compra:
- Nome
- Email
- Número do pedido

Você não precisa fornecer nenhuma informação adicional.

### 2. Enviar Mensagem

#### Digitar Mensagem

1. Clique na caixa de entrada
2. Digite sua mensagem
3. Clique em **Enviar** ou pressione **Enter**

#### Anexar Arquivo (se disponível)

1. Clique no ícone de anexo
2. Selecione um arquivo do seu computador
3. Clique em **Enviar**

### 3. Histórico de Chat

#### Visualizar Mensagens Anteriores

1. Abra o chat
2. Você verá o histórico completo de mensagens
3. Role para cima para ver mensagens mais antigas

#### Copiar Mensagem

1. Passe o mouse sobre uma mensagem
2. Clique em **Copiar**
3. A mensagem será copiada para a área de transferência

### 4. Encerrar Chat

#### Fechar Chat

1. Clique em **Fechar** no canto superior direito
2. O chat será minimizado
3. Você pode reabrir clicando no widget

#### Sair Permanentemente

1. Clique em **Sair** no menu do chat
2. Você será desconectado
3. Não poderá mais enviar mensagens

---

## Perguntas Frequentes

### P: Como faço para iniciar um chat?

**R:** Após realizar uma compra, você verá um widget de chat na página de agradecimento. Clique em "Iniciar Chat" para começar.

### P: Quanto tempo leva para um atendente responder?

**R:** Depende da disponibilidade dos atendentes. Se houver atendentes online, você será atendido em poucos segundos. Se não houver, sua sessão ficará em fila até que um atendente fique disponível.

### P: Posso enviar imagens ou arquivos?

**R:** Sim, você pode anexar arquivos clicando no ícone de anexo. O tamanho máximo é de 10MB.

### P: O chat fica disponível 24 horas?

**R:** O chat fica disponível enquanto houver atendentes online. Se nenhum atendente estiver disponível, sua mensagem será armazenada e respondida quando um atendente ficar online.

### P: Como faço para fechar minha sessão?

**R:** Você pode fechar clicando em "Fechar" no canto superior direito. Você pode reabrir a qualquer momento clicando no widget.

### P: Meu chat expirou, o que faço?

**R:** Sessões expiram após 24 horas por padrão. Se sua sessão expirou, você pode iniciar uma nova clicando em "Iniciar Chat" novamente.

### P: Como faço para reportar um problema?

**R:** Se encontrar um problema, entre em contato com o administrador do site ou envie um email para support@example.com.

---

### P (Atendente): Como faço para criar uma resposta pronta?

**R:** Vá para **MK Atendimento > Respostas Prontas** e clique em **Adicionar Nova**. Preencha o título e conteúdo, depois clique em **Salvar**.

### P (Atendente): Como faço para mudar meu status?

**R:** No painel de atendimento, clique em **Seu Status** e selecione o status desejado (Online, Away ou Offline).

### P (Atendente): Como faço para encerrar uma sessão?

**R:** Na sessão, clique em **Encerrar Chat**. A sessão será marcada como encerrada e o cliente não poderá enviar mais mensagens.

### P (Atendente): Posso atender múltiplos chats ao mesmo tempo?

**R:** Sim, você pode atender quantos chats forem atribuídos a você. Cada chat é exibido em uma aba separada.

### P (Administrador): Como faço para visualizar todas as sessões?

**R:** Vá para **MK Atendimento > Sessões**. Você verá uma lista com todas as sessões ativas e encerradas.

### P (Administrador): Como faço para adicionar um novo atendente?

**R:** Vá para **Usuários > Adicionar Novo**. Crie um novo usuário e atribua a função **Atendente**. Este usuário poderá acessar o painel de atendimento.

### P (Administrador): Como faço para exportar relatórios?

**R:** Vá para **MK Atendimento > Relatórios**. Selecione o relatório desejado e clique em **Exportar**. Você pode escolher entre CSV ou PDF.

---

## Dicas e Truques

### Para Atendentes

1. **Use Respostas Prontas:** Crie templates para respostas comuns para economizar tempo
2. **Mude para Away:** Se você vai se afastar por um tempo, mude seu status para "Away" para não receber novas sessões
3. **Organize Sessões:** Use abas para organizar múltiplos chats
4. **Verifique Histórico:** Sempre verifique o histórico de mensagens anteriores antes de responder

### Para Administradores

1. **Monitore Atendentes:** Verifique regularmente o status e desempenho dos atendentes
2. **Analise Relatórios:** Use os relatórios para identificar padrões e melhorar o atendimento
3. **Configure Notificações:** Configure emails para ser notificado de eventos importantes
4. **Limpe Logs:** Limpe logs regularmente para manter o banco de dados limpo

### Para Clientes

1. **Seja Específico:** Descreva seu problema com detalhes para receber uma resposta melhor
2. **Verifique Histórico:** Verifique o histórico de mensagens para ver respostas anteriores
3. **Tenha Paciência:** Os atendentes podem estar ocupados, aguarde uma resposta
4. **Forneça Informações:** Forneça informações relevantes (número do pedido, etc.) para acelerar o atendimento

---

**Versão:** 2.0.0  
**Última Atualização:** Novembro 2025  
**Autor:** Manus AI
