import type { SchoolOperations } from '@workspace/api-client-react';
import {
  citationsForCategory,
  searchPolicySections,
  type PolicyCitation,
  type PolicyDocumentLike,
} from '@/data/schoolops-policies';

export interface StudentEvidence {
  id: string;
  name: string;
  grade: number;
  reasons: string[];
}

export interface AgentAnswer {
  facts: string;
  evidence: string[];
  recommendation?: string;
  suggestedAction?: string;
  studentRecords?: StudentEvidence[];
  citations?: PolicyCitation[];
  recommendationBasis?: 'policy-grounded' | 'general-suggestion';
}

type OperationsStudent = SchoolOperations['students'][number];

function studentReasons(student: OperationsStudent, historicalRate: number) {
  const reasons: string[] = [];
  if (student.missingDocuments.length > 0) {
    reasons.push(`Missing required document: ${student.missingDocuments.join(', ')}`);
  }
  if (student.attendanceRisk !== 'low') {
    reasons.push(`${student.attendanceRate}% attendance (${student.attendanceRisk} risk; school historical baseline ${historicalRate}%)`);
  }
  if (student.tuitionStatus !== 'current') {
    reasons.push(`Account status: ${student.tuitionStatus.replace('_', ' ')}`);
  }
  if (student.enrollmentStatus !== 'active') {
    reasons.push(`Enrollment status: ${student.enrollmentStatus}`);
  }
  return reasons.length ? reasons : ['No current exception flags'];
}

function toStudentEvidence(student: OperationsStudent, historicalRate: number): StudentEvidence {
  return {
    id: student.id,
    name: student.name,
    grade: student.grade,
    reasons: studentReasons(student, historicalRate),
  };
}

function isStudentAttentionQuestion(question: string) {
  return (
    (question.includes('student') || question.includes('learner')) &&
    (question.includes('attention') || question.includes('flag') || question.includes('concern') || question.includes('risk'))
  );
}

function gradeFromQuestion(question: string) {
  const numeric = question.match(/\b(5|6|7|8|9|10|11|12)(?:th|st|nd|rd)?\b/i);
  if (numeric) return Number(numeric[1]);
  const words: Record<string, number> = {
    fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9,
    tenth: 10, eleventh: 11, twelfth: 12,
  };
  return Object.entries(words).find(([word]) => question.toLowerCase().includes(word))?.[1];
}

function concisePolicyAnswer(question: string, citation: PolicyCitation): string {
  const highPriority = citation.quote.match(/\bHigh priority:\s*Attendance below (\d+)% or (\d+) consecutive unexcused absences\b/i);
  if (highPriority && /\b(attendance|absence|absences|unexcused)\b/i.test(question)
    && /\b(high priority|consecutive|unexcused|85)\b/i.test(question)) {
    return `Below ${highPriority[1]}% attendance or ${highPriority[2]} consecutive unexcused absences.`;
  }

  const attention = citation.quote.match(/\bAttention:\s*Attendance below (\d+)%/i);
  if (attention && /\b(attendance|absence)\b/i.test(question) && /\b(90|attention|threshold)\b/i.test(question)) {
    return `Attendance below ${attention[1]}% triggers an attention flag for staff review.`;
  }

  const text = citation.quote
    .replace(/\bPolicy ID:\s*[A-Z][A-Z0-9-]+\s*/gi, '')
    .split(/\bExample policy-grounded answer:/i)[0];
  const sentences = text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  const terms = question.toLowerCase().match(/[a-z]{4,}|\d+/g)?.filter((term) =>
    !['what', 'which', 'when', 'does', 'about', 'policy', 'school', 'student', 'students', 'should', 'section'].includes(term)) ?? [];
  const ranked = sentences.map((sentence, index) => ({
    sentence,
    index,
    score: terms.filter((term) => sentence.toLowerCase().includes(term)).length,
  })).sort((a, b) => b.score - a.score || a.index - b.index);
  const match = ranked[0]?.sentence ?? '';
  return match.length > 240 ? `${match.slice(0, 237).trimEnd()}…` : match;
}

