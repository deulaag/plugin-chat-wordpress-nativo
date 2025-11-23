import { and, eq, isNull, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, chatSessions, chatMessages, agentStatus, quickReplies, webhookLogs } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * ============================================================================
 * CHAT SESSIONS - Gerenciamento de Sessões de Atendimento
 * ============================================================================
 */

/**
 * Cria uma nova sessão de atendimento.
 * Gera um token único para acesso à sessão.
 * @param orderId ID do pedido do WooCommerce
 * @param customerEmail Email do cliente
 * @param customerName Nome do cliente
 * @param expiresAt Timestamp de expiração da sessão
 * @returns ID da sessão criada
 */
export async function createChatSession(
  orderId: number,
  customerEmail?: string,
  customerName?: string,
  expiresAt?: Date
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Gera um token único (32 caracteres alfanuméricos)
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const result = await db.insert(chatSessions).values({
    orderId,
    customerEmail,
    customerName,
    token,
    status: "waiting",
    expiresAt,
  });

  return result[0]?.insertId || 0;
}

/**
 * Busca uma sessão pelo token.
 * @param token Token da sessão
 * @returns Dados da sessão ou undefined
 */
export async function getChatSessionByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.token, token))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Busca uma sessão pelo ID.
 * @param sessionId ID da sessão
 * @returns Dados da sessão ou undefined
 */
export async function getChatSessionById(sessionId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Atualiza o status de uma sessão e atribui um atendente.
 * @param sessionId ID da sessão
 * @param status Novo status (active, closed, waiting)
 * @param agentId ID do atendente (opcional)
 * @returns true se atualizado com sucesso
 */
export async function updateChatSessionStatus(
  sessionId: number,
  status: "active" | "closed" | "waiting",
  agentId?: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
  if (agentId !== undefined) updateData.agentId = agentId;
  if (status === "closed") updateData.closedAt = new Date();

  await db.update(chatSessions).set(updateData).where(eq(chatSessions.id, sessionId));
  return true;
}

/**
 * Lista todas as sessões ativas aguardando atendimento.
 * @returns Array de sessões aguardando
 */
export async function getWaitingSessions() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.status, "waiting"))
    .orderBy(chatSessions.createdAt);
}

/**
 * Lista todas as sessões ativas de um atendente.
 * @param agentId ID do atendente
 * @returns Array de sessões ativas
 */
export async function getAgentActiveSessions(agentId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.agentId, agentId), eq(chatSessions.status, "active")));
}

/**
 * ============================================================================
 * CHAT MESSAGES - Gerenciamento de Mensagens
 * ============================================================================
 */

/**
 * Adiciona uma nova mensagem à sessão.
 * @param sessionId ID da sessão
 * @param senderId ID do remetente (cliente ou atendente)
 * @param senderType Tipo de remetente (customer ou agent)
 * @param content Conteúdo da mensagem
 * @returns ID da mensagem criada
 */
export async function createChatMessage(
  sessionId: number,
  senderId: number | null,
  senderType: "customer" | "agent",
  content: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(chatMessages).values({
    sessionId,
    senderId,
    senderType,
    content,
    isRead: false,
  });

  return result[0]?.insertId || 0;
}

/**
 * Busca todas as mensagens de uma sessão.
 * @param sessionId ID da sessão
 * @param limit Número máximo de mensagens a retornar
 * @returns Array de mensagens
 */
export async function getChatMessages(sessionId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt)
    .limit(limit);
}

/**
 * Marca mensagens como lidas.
 * @param sessionId ID da sessão
 * @param senderType Tipo de remetente que não leu (para marcar as do outro lado como lidas)
 * @returns true se atualizado com sucesso
 */
export async function markMessagesAsRead(sessionId: number, senderType: "customer" | "agent"): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const oppositeType = senderType === "customer" ? "agent" : "customer";

  await db
    .update(chatMessages)
    .set({ isRead: true })
    .where(
      and(
        eq(chatMessages.sessionId, sessionId),
        eq(chatMessages.senderType, oppositeType),
        eq(chatMessages.isRead, false)
      )
    );

  return true;
}

/**
 * ============================================================================
 * AGENT STATUS - Gerenciamento de Status de Atendentes
 * ============================================================================
 */

