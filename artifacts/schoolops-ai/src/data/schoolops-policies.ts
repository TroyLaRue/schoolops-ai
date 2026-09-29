export type PolicyCategory = 'handbook' | 'attendance' | 'enrollment' | 'tuition' | 'procedure';

export interface PolicyDocumentLike {
  id?: number;
  sourceId: string;
  title: string;
  filename?: string | null;
  category: PolicyCategory;
  content: string;
  version: string;
  effectiveDate?: string | Date | null;
  status: 'active' | 'archived';
  sourceKind: 'demo' | 'uploaded';
}

export interface PolicyCitation {
  id: string;
  sourceId: string;
  policyId?: string;
  title: string;
  filename?: string | null;
  section: string;
  quote: string;
  version: string;
  sourceKind: 'demo' | 'uploaded';
}

const STOP_WORDS = new Set(['about', 'after', 'school', 'should', 'their', 'there', 'these', 'those', 'what', 'when', 'where', 'which', 'with', 'policy', 'policies', 'section', 'rule', 'rules', 'does', 'have', 'from', 'under', 'current', 'student', 'students', 'please', 'explain', 'tell']);

function tokens(value: string) {
  return [...new Set(value.toLowerCase().match(/[a-z0-9]+/g)?.filter((token) => (token.length > 3 || /^\d+$/.test(token)) && !STOP_WORDS.has(token)) ?? [])];
}

function sections(document: PolicyDocumentLike) {
  const result: { heading: string; body: string; policyId?: string }[] = [];
  let heading: string | undefined;
  let body: string[] = [];
  const flush = () => {
    if (!heading) return;
    const text = body.join(' ').replace(/\s+/g, ' ').trim();
    if (text) result.push({
      heading,
      body: text,
      policyId: text.match(/\bPolicy\s*ID\s*:\s*([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\b/i)?.[1],
    });
  };
  for (const line of document.content.split(/\r?\n/)) {
    const markdown = line.match(/^#{2,6}\s+(.+?)\s*$/);
    const numbered = line.match(/^((?:Section\s+)?\d+(?:\.\d+)*\.\s+.+?)\s*$/i);
    if (markdown || numbered) {
      flush();
      heading = (markdown?.[1] ?? numbered?.[1])!.trim();
      body = [];
    } else if (heading) {
      body.push(line);
    }
  }
  flush();
  return result;
}

function citationFor(document: PolicyDocumentLike, section: ReturnType<typeof sections>[number]): PolicyCitation {
  return {
    id: `${document.sourceId}:${section.heading}`,
    sourceId: document.sourceId,
    policyId: section.policyId,
    title: document.title,
    filename: document.filename,
    section: section.heading,
    quote: section.body,
    version: document.version,
    sourceKind: document.sourceKind,
  };
}

const CATEGORY_TERMS: Record<PolicyCategory, string[]> = {
  handbook: ['handbook', 'approval', 'recommendation', 'source', 'principles'],
  attendance: ['attendance', 'absent', 'absence', 'absences', 'engagement'],
  enrollment: ['enrollment', 'document', 'documents', 'records', 'immunization', 'tdap'],
  tuition: ['tuition', 'payment', 'account', 'financial'],
  procedure: ['procedure', 'workflow', 'follow-up', 'calendar', 'communications'],
};

export function citationsForCategory(
  category: PolicyCategory,
  documents: PolicyDocumentLike[],
  preferredTerms: string[] = [],
): PolicyCitation[] {
  const ranked = documents.filter((document) => document.status === 'active')
    .flatMap((document) => sections(document).map((section) => {
      const heading = section.heading.toLowerCase();
      const body = section.body.toLowerCase();
      const sectionMatch = CATEGORY_TERMS[category].some((term) => heading.includes(term) || body.includes(term));
      return {
        score: (sectionMatch ? 1 : 0)
          + CATEGORY_TERMS[category].reduce((score, term) => score + (heading.includes(term) ? 4 : body.includes(term) ? 0.5 : 0), 0)
          + (document.category === category ? 2 : 0)
          + preferredTerms.reduce((score, term) => score + (heading.includes(term) ? 3 : body.includes(term) ? 2 : 0), 0),
        citation: citationFor(document, section),
        eligible: sectionMatch || document.category === category,
      };
    }))
    .filter((item) => item.eligible)
    .sort((a, b) => b.score - a.score);
  return ranked[0] ? [ranked[0].citation] : [];
}

export function searchPolicySections(question: string, documents: PolicyDocumentLike[], limit = 3): PolicyCitation[] {
  const questionTokens = tokens(question);
  if (!questionTokens.length) return [];
  return documents
    .filter((document) => document.status === 'active')
    .flatMap((document) => sections(document).map((section) => {
      const heading = section.heading.toLowerCase();
      const body = section.body.toLowerCase();
      const matches = questionTokens.filter((token) => heading.includes(token) || body.includes(token));
      const score = matches.reduce((total, token) => total + (heading.includes(token) ? 4 : 0) + (body.includes(token) ? 1 : 0) + (/^\d+$/.test(token) && body.includes(token) ? 4 : 0), 0)
        + (matches.length > 1 ? matches.length * 2 : 0);
      return {
        score,
        citation: citationFor(document, section),
      };
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.citation);
}