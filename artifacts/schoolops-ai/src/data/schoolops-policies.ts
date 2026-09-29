export type PolicyCategory = 'handbook' | 'attendance' | 'enrollment' | 'tuition' | 'procedure';

export interface PolicyDocumentLike {
  id?: number;
  sourceId: string;
  title: string;
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
  title: string;
  section: string;
  quote: string;
  version: string;
  sourceKind: 'demo' | 'uploaded';
}

export const DEMO_POLICY_DOCUMENTS: PolicyDocumentLike[] = [
  {
    sourceId: 'POL-ATT-2026',
    title: 'Attendance & Student Support Policy',
    category: 'attendance',
    version: '2026.1',
    status: 'active',
    sourceKind: 'demo',
    content: `# Attendance & Student Support Policy
## Section 2. Daily attendance review
SchoolOps flags a student record for administrator review when rolling attendance falls below 90 percent or when a significant grade-level variance appears against the school baseline.
## Section 3. Support response
An attendance flag starts a support review, not an automatic disciplinary action. Staff should verify the underlying record, look for recurring absence patterns, and coordinate a human-reviewed family or advisor check-in.
## Section 4. Urgent patterns
Three consecutive unverified absences or a grade-level drop greater than 10 percentage points requires same-day review by the attendance team.`,
  },
  {
    sourceId: 'POL-ENR-2026',
    title: 'Enrollment & Required Documents Guide',
    category: 'enrollment',
    version: '2026.2',
    status: 'active',
    sourceKind: 'demo',
    content: `# Enrollment & Required Documents Guide
## Section 1. Required student records
The synthetic demo checklist includes an enrollment agreement, birth certificate, emergency contact, annual physical, and grade-appropriate immunization records.
## Section 2. Immunization review
Students in grades 6 through 12 are reviewed for a current Tdap booster record in this demonstration. A missing item creates a compliance review flag and must be verified by an administrator before any family communication.
## Section 3. Missing-document workflow
Staff should identify the exact missing document, confirm the record is not pending processing, and use a reviewed communication draft. SchoolOps must not represent a demo flag as a legal determination.`,
  },
  {
    sourceId: 'POL-TUI-2026',
    title: 'Tuition Account Review Policy',
    category: 'tuition',
    version: '2026.1',
    status: 'active',
    sourceKind: 'demo',
    content: `# Tuition Account Review Policy
## Section 2. Account flags
A past-due or payment-plan status creates an administrative review flag. The flag is context for staff and does not authorize automated collection, enrollment, or student-status changes.
## Section 3. Human review
Before contacting a family, staff should verify balance age, posted payments, active payment arrangements, and any approved accommodations.
## Section 4. Communications
Account communications must be reviewed by an authorized administrator and should use neutral language that does not disclose financial details outside the intended recipient.`,
  },
  {
    sourceId: 'POL-HBK-2026',
    title: 'School Operations Handbook',
    category: 'handbook',
    version: '2026.3',
    status: 'active',
    sourceKind: 'demo',
    content: `# School Operations Handbook
## Section 5. Agent recommendations
SchoolOps may summarize synthetic operational signals and recommend a next step. Recommendations must identify their supporting data source and, when applicable, the policy section used.
## Section 6. Human approval
No recommendation is permission to contact a family, change a student record, create an external task, or schedule an event. A designated administrator must review and approve each external action.
## Section 7. Source boundaries
Demo connector records and demo policies must be labeled synthetic. The system must not claim access to real school records or documents unless they were deliberately uploaded through an authorized workflow.`,
  },
  {
    sourceId: 'POL-PRO-2026',
    title: 'Operational Follow-up Procedure',
    category: 'procedure',
    version: '2026.1',
    status: 'active',
    sourceKind: 'demo',
    content: `# Operational Follow-up Procedure
## Section 1. Review sequence
Staff should review the evidence, confirm the policy basis, stage the recommended action, and record approval before taking an external action.
## Section 2. Communications
Synthetic Gmail demonstrations are limited to the connected test account. Draft approval and message delivery are separate recorded steps.
## Section 3. Calendar events
Calendar follow-ups require a persisted approved action. Events contain no attendees and send no updates unless a future authorized policy explicitly changes that behavior.`,
  },
];

const STOP_WORDS = new Set(['about', 'after', 'school', 'should', 'their', 'there', 'these', 'those', 'what', 'when', 'where', 'which', 'with']);

function tokens(value: string) {
  return value.toLowerCase().match(/[a-z0-9]+/g)?.filter((token) => token.length > 3 && !STOP_WORDS.has(token)) ?? [];
}

function sections(document: PolicyDocumentLike) {
  const blocks = document.content.split(/^##\s+/m).slice(1);
  return blocks.map((block, index) => {
    const [heading = `Section ${index + 1}`, ...body] = block.trim().split('\n');
    return { heading: heading.trim(), body: body.join(' ').replace(/\s+/g, ' ').trim() };
  }).filter((section) => section.body);
}

export function citationsForCategory(
  category: PolicyCategory,
  documents: PolicyDocumentLike[],
  preferredTerms: string[] = [],
): PolicyCitation[] {
  const document = documents.find((item) => item.status === 'active' && item.category === category);
  if (!document) return [];
  const candidates = sections(document);
  const section = candidates
    .map((item) => ({
      item,
      score: preferredTerms.reduce((score, term) => score + (item.heading.toLowerCase().includes(term) || item.body.toLowerCase().includes(term) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)[0]?.item;
  if (!section) return [];
  return [{
    id: `${document.sourceId}:${section.heading}`,
    sourceId: document.sourceId,
    title: document.title,
    section: section.heading,
    quote: section.body,
    version: document.version,
    sourceKind: document.sourceKind,
  }];
}

export function searchPolicySections(question: string, documents: PolicyDocumentLike[], limit = 3): PolicyCitation[] {
  const questionTokens = tokens(question);
  const categoryAliases: Record<PolicyCategory, string[]> = {
    handbook: ['handbook', 'approval', 'recommendation', 'source'],
    attendance: ['attendance', 'absent', 'absence', 'risk'],
    enrollment: ['enrollment', 'document', 'immunization', 'tdap', 'physical', 'requirement'],
    tuition: ['tuition', 'payment', 'past', 'account', 'financial'],
    procedure: ['procedure', 'workflow', 'calendar', 'gmail', 'follow'],
  };

  return documents
    .filter((document) => document.status === 'active')
    .flatMap((document) => sections(document).map((section) => {
      const haystack = `${document.title} ${document.category} ${section.heading} ${section.body}`.toLowerCase();
      const directScore = questionTokens.reduce((score, token) => score + (haystack.includes(token) ? 2 : 0), 0);
      const aliasScore = categoryAliases[document.category].reduce((score, token) => score + (question.toLowerCase().includes(token) ? 1 : 0), 0);
      return {
        score: directScore + aliasScore,
        citation: {
          id: `${document.sourceId}:${section.heading}`,
          sourceId: document.sourceId,
          title: document.title,
          section: section.heading,
          quote: section.body,
          version: document.version,
          sourceKind: document.sourceKind,
        } satisfies PolicyCitation,
      };
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.citation);
}