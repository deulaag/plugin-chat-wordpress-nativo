import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";

// APP ROUTER - Definição de todos os procedimentos tRPC
export const appRouter = router({
  system: systemRouter,

  // AUTH ROUTER - Autenticação e Logout
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // CHAT ROUTER - Gerenciamento de Sessões e Mensagens de Chat
  chat: router({
    startSession: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return {
          orderId: typeof obj.orderId === "number" ? obj.orderId : 0,
          customerEmail: typeof obj.customerEmail === "string" ? obj.customerEmail : "",
          customerName: typeof obj.customerName === "string" ? obj.customerName : "",
        };
      })
      .mutation(async ({ input }) => {
        const {
          createChatSession,
          getOnlineAgents,
          updateChatSessionStatus,
          incrementAgentSessions,
          getChatSessionById,
        } = await import("./db");

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const sessionId = await createChatSession(
          input.orderId,
          input.customerEmail,
          input.customerName,
          expiresAt
        );

        const onlineAgents = await getOnlineAgents();
        if (onlineAgents.length > 0) {
          const agent = onlineAgents[0];
          await updateChatSessionStatus(sessionId, "active", agent.agentId);
          await incrementAgentSessions(agent.agentId);
        }

        const session = await getChatSessionById(sessionId);
        return { sessionId, token: session?.token || "" };
      }),

    sendMessage: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return {
          token: typeof obj.token === "string" ? obj.token : "",
          content: typeof obj.content === "string" ? obj.content : "",
          senderType:
            obj.senderType === "customer" || obj.senderType === "agent"
              ? obj.senderType
              : "customer",
        };
      })
      .mutation(async ({ input }) => {
        const { getChatSessionByToken, createChatMessage } = await import("./db");

        const session = await getChatSessionByToken(input.token);
        if (!session || session.status !== "active") {
          throw new Error("Invalid or inactive session");
        }

        if (!input.content || input.content.trim().length === 0) {
          throw new Error("Message content cannot be empty");
        }

        const messageId = await createChatMessage(
          session.id,
          null,
          input.senderType as "customer" | "agent",
          input.content.trim()
        );

        return { messageId, success: true };
      }),

    getMessages: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return {
          token: typeof obj.token === "string" ? obj.token : "",
          limit: typeof obj.limit === "number" ? Math.min(obj.limit, 100) : 50,
        };
      })
      .query(async ({ input }) => {
        const { getChatSessionByToken, getChatMessages, markMessagesAsRead } = await import("./db");

        const session = await getChatSessionByToken(input.token);
        if (!session) {
          throw new Error("Invalid session token");
        }

        await markMessagesAsRead(session.id, "customer");

        const messages = await getChatMessages(session.id, input.limit);
        return { messages, sessionId: session.id };
      }),

    closeSession: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return { token: typeof obj.token === "string" ? obj.token : "" };
      })
      .mutation(async ({ input }) => {
        const {
          getChatSessionByToken,
          updateChatSessionStatus,
          decrementAgentSessions,
        } = await import("./db");

        const session = await getChatSessionByToken(input.token);
        if (!session) {
          throw new Error("Invalid session token");
        }

        await updateChatSessionStatus(session.id, "closed");

        if (session.agentId) {
          await decrementAgentSessions(session.agentId);
        }

        return { success: true };
      }),
  }),

  // AGENT ROUTER - Gerenciamento de Atendentes
  agent: router({
    updateStatus: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        const status = obj.status;
        if (status !== "online" && status !== "offline" && status !== "away") {
          throw new Error("Invalid status");
        }
        return { status };
      })
      .mutation(async ({ ctx, input }) => {
        const { upsertAgentStatus } = await import("./db");

        await upsertAgentStatus(ctx.user.id, input.status as "online" | "offline" | "away");

        return { success: true, status: input.status };
      }),

    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const { getAgentStatus } = await import("./db");

      const status = await getAgentStatus(ctx.user.id);
      return status || { agentId: ctx.user.id, status: "offline", activeSessions: 0 };
    }),

    getActiveSessions: protectedProcedure.query(async ({ ctx }) => {
      const { getAgentActiveSessions } = await import("./db");

      const sessions = await getAgentActiveSessions(ctx.user.id);
      return sessions;
    }),

    getUnreadMessages: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return { sessionId: typeof obj.sessionId === "number" ? obj.sessionId : 0 };
      })
      .query(async ({ ctx, input }) => {
        const { getChatSessionById, getChatMessages, markMessagesAsRead } = await import("./db");

        const session = await getChatSessionById(input.sessionId);
        if (!session || session.agentId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        await markMessagesAsRead(session.id, "agent");

        const messages = await getChatMessages(session.id, 100);
        return messages;
      }),

    sendMessage: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return {
          sessionId: typeof obj.sessionId === "number" ? obj.sessionId : 0,
          content: typeof obj.content === "string" ? obj.content : "",
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { getChatSessionById, createChatMessage } = await import("./db");

        const session = await getChatSessionById(input.sessionId);
        if (!session || session.agentId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        if (!input.content || input.content.trim().length === 0) {
          throw new Error("Message content cannot be empty");
        }

        const messageId = await createChatMessage(
          session.id,
          ctx.user.id,
          "agent",
          input.content.trim()
        );

        return { messageId, success: true };
      }),
  }),

  // QUICK REPLIES ROUTER - Gerenciamento de Respostas Prontas
  quickReplies: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getQuickReplies } = await import("./db");

      return await getQuickReplies(ctx.user.id);
    }),

    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return {
          title: typeof obj.title === "string" ? obj.title : "",
          content: typeof obj.content === "string" ? obj.content : "",
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { createQuickReply } = await import("./db");

        if (!input.title || input.title.trim().length === 0) {
          throw new Error("Title cannot be empty");
        }
        if (!input.content || input.content.trim().length === 0) {
          throw new Error("Content cannot be empty");
        }

        const id = await createQuickReply(
          ctx.user.id,
          input.title.trim(),
          input.content.trim()
        );
        return { id, success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
