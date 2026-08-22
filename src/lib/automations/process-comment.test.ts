import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { processCommentEvent, type Sender } from "@/lib/automations/process-comment";
import { encryptSecret } from "@/lib/crypto";
import type { CommentEvent } from "@/lib/meta/events";

const KEY = "b".repeat(64);

function event(overrides: Partial<CommentEvent> = {}): CommentEvent {
  return {
    platform: "INSTAGRAM",
    accountId: "acct-1",
    commentId: "comment-1",
    postExternalId: "media-1",
    text: "price kya hai?",
    fromId: "user-1",
    fromUsername: "rahul",
    createdAt: new Date("2026-08-22T10:00:00.000Z"),
    ...overrides,
  };
}

type Overrides = {
  channel?: unknown;
  automations?: unknown[];
  business?: unknown;
  campaignPost?: unknown;
};

/**
 * Hand-rolled Prisma stub: only the calls this pipeline makes, so the test
 * fails loudly if the pipeline starts reaching for something new.
 */
function makePrisma(overrides: Overrides = {}) {
  const calls = {
    logs: [] as Array<Record<string, unknown>>,
    messages: [] as Array<Record<string, unknown>>,
    contactsCreated: 0,
    conversationsCreated: 0,
  };

  const prisma = {
    channel: {
      findFirst: vi.fn(async () => overrides.channel ?? null),
    },
    automation: {
      findMany: vi.fn(async () => overrides.automations ?? []),
    },
    businessInformation: {
      findUnique: vi.fn(async () => overrides.business ?? null),
    },
    campaignPost: {
      findFirst: vi.fn(async () => overrides.campaignPost ?? null),
    },
    automationLog: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        calls.logs.push(data);
        return data;
      }),
    },
    contact: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async () => {
        calls.contactsCreated += 1;
        return { id: "contact-1" };
      }),
      update: vi.fn(async () => ({ id: "contact-1" })),
    },
    conversation: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async () => {
        calls.conversationsCreated += 1;
        return { id: "conversation-1" };
      }),
      update: vi.fn(async () => ({})),
    },
    message: {
      createMany: vi.fn(async ({ data }: { data: Array<Record<string, unknown>> }) => {
        calls.messages.push(...data);
        return { count: data.length };
      }),
    },
  };

  return { prisma: prisma as unknown as PrismaClient, calls };
}

function makeSender() {
  const sent: Array<{ kind: string; commentId: string; message: string }> = [];
  const sender: Sender = {
    privateReply: vi.fn(async (params) => {
      sent.push({ kind: "private", commentId: params.commentId, message: params.message });
      return { message_id: "m-1" };
    }),
    commentReply: vi.fn(async (params) => {
      sent.push({ kind: "comment", commentId: params.commentId, message: params.message });
      return { id: "r-1" };
    }),
  };
  return { sender, sent };
}

const connectedChannel = () => ({
  workspaceId: "ws-1",
  tokenEncrypted: encryptSecret("page-token"),
});

const priceAutomation = (overrides: Record<string, unknown> = {}) => ({
  id: "auto-1",
  campaignId: "camp-1",
  status: "ACTIVE",
  triggerMode: "KEYWORD",
  actionType: "PRIVATE_REPLY",
  messageTemplate: "Hi {{username}}",
  keywords: [
    {
      intentKey: "price",
      keyword: "price",
      aliases: ["cost", "kitne ka"],
      fuzzy: true,
      responseText: "",
    },
  ],
  campaign: {
    name: "Green Valley",
    price: "₹45 Lakh",
    location: "Delhi",
    productLink: "example.com/gv",
    details: null,
    brochureUrl: null,
  },
  ...overrides,
});