export function answerSchoolOpsQuestion(
  rawQuestion: string,
  operations: SchoolOperations,
  policyDocuments: PolicyDocumentLike[],
): AgentAnswer {
  const question = rawQuestion.toLowerCase();
  const grade = gradeFromQuestion(rawQuestion);
  const scopedStudents = grade
    ? operations.students.filter((student) => student.grade === grade)
    : operations.students;

  const attendanceRuleQuestion = /\b(attendance|absen(?:ce|ces|t)|unexcused)\b/.test(question)
    && (/\b(?:85|90)\s*(?:%|percent)(?!\w)/.test(question) || /\b(?:three|3)\s+consecutive\b/.test(question) || /\bthreshold\b/.test(question))
    && !/\b(how many|which students|list students|show students|count)\b/.test(question);
  const isPolicyQuestion = attendanceRuleQuestion || question.includes('policy')
    || question.includes('handbook')
    || question.includes('procedure')
    || question.includes('requirement')
    || question.includes('required');

  if (isPolicyQuestion) {
    const citations = searchPolicySections(rawQuestion.replace(/\bthree\s+consecutive\b/gi, '3 consecutive'), policyDocuments, 1);
    if (citations.length === 0) {
      return {
        facts: 'I could not find an active policy section in the current SchoolOps knowledge base that answers that question.',
        evidence: ['No policy citation was returned. The knowledge base may need a reviewed synthetic document for this topic.'],
        recommendation: 'Review the Knowledge area or ask an administrator to add the applicable policy before relying on a policy-based recommendation.',
        recommendationBasis: 'general-suggestion',
      };
    }
    return {
      facts: concisePolicyAnswer(question, citations[0]),
      evidence: [`Policy source: ${citations[0].title}, ${citations[0].section}${citations[0].policyId ? ` (${citations[0].policyId})` : ''}.`],
      recommendation: 'Use this policy as reviewed context, then verify the underlying operational record before approving any action.',
      citations,
      recommendationBasis: 'policy-grounded',
    };
  }

  if (question.includes('document') || question.includes('tdap') || question.includes('physical') || question.includes('immuniz') || question.includes('booster')) {
    const requestedDocument = question.includes('immuniz') || question.includes('tdap') || question.includes('booster')
      ? (document: string) => /tdap|immuniz|booster/i.test(document)
      : question.includes('physical')
        ? (document: string) => /physical/i.test(document)
        : () => true;
    const students = scopedStudents.filter((student) => student.missingDocuments.some(requestedDocument));
    const scope = grade ? `Grade ${grade}` : 'the active-school directory';
    const citations = citationsForCategory('enrollment', policyDocuments, ['immunization', 'missing-document']);
    return {
      facts: `${students.length} student${students.length === 1 ? '' : 's'} in ${scope} have missing required documents.`,
      evidence: students.length
        ? students.map((student) => `${student.id} · ${student.name}, Grade ${student.grade}: missing ${student.missingDocuments.filter(requestedDocument).join(', ')}`)
        : [`No missing-document flags found among ${scopedStudents.length} matching active-school records.`],
      recommendation: students.length ? 'Prioritize records with a compliance deadline, then request the specific missing item from each family.' : 'No document follow-up is recommended for this group.',
      suggestedAction: students.length ? `Draft document reminders for ${students.length} famil${students.length === 1 ? 'y' : 'ies'}` : undefined,
      studentRecords: students.map((student) => ({
        ...toStudentEvidence(student, operations.attendance.historicalRate),
        reasons: student.missingDocuments.filter(requestedDocument).map((document) => `Missing required document: ${document}`),
      })),
      citations,
      recommendationBasis: citations.length ? 'policy-grounded' : 'general-suggestion',
    };
  }

  if (question.includes('inquir') || question.includes('admission') || question.includes('follow-up') || question.includes('follow up')) {
    const overdue = operations.inquiries.filter((inquiry) =>
      inquiry.submittedDaysAgo >= 2 &&
      (inquiry.lastFollowUpDaysAgo === null || inquiry.lastFollowUpDaysAgo >= 2),
    );
    return {
      facts: `${overdue.length} inquiries have not received timely follow-up within 48 hours.`,
      evidence: overdue.map((inquiry) => `${inquiry.id} · ${inquiry.family}, Grade ${inquiry.grade}: submitted ${inquiry.submittedDaysAgo} days ago; ${inquiry.lastFollowUpDaysAgo === null ? 'no follow-up recorded' : `last follow-up ${inquiry.lastFollowUpDaysAgo} days ago`}`),
      recommendation: 'Assign these inquiries to admissions today, starting with families that have never been contacted.',
      suggestedAction: `Create ${overdue.length} admissions follow-up tasks`,
      recommendationBasis: 'general-suggestion',
    };
  }

  if (question.includes('tuition') || question.includes('payment') || question.includes('financial') || question.includes('past due')) {
    const flagged = scopedStudents.filter((student) => student.tuitionStatus !== 'current');
    const citations = citationsForCategory('tuition', policyDocuments, ['human review', 'account flags']);
    return {
      facts: `${operations.tuition.collectionRate}% of tuition is collected. ${operations.tuition.pastDueAccounts} accounts are past due and ${operations.tuition.paymentPlanAccounts} are on payment plans school-wide.`,
      evidence: [
        ...flagged.map((student) => `${student.id} · ${student.name}: ${student.tuitionStatus === 'past_due' ? 'past due' : 'payment plan'}`),
        `Active-school finance summary: ${operations.tuition.currentAccounts} current accounts`,
      ],
      recommendation: 'Review past-due balances by age and existing payment arrangements before contacting families.',
      suggestedAction: flagged.length ? `Prepare an account-review task for ${flagged.length} visible flagged record${flagged.length === 1 ? '' : 's'}` : undefined,
      citations,
      recommendationBasis: citations.length ? 'policy-grounded' : 'general-suggestion',
    };
  }

  if (question.includes('attendance') || question.includes('absent') || question.includes('risk')) {
    const atRisk = scopedStudents.filter((student) => student.attendanceRisk !== 'low');
    const citations = citationsForCategory('attendance', policyDocuments, ['daily attendance', 'support response']);
    const grade11Concern = operations.attendance.historicalRate - operations.attendance.grade11Rate >= 10;
    return {
      facts: `Today's school-wide attendance is ${operations.attendance.overallRate}%, compared with a ${operations.attendance.historicalRate}% historical average.${grade11Concern ? ` Grade 11 is at ${operations.attendance.grade11Rate}% with ${operations.attendance.grade11Absent} absences.` : ''}`,
      evidence: atRisk.map((student) => `${student.id} · ${student.name}, Grade ${student.grade}: ${student.attendanceRate}% attendance (${student.attendanceRisk} risk)`),
      recommendation: grade11Concern
        ? 'Investigate the Grade 11 variance first, then review high-risk students for recurring absence patterns.'
        : 'Review flagged attendance records for recurring absence patterns before planning follow-up.',
      suggestedAction: grade11Concern ? 'Draft a check-in request for Grade 11 advisors' : undefined,
      studentRecords: atRisk.map((student) => ({
        ...toStudentEvidence(student, operations.attendance.historicalRate),
        reasons: [
          `${student.attendanceRate}% attendance (${student.attendanceRisk} risk)`,
          `Compared with school historical baseline of ${operations.attendance.historicalRate}%`,
        ],
      })),
      citations,
      recommendationBasis: citations.length ? 'policy-grounded' : 'general-suggestion',
    };
  }

  if (isStudentAttentionQuestion(question)) {
    const flaggedStudents = scopedStudents.filter((student) => studentReasons(student, operations.attendance.historicalRate)[0] !== 'No current exception flags');
    const categories = new Set<string>();
    flaggedStudents.forEach((student) => {
      if (student.attendanceRisk !== 'low') categories.add('attendance');
      if (student.missingDocuments.length) categories.add('enrollment');
      if (student.tuitionStatus !== 'current') categories.add('tuition');
    });
    const citations = [...categories].flatMap((category) => citationsForCategory(category as 'attendance' | 'enrollment' | 'tuition', policyDocuments)).slice(0, 3);
    return {
      facts: `${flaggedStudents.length} matching student record${flaggedStudents.length === 1 ? '' : 's'} have one or more current attention flags in the active-school operations data.`,
      evidence: [
        ...flaggedStudents.map((student) => `${student.id} · ${student.name}, Grade ${student.grade}: ${studentReasons(student, operations.attendance.historicalRate).join('; ')}`),
        'Broader operational context is tracked separately in the attendance, admissions, and finance summaries.',
      ],
      recommendation: 'Review students with overlapping attendance, document, or account flags first, then route each follow-up through the appropriate school team.',
      suggestedAction: flaggedStudents.length ? `Stage follow-up review for ${flaggedStudents.length} flagged student record${flaggedStudents.length === 1 ? '' : 's'}` : undefined,
      studentRecords: flaggedStudents.map((student) => toStudentEvidence(student, operations.attendance.historicalRate)),
      citations,
      recommendationBasis: citations.length ? 'policy-grounded' : 'general-suggestion',
    };
  }

  if (question.includes('priorit') || question.includes('today') || question.includes('urgent') || question.includes('morning')) {
    const citations = [
      ...citationsForCategory('enrollment', policyDocuments, ['missing-document']),
      ...citationsForCategory('attendance', policyDocuments, ['urgent patterns']),
    ];
    const missingCount = operations.students.filter((student) => student.missingDocuments.length > 0).length;
    const overdueCount = operations.inquiries.filter((item) => item.submittedDaysAgo >= 2 && (item.lastFollowUpDaysAgo === null || item.lastFollowUpDaysAgo >= 2)).length;
    const priorities = [
      missingCount > 0 ? `${missingCount} student records have missing-document flags` : '',
      operations.attendance.overallRate < operations.attendance.historicalRate ? `attendance is ${operations.attendance.overallRate}% vs. ${operations.attendance.historicalRate}% historical` : '',
      overdueCount > 0 ? `${overdueCount} inquiries may need follow-up` : '',
      operations.tuition.pastDueAccounts > 0 ? `${operations.tuition.pastDueAccounts} accounts are past due` : '',
    ].filter(Boolean);
    return {
      facts: priorities.length ? `Active-school review priorities: ${priorities.join('; ')}.` : 'No exception patterns were identified in the available active-school operations summary.',
      evidence: [
        `Student directory · ${missingCount} records have missing-document flags`,
        `Attendance feed · ${operations.attendance.overallRate}% overall vs. ${operations.attendance.historicalRate}% historical baseline`,
        `Admissions · ${operations.inquiries.filter((item) => item.submittedDaysAgo >= 2 && (item.lastFollowUpDaysAgo === null || item.lastFollowUpDaysAgo >= 2)).length} overdue inquiries`,
        `Finance summary · ${operations.tuition.collectionRate}% collected`,
      ],
      recommendation: 'Verify the source records and applicable school policy before assigning or approving any follow-up.',
      suggestedAction: priorities.length ? 'Stage prioritized follow-up for human review' : undefined,
      citations,
      recommendationBasis: citations.length ? 'policy-grounded' : 'general-suggestion',
    };
  }

  if (question.includes('student') || grade) {
    const highRisk = scopedStudents.filter((student) => student.attendanceRisk === 'high').length;
    const missingDocs = scopedStudents.filter((student) => student.missingDocuments.length > 0).length;
    const accountFlags = scopedStudents.filter((student) => student.tuitionStatus !== 'current').length;
    const citations = [
      ...citationsForCategory('attendance', policyDocuments),
      ...citationsForCategory('enrollment', policyDocuments),
      ...citationsForCategory('tuition', policyDocuments),
    ];
    return {
      facts: `${scopedStudents.length} matching active-school student records were found: ${highRisk} high attendance risk, ${missingDocs} with missing documents, and ${accountFlags} with account flags.`,
      evidence: scopedStudents.map((student) => `${student.id} · ${student.name}, Grade ${student.grade}: ${student.enrollmentStatus}; ${student.attendanceRate}% attendance`),
      recommendation: 'Review students with overlapping attendance, compliance, or account flags first.',
      studentRecords: scopedStudents.map((student) => toStudentEvidence(student, operations.attendance.historicalRate)),
      citations,
      recommendationBasis: citations.length ? 'policy-grounded' : 'general-suggestion',
    };
  }

  return {
    facts: 'I could not map that question to a supported school-operations dataset.',
    evidence: ['Available active-school sources: student directory, attendance, document status, admissions inquiries, tuition summary, and operations brief.'],
    recommendation: 'Try asking about attendance, missing documents, inquiries, tuition flags, a grade level, or today’s priorities.',
    recommendationBasis: 'general-suggestion',
  };
}