import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock do contexto de usuário autenticado
function createAuthContext(userId: number = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@example.com`,
      name: `User ${userId}`,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// Mock do contexto de usuário não autenticado
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Chat Router", () => {
  describe("startSession", () => {
    it("deve criar uma nova sessão de chat com token válido", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.startSession({
        orderId: 123,
        customerEmail: "customer@example.com",
        customerName: "John Doe",
      });

      expect(result).toHaveProperty("sessionId");
      expect(result).toHaveProperty("token");
      expect(result.sessionId).toBeGreaterThan(0);
      expect(result.token).toBeTruthy();
    });
  });

  describe("sendMessage", () => {
    it("deve enviar uma mensagem com sucesso", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const sessionResult = await caller.chat.startSession({
        orderId: 456,
        customerEmail: "customer2@example.com",
        customerName: "Jane Doe",
      });

      const result = await caller.chat.sendMessage({
        token: sessionResult.token,
        content: "Olá, preciso de ajuda!",
        senderType: "customer",
      });

      expect(result).toHaveProperty("messageId");
      expect(result.success).toBe(true);
    });
  });
});

describe("Agent Router", () => {
  describe("updateStatus", () => {
    it("deve atualizar o status do atendente para online", async () => {
      const ctx = createAuthContext(2);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.agent.updateStatus({
        status: "online",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("online");
    });
  });

  describe("getStatus", () => {
    it("deve recuperar o status do atendente", async () => {
      const ctx = createAuthContext(3);
      const caller = appRouter.createCaller(ctx);

      await caller.agent.updateStatus({ status: "online" });

      const result = await caller.agent.getStatus();

      expect(result).toHaveProperty("agentId");
      expect(result).toHaveProperty("status");
    });
  });
});

describe("Quick Replies Router", () => {
  describe("create", () => {
    it("deve criar uma resposta pronta com sucesso", async () => {
      const ctx = createAuthContext(5);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.quickReplies.create({
        title: "Saudação",
        content: "Olá! Como posso ajudá-lo?",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeGreaterThan(0);
    });
  });
});
