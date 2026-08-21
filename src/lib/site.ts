export const site = {
  name: "VIDLIX",
  domain: "vidlix.in",
  tagline: "Automate. Engage. Convert.",
  supportLine: "Turn social conversations into opportunities.",
  founder: "MD Mursalim",
  year: 2026,
  description:
    "Social automation built for modern businesses and creators.",
  emails: {
    support: process.env.PUBLIC_SUPPORT_EMAIL ?? "support@vidlix.in",
    grievance: process.env.PUBLIC_GRIEVANCE_EMAIL || null,
  },
  legal: {
    entity: process.env.PUBLIC_LEGAL_ENTITY || null,
    office: process.env.PUBLIC_REGISTERED_OFFICE || null,
    gstin: process.env.PUBLIC_GSTIN || null,
    cin: process.env.PUBLIC_CIN || null,
    phone: process.env.PUBLIC_PHONE || null,
    grievanceOfficer: process.env.PUBLIC_GRIEVANCE_OFFICER || null,
  },
  pricing: {
    starterMonthlyInr: 199,
    starterYearlyInr: 1990,
  },
} as const;

export const nav = {
  marketing: [
    { href: "/#product", label: "Product" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/#resources", label: "Resources" },
  ],
} as const;
