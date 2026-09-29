import { NORMALIZED_SCHOOL_DATA } from '@/data/schoolops-data';
import {
  DEMO_POLICY_DOCUMENTS,
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

function studentReasons(student: typeof NORMALIZED_SCHOOL_DATA.students[number]) {
  const reasons: string[] = [];
  if (student.missingDocuments.length > 0) {
    reasons.push(`Missing required document: ${student.missingDocuments.join(', ')}`);
  }
  if (student.attendanceRisk !== 'low') {
    reasons.push(`${student.attendanceRate}% attendance (${student.attendanceRisk} risk; school historical baseline ${NORMALIZED_SCHOOL_DATA.attendance.historicalRate}%)`);
  }
  if (student.tuitionStatus !== 'current') {
    reasons.push(`Account status: ${student.tuitionStatus.replace('_', ' ')}`);
  }
  if (student.enrollmentStatus !== 'active') {
    reasons.push(`Enrollment status: ${student.enrollmentStatus}`);
  }
  return reasons.length ? reasons : ['No current exception flags'];
}

function toStudentEvidence(student: typeof NORMALIZED_SCHOOL_DATA.students[number]): StudentEvidence {
  return {
    id: student.id,
    name: student.name,
    grade: student.grade,
    reasons: studentReasons(student),
  };
}

function isStudentAttentionQuestion(question: string) {
  return (
    (question.includes('student') || question.includes('learner')) &&
    (question.includes('attention') || question.includes('flag') || question.includes('concern') || question.includes('risk'))
  );
}

function gradeFromQuestion(question: string) {
  const numeric = question.match(/\b(6|7|8|9|10|11|12)(?:th|st|nd|rd)?\b/i);
  if (numeric) return Number(numeric[1]);
  const words: Record<string, number> = {
    sixth: 6, seventh: 7, eighth: 8, ninth: 9,
    tenth: 10, eleventh: 11, twelfth: 12,
  };
  return Object.entries(words).find(([word]) => question.toLowerCase().includes(word))?.[1];
}

export function answerSchoolOpsQuestion(
  rawQuestion: string,
  policyDocuments: PolicyDocumentLike[] = DEMO_POLICY_DOCUMENTS,
): AgentAnswer {
  const question = rawQuestion.toLowerCase();
  const grade = gradeFromQuestion(rawQuestion);
  const scopedStudents = grade
    ? NORMALIZED_SCHOOL_DATA.students.filter((student) => student.grade === grade)
    : NORMALIZED_SCHOOL_DATA.students;

  const isPolicyQuestion = question.includes('policy')
    || question.includes('handbook')
    || question.includes('procedure')
    || question.includes('requirement')
    || question.includes('required');

  if (isPolicyQuestion) {
    const citations = searchPolicySections(rawQuestion, policyDocuments);
    if (citations.length === 0) {
      return {
        facts: 'I could not find an active policy section in the current SchoolOps knowledge base that answers that question.',
        evidence: ['No policy citation was returned. The knowledge base may need a reviewed synthetic document for this topic.'],
        recommendation: 'Review the Knowledge area or ask an administrator to add the applicable policy before relying on a policy-based recommendation.',
        recommendationBasis: 'general-suggestion',
      };
    }
    return {
      facts: citations[0].quote,
      evidence: citations.slice(1).map((citation) => citation.quote),
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
    const scope = grade ? `Grade ${grade}` : 'the synthetic directory';
    const citations = citationsForCategory('enrollment', policyDocuments, ['immunization', 'missing-document']);
    return {
      facts: `${students.length} student${students.length === 1 ? '' : 's'} in ${scope} have missing required documents.`,
      evidence: students.length
        ? students.map((student) => `${student.id} · ${student.name}, Grade ${student.grade}: missing ${student.missingDocuments.filter(requestedDocument).join(', ')}`)
        : [`No missing-document flags found among ${scopedStudents.length} matching synthetic records.`],
      recommendation: students.length ? 'Prioritize records with a compliance deadline, then request the specific missing item from each family.' : 'No document follow-up is recommended for this group.',
      suggestedAction: students.length ? `Draft document reminders for ${students.length} famil${students.length === 1 ? 'y' : 'ies'}` : undefined,
      studentRecords: students.map((student) => ({
        ...toStudentEvidence(student),
        reasons: student.missingDocuments.filter(requestedDocument).map((document) => `Missing required document: ${document}`),
      })),
      citations,
      recommendationBasis: citations.length ? 'policy-grounded' : 'general-suggestion',
    };
  }

  if (question.includes('inquir') || question.includes('admission') || question.includes('follow-up') || question.includes('follow up')) {
    const overdue = NORMALIZED_SCHOOL_DATA.inquiries.filter((inquiry) =>
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
      facts: `${NORMALIZED_SCHOOL_DATA.tuition.collectionRate}% of tuition is collected. ${NORMALIZED_SCHOOL_DATA.tuition.pastDueAccounts} accounts are past due and ${NORMALIZED_SCHOOL_DATA.tuition.paymentPlanAccounts} are on payment plans school-wide.`,
      evidence: [
        ...flagged.map((student) => `${student.id} · ${student.name}: ${student.tuitionStatus === 'past_due' ? 'past due' : 'payment plan'}`),
        `Synthetic finance summary: ${NORMALIZED_SCHOOL_DATA.tuition.currentAccounts} current accounts`,
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
    return {
      facts: `Today's school-wide attendance is ${NORMALIZED_SCHOOL_DATA.attendance.overallRate}%, compared with a ${NORMALIZED_SCHOOL_DATA.attendance.historicalRate}% historical average. Grade 11 is lowest at ${NORMALIZED_SCHOOL_DATA.attendance.grade11Rate}% with ${NORMALIZED_SCHOOL_DATA.attendance.grade11Absent} absences.`,
      evidence: atRisk.map((student) => `${student.id} · ${student.name}, Grade ${student.grade}: ${student.attendanceRate}% attendance (${student.attendanceRisk} risk)`),
      recommendation: 'Investigate the Grade 11 variance first, then review high-risk students for recurring absence patterns.',
      suggestedAction: 'Draft a check-in request for Grade 11 advisors',
      studentRecords: atRisk.map((student) => ({
        ...toStudentEvidence(student),
        reasons: [
          `${student.attendanceRate}% attendance (${student.attendanceRisk} risk)`,
          `Compared with school historical baseline of ${NORMALIZED_SCHOOL_DATA.attendance.historicalRate}%`,
        ],
      })),
      citations,
      recommendationBasis: citations.length ? 'policy-grounded' : 'general-suggestion',
    };
  }

  if (isStudentAttentionQuestion(question)) {
    const flaggedStudents = scopedStudents.filter((student) => studentReasons(student)[0] !== 'No current exception flags');
    const categories = new Set<string>();
    flaggedStudents.forEach((student) => {
      if (student.attendanceRisk !== 'low') categories.add('attendance');
      if (student.missingDocuments.length) categories.add('enrollment');
      if (student.tuitionStatus !== 'current') categories.add('tuition');
    });
    const citations = [...categories].flatMap((category) => citationsForCategory(category as 'attendance' | 'enrollment' | 'tuition', policyDocuments)).slice(0, 3);
    return {
      facts: `${flaggedStudents.length} matching student record${flaggedStudents.length === 1 ? '' : 's'} have one or more current attention flags in the normalized SchoolOps data.`,
      evidence: [
        ...flaggedStudents.map((student) => `${student.id} · ${student.name}, Grade ${student.grade}: ${studentReasons(student).join('; ')}`),
        'Broader operational context is tracked separately in the attendance, admissions, and finance summaries.',
      ],
      recommendation: 'Review students with overlapping attendance, document, or account flags first, then route each follow-up through the appropriate school team.',
      suggestedAction: flaggedStudents.length ? `Stage follow-up review for ${flaggedStudents.length} flagged student record${flaggedStudents.length === 1 ? '' : 's'}` : undefined,
      studentRecords: flaggedStudents.map(toStudentEvidence),
      citations,
      recommendationBasis: citations.length ? 'policy-grounded' : 'general-suggestion',
    };
  }

  if (question.includes('priorit') || question.includes('today') || question.includes('urgent') || question.includes('morning')) {
    const citations = [
      ...citationsForCategory('enrollment', policyDocuments, ['missing-document']),
      ...citationsForCategory('attendance', policyDocuments, ['urgent patterns']),
    ];
    return {
      facts: 'Today has two critical priorities: missing compliance documents and the Grade 11 attendance anomaly. Aging admissions inquiries need attention; tuition collection is healthy overall.',
      evidence: [
        'Operations brief · Required Documents: critical',
        `Attendance feed · Grade 11: ${NORMALIZED_SCHOOL_DATA.attendance.grade11Rate}% vs. ${NORMALIZED_SCHOOL_DATA.attendance.historicalRate}% baseline`,
        `Admissions CRM · ${NORMALIZED_SCHOOL_DATA.inquiries.filter((item) => item.submittedDaysAgo >= 2 && (item.lastFollowUpDaysAgo === null || item.lastFollowUpDaysAgo >= 2)).length} overdue inquiries`,
        `Finance summary · ${NORMALIZED_SCHOOL_DATA.tuition.collectionRate}% collected`,
      ],
      recommendation: 'Address compliance before today’s deadline, investigate Grade 11 attendance by noon, then clear overdue admissions follow-ups.',
      suggestedAction: 'Create a prioritized follow-up task list',
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
      facts: `${scopedStudents.length} matching synthetic student records were found: ${highRisk} high attendance risk, ${missingDocs} with missing documents, and ${accountFlags} with account flags.`,
      evidence: scopedStudents.map((student) => `${student.id} · ${student.name}, Grade ${student.grade}: ${student.enrollmentStatus}; ${student.attendanceRate}% attendance`),
      recommendation: 'Review students with overlapping attendance, compliance, or account flags first.',
      studentRecords: scopedStudents.map(toStudentEvidence),
      citations,
      recommendationBasis: citations.length ? 'policy-grounded' : 'general-suggestion',
    };
  }

  return {
    facts: 'I could not map that question to a supported school-operations dataset.',
    evidence: ['Available synthetic sources: student directory, attendance feed, document status, admissions inquiries, tuition summary, and today’s operations brief.'],
    recommendation: 'Try asking about attendance, missing documents, inquiries, tuition flags, a grade level, or today’s priorities.',
    recommendationBasis: 'general-suggestion',
  };
}