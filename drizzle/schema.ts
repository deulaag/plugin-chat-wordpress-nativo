import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de Sessões de Atendimento
 * Armazena informações sobre cada sessão de chat entre cliente e atendente.
 * Vinculada a um pedido do WooCommerce e a um atendente disponível.
 */
export const chatSessions = mysqlTable("chat_sessions", {
  /** ID único da sessão */
  id: int("id").autoincrement().primaryKey(),
  /** ID do pedido do WooCommerce (referência externa) */
  orderId: int("order_id").notNull(),
  /** ID do cliente (usuário do WordPress) */
  customerId: int("customer_id"),
  /** Email do cliente */
  customerEmail: varchar("customer_email", { length: 320 }),
  /** Nome do cliente */
  customerName: varchar("customer_name", { length: 255 }),
  /** ID do atendente (usuário do WordPress) */
  agentId: int("agent_id"),
  /** Token único para acesso à sessão (sem autenticação) */
  token: varchar("token", { length: 64 }).notNull().unique(),
  /** Status da sessão: active, closed, waiting */
  status: mysqlEnum("status", ["active", "closed", "waiting"]).default("waiting").notNull(),
  /** Timestamp de quando a sessão deve expirar */
  expiresAt: timestamp("expires_at"),
  /** Timestamp de quando a sessão foi criada */
  createdAt: timestamp("created_at").defaultNow().notNull(),
  /** Timestamp de quando a sessão foi atualizada pela última vez */
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  /** Timestamp de quando a sessão foi encerrada */
  closedAt: timestamp("closed_at"),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

/**
 * Tabela de Mensagens de Chat
 * Armazena todas as mensagens trocadas entre cliente e atendente em uma sessão.
 */
export const chatMessages = mysqlTable("chat_messages", {
  /** ID único da mensagem */
  id: int("id").autoincrement().primaryKey(),
  /** ID da sessão de chat a que pertence */
  sessionId: int("session_id").notNull(),
  /** ID do usuário que enviou a mensagem (cliente ou atendente) */
  senderId: int("sender_id"),
  /** Tipo de remetente: customer ou agent */
  senderType: mysqlEnum("sender_type", ["customer", "agent"]).notNull(),
  /** Conteúdo da mensagem */
  content: text("content").notNull(),
  /** Timestamp de quando a mensagem foi criada */
  createdAt: timestamp("created_at").defaultNow().notNull(),
  /** Flag indicando se a mensagem foi lida pelo destinatário */
  isRead: boolean("is_read").default(false).notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Tabela de Status de Atendente
 * Rastreia o status online/offline de cada atendente e sua disponibilidade.
 */
export const agentStatus = mysqlTable("agent_status", {
  /** ID único do registro de status */
  id: int("id").autoincrement().primaryKey(),
  /** ID do atendente (usuário do WordPress) */
  agentId: int("agent_id").notNull().unique(),
  /** Status do atendente: online, offline, away */
  status: mysqlEnum("status", ["online", "offline", "away"]).default("offline").notNull(),
  /** Número de sessões ativas atribuídas ao atendente */
  activeSessions: int("active_sessions").default(0).notNull(),
  /** Timestamp do último heartbeat (para detectar desconexões) */
  lastHeartbeat: timestamp("last_heartbeat").defaultNow().notNull(),
  /** Timestamp de quando o status foi atualizado */
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AgentStatus = typeof agentStatus.$inferSelect;
export type InsertAgentStatus = typeof agentStatus.$inferInsert;

/**
 * Tabela de Respostas Prontas
 * Armazena templates de respostas que os atendentes podem usar rapidamente.
 */
export const quickReplies = mysqlTable("quick_replies", {
  /** ID único da resposta pronta */
  id: int("id").autoincrement().primaryKey(),
  /** ID do atendente que criou a resposta (ou global se null) */
  agentId: int("agent_id"),
  /** Título/label da resposta pronta */
  title: varchar("title", { length: 255 }).notNull(),
  /** Conteúdo da resposta pronta */
  content: text("content").notNull(),
  /** Timestamp de quando foi criada */
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type QuickReply = typeof quickReplies.$inferSelect;
export type InsertQuickReply = typeof quickReplies.$inferInsert;

/**
 * Tabela de Logs de Webhook
 * Rastreia todos os webhooks enviados e recebidos para fins de depuração.
 */
export const webhookLogs = mysqlTable("webhook_logs", {
  /** ID único do log */
  id: int("id").autoincrement().primaryKey(),
  /** Tipo de webhook: outgoing ou incoming */
  type: mysqlEnum("type", ["outgoing", "incoming"]).notNull(),
  /** URL do webhook (para outgoing) */
  url: text("url"),
  /** Evento que acionou o webhook */
  event: varchar("event", { length: 255 }).notNull(),
  /** Payload enviado/recebido */
  payload: text("payload"),
  /** Status HTTP da resposta (para outgoing) */
  statusCode: int("status_code"),
  /** Mensagem de erro (se houver) */
  errorMessage: text("error_message"),
  /** Timestamp de quando foi criado */
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;