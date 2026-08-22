/**
 * Normalises the two very different Meta webhook payload shapes
 * (Instagram comments and Facebook Page feed comments) into one event type.
 */
export type CommentEvent = {
  platform: "INSTAGRAM" | "FACEBOOK";
  accountId: string;
  commentId: string;
  postExternalId: string | null;
  text: string;
  fromId: string | null;
  fromUsername: string | null;
  createdAt: Date;
};

type Change = {
  field?: string;
  value?: Record<string, unknown>;
};

type Entry = {
  id?: string;
  time?: number;
  changes?: Change[];
};

type Payload = {
  object?: string;
  entry?: Entry[];
};

function str(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function parseInstagramComment(entryId: string, value: Record<string, unknown>, at: Date) {
  const commentId = str(value.id);
  if (!commentId) return null;
  // Instagram echoes our own replies back; those carry a `parent_id`.
  const media = value.media as Record<string, unknown> | undefined;
  const from = value.from as Record<string, unknown> | undefined;
  return {
    platform: "INSTAGRAM" as const,
    accountId: entryId,
    commentId,
    postExternalId: str(media?.id),
    text: str(value.text) ?? "",
    fromId: str(from?.id),
    fromUsername: str(from?.username),
    createdAt: at,
  };
}

function parseFacebookComment(entryId: string, value: Record<string, unknown>, at: Date) {
  if (value.item !== "comment") return null;
  if (value.verb !== "add") return null;
  const commentId = str(value.comment_id);
  if (!commentId) return null;
  const from = value.from as Record<string, unknown> | undefined;
  return {
    platform: "FACEBOOK" as const,
    accountId: entryId,
    commentId,
    postExternalId: str(value.post_id),
    text: str(value.message) ?? "",
    fromId: str(from?.id),
    fromUsername: str(from?.name),
    createdAt: at,
  };
}

export function extractCommentEvents(payload: unknown): CommentEvent[] {
  const body = payload as Payload;
  const events: CommentEvent[] = [];

  for (const entry of body?.entry ?? []) {
    const entryId = str(entry.id);
    if (!entryId) continue;
    const at = entry.time ? new Date(entry.time * 1000) : new Date();

    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      if (body.object === "instagram" && change.field === "comments") {
        const event = parseInstagramComment(entryId, value, at);
        if (event) events.push(event);
      }
      if (body.object === "page" && change.field === "feed") {
        const event = parseFacebookComment(entryId, value, at);
        if (event) events.push(event);
      }
    }
  }

  return events.filter((event) => event.text.trim().length > 0);
}

/**
 * Comments authored by the connected account itself must never trigger an
 * automation, or a reply loop becomes possible.
 */
export function isSelfAuthored(event: CommentEvent) {
  return Boolean(event.fromId && event.fromId === event.accountId);
}
