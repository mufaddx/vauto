import { EmptyState } from "@/components/ui/card";

export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold">Contacts</h1>
      <p className="mt-1 text-sm text-secondary">Filter by Instagram, Facebook, campaign, tag, or date.</p>
      <div className="mt-6">
        <EmptyState
          title="Contacts will appear here after your first interaction."
          description="Name, username, platform, campaign, tags, last interaction, and status are stored when automations run."
        />
      </div>
    </div>
  );
}