describe("processCommentEvent", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = KEY;
  });
  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
    vi.restoreAllMocks();
  });

  it("sends a private reply and records the exchange", async () => {
    const { prisma, calls } = makePrisma({
      channel: connectedChannel(),
      automations: [priceAutomation()],
    });
    const { sender, sent } = makeSender();

    const result = await processCommentEvent(prisma, event(), sender);

    expect(result.handled).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.kind).toBe("private");
    expect(sent[0]?.message).toContain("₹45 Lakh");

    expect(calls.logs[0]).toMatchObject({
      status: "sent",
      action: "PRIVATE_REPLY",
      detectedIntents: ["price"],
    });
    // Both sides of the exchange land in the inbox.
    expect(calls.messages).toHaveLength(2);
    expect(calls.contactsCreated).toBe(1);
    expect(calls.conversationsCreated).toBe(1);
  });

  it("uses the comment thread when the action type says so", async () => {
    const { prisma } = makePrisma({
      channel: connectedChannel(),
      automations: [priceAutomation({ actionType: "COMMENT_REPLY" })],
    });
    const { sender, sent } = makeSender();

    await processCommentEvent(prisma, event(), sender);
    expect(sent[0]?.kind).toBe("comment");
  });

  it("never replies to the account's own comment", async () => {
    const { prisma, calls } = makePrisma({
      channel: connectedChannel(),
      automations: [priceAutomation()],
    });
    const { sender, sent } = makeSender();

    const result = await processCommentEvent(
      prisma,
      event({ fromId: "acct-1" }),
      sender,
    );

    expect(result.handled).toBe(false);
    expect(sent).toHaveLength(0);
    expect(calls.logs).toHaveLength(0);
  });

  it("does nothing when no channel is connected", async () => {
    const { prisma } = makePrisma({ automations: [priceAutomation()] });
    const { sender, sent } = makeSender();

    const result = await processCommentEvent(prisma, event(), sender);
    expect(result.handled).toBe(false);
    expect(result.reason).toMatch(/No connected channel/);
    expect(sent).toHaveLength(0);
  });

  it("refuses to act when the channel has no stored token", async () => {
    const { prisma } = makePrisma({
      channel: { workspaceId: "ws-1", tokenEncrypted: null },
      automations: [priceAutomation()],
    });
    const { sender, sent } = makeSender();

    const result = await processCommentEvent(prisma, event(), sender);
    expect(result.handled).toBe(false);
    expect(sent).toHaveLength(0);
  });

  it("stays silent when no keyword matches", async () => {
    const { prisma, calls } = makePrisma({
      channel: connectedChannel(),
      automations: [priceAutomation()],
    });
    const { sender, sent } = makeSender();

    const result = await processCommentEvent(
      prisma,
      event({ text: "beautiful photo" }),
      sender,
    );

    expect(result.handled).toBe(false);
    expect(sent).toHaveLength(0);
    expect(calls.logs).toHaveLength(0);
  });

  it("matches Hinglish aliases and single-character typos", async () => {
    const { prisma } = makePrisma({
      channel: connectedChannel(),
      automations: [priceAutomation()],
    });
    const { sender, sent } = makeSender();

    await processCommentEvent(prisma, event({ text: "bhai kitne ka hai" }), sender);
    expect(sent).toHaveLength(1);

    const second = makeSender();
    await processCommentEvent(prisma, event({ text: "whats the pric" }), second.sender);
    expect(second.sent).toHaveLength(1);
  });

  it("replies to every comment in ANY_COMMENT mode", async () => {
    const { prisma } = makePrisma({
      channel: connectedChannel(),
      automations: [priceAutomation({ triggerMode: "ANY_COMMENT" })],
    });
    const { sender, sent } = makeSender();

    await processCommentEvent(prisma, event({ text: "nice one" }), sender);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.message).toContain("Hi rahul");
  });

  it("logs a failure without recording a conversation when sending throws", async () => {
    const { prisma, calls } = makePrisma({
      channel: connectedChannel(),
      automations: [priceAutomation()],
    });
    const sender: Sender = {
      privateReply: vi.fn(async () => {
        throw new Error("Private reply failed (400)");
      }),
      commentReply: vi.fn(async () => ({ id: "r" })),
    };

    const result = await processCommentEvent(prisma, event(), sender);

    expect(result.handled).toBe(false);
    expect(calls.logs[0]).toMatchObject({ status: "failed" });
    expect(calls.messages).toHaveLength(0);
  });

  it("prefers the post-specific price over the campaign price", async () => {
    const { prisma } = makePrisma({
      channel: connectedChannel(),
      automations: [priceAutomation()],
      campaignPost: {
        price: "₹52 Lakh",
        location: null,
        productLink: null,
        description: null,
        brochureUrl: null,
      },
    });
    const { sender, sent } = makeSender();

    await processCommentEvent(prisma, event(), sender);
    expect(sent[0]?.message).toContain("₹52 Lakh");
    expect(sent[0]?.message).not.toContain("₹45 Lakh");
  });
});
