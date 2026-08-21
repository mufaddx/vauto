import {
  DEFAULT_ALIAS_SETS,
  detectIntents,
  type DetectedIntent,
  type KeywordDefinition,
} from "@/lib/engines/keywords";

export type InfoLayer = {
  price?: string | null;
  location?: string | null;
  address?: string | null;
  link?: string | null;
  description?: string | null;
  brochure?: string | null;
};

export type ResponseContext = {
  comment: string;
  username?: string | null;
  campaignName?: string | null;
  triggerMode: "KEYWORD" | "ANY_COMMENT";
  keywordDefinitions: KeywordDefinition[];
  postSpecific?: InfoLayer | null;
  campaign?: InfoLayer | null;
  globalBusiness?: InfoLayer | null;
  businessInformationActive: boolean;
  templates?: Record<string, string>;
};

export type ComposedResponse = {
  shouldReply: boolean;
  intents: DetectedIntent[];
  message: string;
  reason: string;
};

export interface ResponseEngine {
  compose(ctx: ResponseContext): Promise<ComposedResponse>;
}

function pickField(
  key: keyof InfoLayer,
  ctx: ResponseContext,
): string | null {
  const fromPost = ctx.postSpecific?.[key];
  if (fromPost) return fromPost;
  const fromCampaign = ctx.campaign?.[key];
  if (fromCampaign) return fromCampaign;
  if (ctx.businessInformationActive) {
    return ctx.globalBusiness?.[key] ?? null;
  }
  return null;
}

function defaultDefinitions(): KeywordDefinition[] {
  return Object.entries(DEFAULT_ALIAS_SETS).map(([intentKey, aliases]) => ({
    intentKey,
    keyword: aliases[0] ?? intentKey,
    aliases,
    fuzzy: true,
  }));
}

function interpolate(template: string, ctx: ResponseContext) {
  return template
    .replaceAll("{{username}}", ctx.username ?? "there")
    .replaceAll("{{first_name}}", ctx.username ?? "there")
    .replaceAll("{{campaign_name}}", ctx.campaignName ?? "")
    .replaceAll("{{link}}", pickField("link", ctx) ?? "");
}

export class RuleBasedResponseEngine implements ResponseEngine {
  async compose(ctx: ResponseContext): Promise<ComposedResponse> {
    const definitions =
      ctx.keywordDefinitions.length > 0
        ? ctx.keywordDefinitions
        : defaultDefinitions();

    if (ctx.triggerMode === "ANY_COMMENT") {
      const fallback =
        ctx.templates?.any ??
        `Hi {{username}} 👋 Thanks for your comment. We will share the details shortly.`;
      return {
        shouldReply: true,
        intents: [],
        message: interpolate(fallback, ctx),
        reason: "Any-comment automation matched.",
      };
    }

    const intents = detectIntents(ctx.comment, definitions);
    if (intents.length === 0) {
      return {
        shouldReply: false,
        intents,
        message: "",
        reason: "No keyword, alias, or fuzzy match.",
      };
    }

    const parts: string[] = [];
    for (const intent of intents) {
      const custom = ctx.templates?.[intent.intentKey];
      if (custom) {
        parts.push(interpolate(custom, ctx));
        continue;
      }
      if (intent.intentKey === "price") {
        const price = pickField("price", ctx);
        if (price) parts.push(`Price: ${price}`);
      } else if (intent.intentKey === "location" || intent.intentKey === "address") {
        const location = pickField("location", ctx) ?? pickField("address", ctx);
        if (location) parts.push(`Location: ${location}`);
      } else if (intent.intentKey === "link") {
        const link = pickField("link", ctx);
        if (link) parts.push(`View details: ${link}`);
      }
    }

    if (parts.length === 0) {
      return {
        shouldReply: false,
        intents,
        message: "",
        reason:
          "Intents matched but no post, campaign, or active business information was available.",
      };
    }

    const greeting = `Hi ${ctx.username ?? "there"} 👋`;
    return {
      shouldReply: true,
      intents,
      message: `${greeting}\n\n${parts.join("\n\n")}`,
      reason: "Combined matched intents into a single reply.",
    };
  }
}

/** Future Phase 2 plug-in point. Do not implement AI here. */
export class AIResponseEngine implements ResponseEngine {
  async compose(): Promise<ComposedResponse> {
    throw new Error("AIResponseEngine is reserved for Phase 2 and is not enabled.");
  }
}

export function createResponseEngine(): ResponseEngine {
  return new RuleBasedResponseEngine();
}
