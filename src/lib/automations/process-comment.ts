import type { PrismaClient } from "@prisma/client";
import { createResponseEngine } from "@/lib/engines";
import type { InfoLayer, ResponseContext } from "@/lib/engines/response-engine";
import type { KeywordDefinition } from "@/lib/engines/keywords";
import type { CommentEvent } from "@/lib/meta/events";
import { isSelfAuthored } from "@/lib/meta/events";
import { decryptSecret } from "@/lib/crypto";
import { replyToComment, sendPrivateReply } from "@/lib/meta/client";

export type ProcessOutcome = {
  handled: boolean;
  reason: string;
  automationId?: string;
  message?: string;
};

/** Injected so tests can run the whole pipeline without calling Meta. */
export type Sender = {
  privateReply: typeof sendPrivateReply;
  commentReply: typeof replyToComment;
};

const liveSender: Sender = {
  privateReply: sendPrivateReply,
  commentReply: replyToComment,
};

type PostRow = {
  price: string | null;
  location: string | null;
  productLink: string | null;
  description: string | null;
  brochureUrl: string | null;
};

function infoFromPost(post: PostRow | null): InfoLayer | null {
  if (!post) return null;
  return {
    price: post.price,
    location: post.location,
    link: post.productLink,
    description: post.description,
    brochure: post.brochureUrl,
  };
}

export async function processCommentEvent(
  prisma: PrismaClient,
  event: CommentEvent,
  sender: Sender = liveSender,
): Promise<ProcessOutcome> {
  if (isSelfAuthored(event)) {
    return { handled: false, reason: "Comment was authored by the connected account." };
  }

  const channel = await prisma.channel.findFirst({
    where: {
      externalId: event.accountId,
      platform: event.platform,
      status: "CONNECTED",
    },
  });
  if (!channel) {
    return { handled: false, reason: "No connected channel matches this account id." };
  }
  if (!channel.tokenEncrypted) {
    return { handled: false, reason: "The channel has no stored access token." };
  }

  const workspaceId = channel.workspaceId;

  // Post-specific automations are preferred over campaign-wide ones.
  const automations = await prisma.automation.findMany({
    where: {
      workspaceId,
      platform: event.platform,
      status: "ACTIVE",
      OR: [{ postExternalId: event.postExternalId }, { postExternalId: null }],
    },
    include: { keywords: true, campaign: true },
    orderBy: { postExternalId: { sort: "desc", nulls: "last" } },
  });

  if (automations.length === 0) {
    return { handled: false, reason: "No active automation matches this post." };
  }

  const business = await prisma.businessInformation.findUnique({
    where: { workspaceId },
  });
  const engine = createResponseEngine();

  for (const automation of automations) {
    const post =
      automation.campaignId && event.postExternalId
        ? await prisma.campaignPost.findFirst({
            where: {
              campaignId: automation.campaignId,
              platform: event.platform,
              externalId: event.postExternalId,
            },
          })
        : null;

    const definitions: KeywordDefinition[] = automation.keywords.map((rule) => ({
      intentKey: rule.intentKey,
      keyword: rule.keyword,
      aliases: rule.aliases,
      fuzzy: rule.fuzzy,
    }));

    const templates: Record<string, string> = { any: automation.messageTemplate };
    for (const rule of automation.keywords) {
      if (rule.responseText) templates[rule.intentKey] = rule.responseText;
    }

    const context: ResponseContext = {
      comment: event.text,
      username: event.fromUsername,
      campaignName: automation.campaign?.name ?? null,
      triggerMode: automation.triggerMode,
      keywordDefinitions: definitions,
      postSpecific: infoFromPost(post),
      campaign: automation.campaign
        ? {
            price: automation.campaign.price,
            location: automation.campaign.location,
            link: automation.campaign.productLink,
            description: automation.campaign.details,
            brochure: automation.campaign.brochureUrl,
          }
        : null,
      globalBusiness: business
        ? {
            location: business.address,
            address: business.address,
            link: business.defaultLocationLink ?? business.website,
            description: business.generalInformation,
          }
        : null,
      businessInformationActive: Boolean(business?.isActive),
      templates,
    };

    const composed = await engine.compose(context);
    if (!composed.shouldReply) continue;

    const pageToken = decryptSecret(channel.tokenEncrypted);
    let status = "sent";
    let error: string | null = null;

    try {
      if (automation.actionType === "COMMENT_REPLY") {
        await sender.commentReply({
          commentId: event.commentId,
          message: composed.message,
          pageAccessToken: pageToken,
        });
      } else {
        await sender.privateReply({
          commentId: event.commentId,
          message: composed.message,
          pageAccessToken: pageToken,
        });
      }
    } catch (sendError) {
      status = "failed";
      error =
        sendError instanceof Error ? sendError.message.slice(0, 500) : "unknown";
    }

    await prisma.automationLog.create({
      data: {
        workspaceId,
        automationId: automation.id,
        platform: event.platform,
        commentText: event.text.slice(0, 500),
        detectedIntents: composed.intents.map((intent) => intent.intentKey),
        campaignName: automation.campaign?.name ?? null,
        action: automation.actionType,
        status,
        error,
      },
    });

    if (status === "sent") {
      await recordConversation(prisma, workspaceId, event, automation, composed.message);
    }

    return {
      handled: status === "sent",
      reason: status === "sent" ? composed.reason : `Send failed: ${error}`,
      automationId: automation.id,
      message: composed.message,
    };
  }

  return { handled: false, reason: "No automation produced a reply for this comment." };
}

/** Mirrors the exchange into the inbox so the team can see what was sent. */
async function recordConversation(
  prisma: PrismaClient,
  workspaceId: string,
  event: CommentEvent,
  automation: { campaignId: string | null; campaign: { name: string } | null },
  message: string,
) {
  if (!event.fromId) return;

  const existingContact = await prisma.contact.findFirst({
    where: { workspaceId, platform: event.platform, externalId: event.fromId },
    select: { id: true },
  });

  const contact = existingContact
    ? await prisma.contact.update({
        where: { id: existingContact.id },
        data: {
          lastInteractionAt: event.createdAt,
          username: event.fromUsername,
        },
      })
    : await prisma.contact.create({
        data: {
          workspaceId,
          campaignId: automation.campaignId,
          platform: event.platform,
          externalId: event.fromId,
          username: event.fromUsername,
          name: event.fromUsername,
          lastInteractionAt: event.createdAt,
        },
      });

  const existingConversation = await prisma.conversation.findFirst({
    where: { workspaceId, contactId: contact.id, platform: event.platform },
  });

  const conversation =
    existingConversation ??
    (await prisma.conversation.create({
      data: {
        workspaceId,
        contactId: contact.id,
        platform: event.platform,
        campaignName: automation.campaign?.name ?? null,
      },
    }));

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        direction: "INBOUND",
        body: event.text.slice(0, 2000),
        automated: false,
      },
      {
        conversationId: conversation.id,
        direction: "OUTBOUND",
        body: message.slice(0, 2000),
        automated: true,
      },
    ],
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date(), unreadCount: { increment: 1 } },
  });
}
