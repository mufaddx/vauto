import { Badge, Card, EmptyState } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/app/form-parts";
import { ConfigNotice } from "@/components/app/config-notice";
import { tryWorkspace } from "@/lib/workspace-context";
import {
  addContactTag,
  deleteContact,
  removeContactTag,
  setContactStatus,
} from "@/lib/actions/library";

const STATUSES = ["open", "engaged", "converted", "closed"] as const;

const selectClass =
  "h-9 rounded-xl border border-border bg-card px-2 text-sm outline-none focus:border-accent";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; status?: string }>;
}) {
  const context = await tryWorkspace("/app/contacts");
  if (!context) return <ConfigNotice title="Contacts" />;

  const { platform, status } = await searchParams;

  const contacts = await context.prisma.contact.findMany({
    where: {
      workspaceId: context.workspaceId,
      ...(platform === "INSTAGRAM" || platform === "FACEBOOK" ? { platform } : {}),
      ...(status && STATUSES.includes(status as (typeof STATUSES)[number]) ? { status } : {}),
    },
    include: {
      campaign: { select: { name: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { lastInteractionAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">Contacts</h1>
      <p className="mt-1 text-sm text-secondary">
        Filter by Instagram, Facebook, campaign, tag, or date.
      </p>

      <form className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <select name="platform" className={selectClass} defaultValue={platform ?? ""}>
          <option value="">All platforms</option>
          <option value="INSTAGRAM">Instagram</option>
          <option value="FACEBOOK">Facebook</option>
        </select>
        <select name="status" className={selectClass} defaultValue={status ?? ""}>
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <SubmitButton variant="secondary" pendingLabel="…">
          Filter
        </SubmitButton>
      </form>

      {contacts.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Contacts will appear here after your first interaction."
            description="Name, username, platform, campaign, tags, last interaction, and status are stored when automations run."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {contact.name ?? contact.username ?? "Unknown"}
                  </p>
                  <p className="text-sm text-secondary">
                    {contact.platform}
                    {contact.username ? ` · @${contact.username}` : ""}
                    {contact.campaign ? ` · ${contact.campaign.name}` : ""}
                    {contact.lastInteractionAt
                      ? ` · ${contact.lastInteractionAt.toLocaleString("en-IN")}`
                      : ""}
                  </p>
                </div>
                <Badge tone={contact.status === "converted" ? "success" : "neutral"}>
                  {contact.status}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {contact.tags.map(({ tag }) => (
                  <form key={tag.id} action={removeContactTag}>
                    <input type="hidden" name="contactId" value={contact.id} />
                    <input type="hidden" name="tagId" value={tag.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-background-secondary px-2.5 py-1 text-xs text-secondary hover:text-danger"
                      title="Remove tag"
                    >
                      {tag.name} ×
                    </button>
                  </form>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <form action={addContactTag} className="flex items-center gap-2">
                  <input type="hidden" name="contactId" value={contact.id} />
                  <Input name="tag" placeholder="Add tag" className="h-9 w-40 text-sm" />
                  <SubmitButton variant="ghost" pendingLabel="…">
                    Add
                  </SubmitButton>
                </form>

                <form action={setContactStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={contact.id} />
                  <select name="status" className={selectClass} defaultValue={contact.status}>
                    {STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <SubmitButton variant="ghost" pendingLabel="…">
                    Update
                  </SubmitButton>
                </form>

                <form action={deleteContact}>
                  <input type="hidden" name="id" value={contact.id} />
                  <SubmitButton variant="ghost" pendingLabel="…">
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
