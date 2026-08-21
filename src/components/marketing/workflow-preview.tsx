const blocks = [
  { label: "WHEN", value: "Instagram comment" },
  { label: "IF", value: 'Comment contains "price"' },
  { label: "THEN", value: "Send private reply" },
];

export function WorkflowPreview() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow)] sm:p-8">
      <div className="grid gap-4 md:grid-cols-3">
        {blocks.map((block, index) => (
          <div key={block.label} className="rounded-2xl border border-border bg-background-secondary p-4">
            <p className="text-xs font-semibold tracking-[0.16em] text-accent">
              {index + 1 < 10 ? `0${index + 1}` : index + 1} {block.label}
            </p>
            <p className="mt-2 text-base font-medium">{block.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-border bg-background p-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-muted">MESSAGE</p>
        <p className="mt-3 whitespace-pre-line text-[15px] leading-7">
          {`Hi {{username}} 👋
Here is the price information...`}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Price", "Location", "Link"].map((label) => (
            <span
              key={label}
              className="rounded-full border border-border px-3 py-1.5 text-sm"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
