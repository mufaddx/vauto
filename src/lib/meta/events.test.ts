import { describe, expect, it } from "vitest";
import { extractCommentEvents, isSelfAuthored } from "@/lib/meta/events";

describe("extractCommentEvents", () => {
  it("reads an Instagram comment change", () => {
    const events = extractCommentEvents({
      object: "instagram",
      entry: [
        {
          id: "17841400000000000",
          time: 1_700_000_000,
          changes: [
            {
              field: "comments",
              value: {
                id: "comment-1",
                text: "price kya hai?",
                media: { id: "media-1" },
                from: { id: "user-1", username: "buyer" },
              },
            },
          ],
        },
      ],
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      platform: "INSTAGRAM",
      accountId: "17841400000000000",
      commentId: "comment-1",
      postExternalId: "media-1",
      text: "price kya hai?",
      fromUsername: "buyer",
    });
  });

  it("reads a Facebook page feed comment", () => {
    const events = extractCommentEvents({
      object: "page",
      entry: [
        {
          id: "page-1",
          time: 1_700_000_000,
          changes: [
            {
              field: "feed",
              value: {
                item: "comment",
                verb: "add",
                comment_id: "c-9",
                post_id: "post-9",
                message: "location?",
                from: { id: "u-9", name: "Asha" },
              },
            },
          ],
        },
      ],
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.platform).toBe("FACEBOOK");
    expect(events[0]?.postExternalId).toBe("post-9");
  });

  it("ignores edits and removals on Facebook", () => {
    const events = extractCommentEvents({
      object: "page",
      entry: [
        {
          id: "page-1",
          changes: [
            {
              field: "feed",
              value: { item: "comment", verb: "remove", comment_id: "c-1", message: "x" },
            },
            {
              field: "feed",
              value: { item: "status", verb: "add", message: "not a comment" },
            },
          ],
        },
      ],
    });
    expect(events).toHaveLength(0);
  });

  it("drops empty comment bodies", () => {
    const events = extractCommentEvents({
      object: "instagram",
      entry: [
        {
          id: "acct",
          changes: [{ field: "comments", value: { id: "c", text: "   " } }],
        },
      ],
    });
    expect(events).toHaveLength(0);
  });

  it("returns nothing for unrelated payloads", () => {
    expect(extractCommentEvents({ object: "page", entry: [] })).toEqual([]);
    expect(extractCommentEvents(null)).toEqual([]);
    expect(extractCommentEvents({})).toEqual([]);
  });
});

describe("isSelfAuthored", () => {
  const base = {
    platform: "INSTAGRAM" as const,
    commentId: "c",
    postExternalId: null,
    text: "hi",
    fromUsername: null,
    createdAt: new Date(),
  };

  it("flags comments written by the connected account", () => {
    expect(isSelfAuthored({ ...base, accountId: "a1", fromId: "a1" })).toBe(true);
  });

  it("allows comments from other users", () => {
    expect(isSelfAuthored({ ...base, accountId: "a1", fromId: "u2" })).toBe(false);
    expect(isSelfAuthored({ ...base, accountId: "a1", fromId: null })).toBe(false);
  });
});