/**
 * Cria ou atualiza o status de um atendente.
 * @param agentId ID do atendente
 * @param status Status do atendente (online, offline, away)
 * @returns true se criado/atualizado com sucesso
 */
export async function upsertAgentStatus(
  agentId: number,
  status: "online" | "offline" | "away"
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const existing = await db
    .select()
    .from(agentStatus)
    .where(eq(agentStatus.agentId, agentId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(agentStatus)
      .set({ status, lastHeartbeat: new Date(), updatedAt: new Date() })
      .where(eq(agentStatus.agentId, agentId));
  } else {
    await db.insert(agentStatus).values({
      agentId,
      status,
      activeSessions: 0,
      lastHeartbeat: new Date(),
    });
  }

  return true;
}

/**
 * Busca o status de um atendente.
 * @param agentId ID do atendente
 * @returns Status do atendente ou undefined
 */
export async function getAgentStatus(agentId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(agentStatus)
    .where(eq(agentStatus.agentId, agentId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Lista todos os atendentes online.
 * @returns Array de atendentes online
 */
export async function getOnlineAgents() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(agentStatus)
    .where(eq(agentStatus.status, "online"))
    .orderBy(agentStatus.activeSessions);
}

/**
 * Incrementa o contador de sessões ativas de um atendente.
 * @param agentId ID do atendente
 * @returns true se atualizado com sucesso
 */
export async function incrementAgentSessions(agentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(agentStatus)
    .set({ activeSessions: sql`active_sessions + 1` })
    .where(eq(agentStatus.agentId, agentId));

  return true;
}

/**
 * Decrementa o contador de sessões ativas de um atendente.
 * @param agentId ID do atendente
 * @returns true se atualizado com sucesso
 */
export async function decrementAgentSessions(agentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(agentStatus)
    .set({ activeSessions: sql`GREATEST(0, active_sessions - 1)` })
    .where(eq(agentStatus.agentId, agentId));

  return true;
}

/**
 * ============================================================================
 * QUICK REPLIES - Gerenciamento de Respostas Prontas
 * ============================================================================
 */

/**
 * Cria uma nova resposta pronta.
 * @param agentId ID do atendente (ou null para respostas globais)
 * @param title Título da resposta
 * @param content Conteúdo da resposta
 * @returns ID da resposta criada
 */
export async function createQuickReply(
  agentId: number | null,
  title: string,
  content: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(quickReplies).values({
    agentId,
    title,
    content,
  });

  return result[0]?.insertId || 0;
}

/**
 * Lista respostas prontas de um atendente (incluindo respostas globais).
 * @param agentId ID do atendente
 * @returns Array de respostas prontas
 */
export async function getQuickReplies(agentId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(quickReplies)
    .where(or(eq(quickReplies.agentId, agentId), isNull(quickReplies.agentId)))
    .orderBy(quickReplies.title);
}

/**
 * ============================================================================
 * WEBHOOK LOGS - Gerenciamento de Logs de Webhook
 * ============================================================================
 */

/**
 * Registra um log de webhook.
 * @param type Tipo de webhook (outgoing ou incoming)
 * @param event Evento que acionou o webhook
 * @param payload Payload do webhook
 * @param url URL do webhook (para outgoing)
 * @param statusCode Status HTTP da resposta (para outgoing)
 * @param errorMessage Mensagem de erro (se houver)
 * @returns ID do log criado
 */
export async function logWebhook(
  type: "outgoing" | "incoming",
  event: string,
  payload?: string,
  url?: string,
  statusCode?: number,
  errorMessage?: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(webhookLogs).values({
    type,
    event,
    payload,
    url,
    statusCode,
    errorMessage,
  });

  return result[0]?.insertId || 0;
}

/**
 * Lista logs de webhook com filtros opcionais.
 * @param type Tipo de webhook (opcional)
 * @param limit Número máximo de logs a retornar
 * @returns Array de logs
 */
export async function getWebhookLogs(type?: "outgoing" | "incoming", limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  if (type) {
    return await db
      .select()
      .from(webhookLogs)
      .where(eq(webhookLogs.type, type))
      .orderBy(webhookLogs.createdAt)
      .limit(limit);
  }

  return await db
    .select()
    .from(webhookLogs)
    .orderBy(webhookLogs.createdAt)
    .limit(limit);
}


