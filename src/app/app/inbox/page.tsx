import Link from "next/link";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { SubmitButton } from "@/components/app/form-parts";
import { ConfigNotice } from "@/components/app/config-notice";
import { tryWorkspace } from "@/lib/workspace-context";
import { markConversationRead, setConversationStatus } from "@/lib/actions/library";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "assigned", label: "Assigned" },
  { key: "resolved", label: "Resolved" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function filterFor(tab: TabKey) {
  switch (tab) {
    case "unread":
      return { unreadCount: { gt: 0 } };
    case "instagram":
      return { platform: "INSTAGRAM" as const };
    case "facebook":
      return { platform: "FACEBOOK" as const };
    case "assigned":
      return { status: "ASSIGNED" as const };
    case "resolved":
      return { status: "RESOLVED" as const };
    default:
      return {};
  }
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; id?: string }>;
}) {
  const context = await tryWorkspace("/app/inbox");
  if (!context) return <ConfigNotice title="Inbox" />;

  const { tab: rawTab, id } = await searchParams;
  const tab = (TABS.find((item) => item.key === rawTab)?.key ?? "all") as TabKey;

  const conversations = await context.prisma.conversation.findMany({
    where: { workspaceId: context.workspaceId, ...filterFor(tab) },
    include: { contact: true },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });

  const activeId = id ?? conversations[0]?.id;
  const active = activeId
    ? await context.prisma.conversation.findFirst({
        where: { id: activeId, workspaceId: context.workspaceId },
        include: {
          contact: { include: { tags: { include: { tag: true } } } },
          messages: { orderBy: { createdAt: "asc" }, take: 50 },
        },
      })
    : null;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">Inbox</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={`/app/inbox?tab=${item.key}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              tab === item.key ? "bg-accent text-white" : "bg-card text-secondary",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {conversations.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No conversations yet"
            description="Threads appear here once an automation replies to a real comment."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-2">
            {conversations.map((item) => (
              <Link
                key={item.id}
                href={`/app/inbox?tab=${tab}&id=${item.id}`}
                className={cn(
                  "block w-full rounded-2xl border px-4 py-3 text-left",
                  activeId === item.id
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-card",
                )}
              >
                <div className="flex justify-between gap-2">
                  <p className="font-medium">
                    {item.contact.name ?? item.contact.username ?? "Unknown"}
                  </p>
                  {item.unreadCount > 0 ? (
                    <span className="rounded-full bg-accent px-2 text-xs text-white">
                      {item.unreadCount}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-secondary">
                  {item.platform}
                  {item.campaignName ? ` · ${item.campaignName}` : ""}
                </p>
              </Link>
            ))}
          </div>

          {active ? (
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {active.contact.name ?? active.contact.username ?? "Unknown"}
                  </p>
                  <p className="text-sm text-secondary">
                    {active.contact.username ? `@${active.contact.username}` : "no username"}
                    {active.campaignName ? ` · ${active.campaignName}` : ""}
                  </p>
                </div>
                <Badge tone="accent">{active.platform}</Badge>
              </div>

              <div className="mt-5 space-y-2">
                {active.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                      message.direction === "OUTBOUND"
                        ? "ml-auto bg-accent-soft text-accent"
                        : "bg-background-secondary",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.body}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      {message.automated ? "Automated · " : ""}
                      {message.createdAt.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              {active.contact.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {active.contact.tags.map(({ tag }) => (
                    <Badge key={tag.id}>{tag.name}</Badge>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <form action={markConversationRead}>
                  <input type="hidden" name="id" value={active.id} />
                  <SubmitButton variant="ghost" pendingLabel="…">
                    Mark read
                  </SubmitButton>
                </form>
                <form action={setConversationStatus}>
                  <input type="hidden" name="id" value={active.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={active.status === "RESOLVED" ? "OPEN" : "RESOLVED"}
                  />
                  <SubmitButton variant="secondary" pendingLabel="…">
                    {active.status === "RESOLVED" ? "Reopen" : "Resolve"}
                  </SubmitButton>
                </form>
              </div>

              <p className="mt-4 text-xs text-muted">
                Replies are sent by automations. Manual sending arrives with the
                Meta messaging permissions review.
              </p>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
