export type IntentKey = "price" | "location" | "link" | "address" | string;

export type KeywordDefinition = {
  intentKey: IntentKey;
  keyword: string;
  aliases: string[];
  fuzzy?: boolean;
};

export type DetectedIntent = {
  intentKey: IntentKey;
  matched: string;
  method: "exact" | "alias" | "phrase" | "fuzzy";
};

const WORD_SPLIT = /[\s,./?!;:]+/;

export const DEFAULT_ALIAS_SETS: Record<string, string[]> = {
  price: [
    "price",
    "cost",
    "rate",
    "kitne ka",
    "kitna hai",
    "price kya hai",
  ],
  location: [
    "location",
    "loc",
    "address",
    "adress",
    "addr",
    "pata",
    "kaha hai",
    "where is it",
  ],
  address: [
    "address",
    "adress",
    "addr",
    "location",
    "loc",
    "pata",
    "kaha hai",
    "where is it",
  ],
  link: ["link", "url", "website", "site", "brochure"],
};

export function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i += 1) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const temp = row[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + cost);
      prev = temp;
    }
  }
  return row[n]!;
}

function termsFor(def: KeywordDefinition) {
  return [def.keyword, ...def.aliases]
    .map(normalizeText)
    .filter(Boolean);
}

function fuzzyMatch(word: string, term: string) {
  if (word.length < 4 || term.length < 4) return false;
  const distance = levenshtein(word, term);
  return distance <= 1;
}

export function detectIntents(
  comment: string,
  definitions: KeywordDefinition[],
): DetectedIntent[] {
  const normalized = normalizeText(comment);
  if (!normalized) return [];
  const words = normalized.split(WORD_SPLIT).filter(Boolean);
  const found: DetectedIntent[] = [];
  const seen = new Set<string>();

  for (const def of definitions) {
    const terms = termsFor(def);
    let match: DetectedIntent | null = null;

    for (const term of terms) {
      if (term.includes(" ") && normalized.includes(term)) {
        match = {
          intentKey: def.intentKey,
          matched: term,
          method: term === normalizeText(def.keyword) ? "phrase" : "alias",
        };
        break;
      }
      if (words.includes(term)) {
        match = {
          intentKey: def.intentKey,
          matched: term,
          method: term === normalizeText(def.keyword) ? "exact" : "alias",
        };
        break;
      }
      if (def.fuzzy !== false) {
        const hit = words.find((word) => fuzzyMatch(word, term));
        if (hit) {
          match = { intentKey: def.intentKey, matched: hit, method: "fuzzy" };
          break;
        }
      }
    }

    if (match && !seen.has(match.intentKey)) {
      seen.add(match.intentKey);
      found.push(match);
    }
  }

  return found;
}

export function anyCommentMatches(mode: "KEYWORD" | "ANY_COMMENT") {
  return mode === "ANY_COMMENT";
}
