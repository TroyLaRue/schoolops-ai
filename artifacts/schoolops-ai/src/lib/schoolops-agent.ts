import { NORMALIZED_SCHOOL_DATA } from '@/data/schoolops-data';

export interface AgentAnswer {
  facts: string;
  evidence: string[];
  recommendation?: string;
  suggestedAction?: string;
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

export function answerSchoolOpsQuestion(rawQuestion: string): AgentAnswer {
  const question = rawQuestion.toLowerCase();
  const grade = gradeFromQuestion(rawQuestion);
  const scopedStudents = grade
    ? NORMALIZED_SCHOOL_DATA.students.filter((student) => student.grade === grade)
    : NORMALIZED_SCHOOL_DATA.students;

  if (question.includes('document') || question.includes('tdap') || question.includes('physical')) {
    const students = scopedStudents.filter((student) => student.missingDocuments.length > 0);
    const scope = grade ? `Grade ${grade}` : 'the synthetic directory';
    return {
      facts: `${students.length} student${students.length === 1 ? '' : 's'} in ${scope} have missing required documents.`,
      evidence: students.length
        ? students.map((student) => `${student.id} · ${student.name}: ${student.missingDocuments.join(', ')}`)
        : [`No missing-document flags found among ${scopedStudents.length} matching synthetic records.`],
      recommendation: students.length ? 'Prioritize records with a compliance deadline, then request the specific missing item from each family.' : 'No document follow-up is recommended for this group.',
      suggestedAction: students.length ? `Draft document reminders for ${students.length} famil${students.length === 1 ? 'y' : 'ies'}` : undefined,
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
    };
  }

  if (question.includes('tuition') || question.includes('payment') || question.includes('financial') || question.includes('past due')) {
    const flagged = scopedStudents.filter((student) => student.tuitionStatus !== 'current');
    return {
      facts: `${NORMALIZED_SCHOOL_DATA.tuition.collectionRate}% of tuition is collected. ${NORMALIZED_SCHOOL_DATA.tuition.pastDueAccounts} accounts are past due and ${NORMALIZED_SCHOOL_DATA.tuition.paymentPlanAccounts} are on payment plans school-wide.`,
      evidence: [
        ...flagged.map((student) => `${student.id} · ${student.name}: ${student.tuitionStatus === 'past_due' ? 'past due' : 'payment plan'}`),
        `Synthetic finance summary: ${NORMALIZED_SCHOOL_DATA.tuition.currentAccounts} current accounts`,
      ],
      recommendation: 'Review past-due balances by age and existing payment arrangements before contacting families.',
      suggestedAction: flagged.length ? `Prepare an account-review task for ${flagged.length} visible flagged record${flagged.length === 1 ? '' : 's'}` : undefined,
    };
  }

  if (question.includes('attendance') || question.includes('absent') || question.includes('risk')) {
    const atRisk = scopedStudents.filter((student) => student.attendanceRisk !== 'low');
    return {
      facts: `Today's school-wide attendance is ${DAILY_ATTENDANCE.overallRate}%, compared with a ${DAILY_ATTENDANCE.historicalRate}% historical average. Grade 11 is lowest at ${DAILY_ATTENDANCE.grade11Rate}% with ${DAILY_ATTENDANCE.grade11Absent} absences.`,
      evidence: atRisk.map((student) => `${student.id} · ${student.name}, Grade ${student.grade}: ${student.attendanceRate}% attendance (${student.attendanceRisk} risk)`),
      recommendation: 'Investigate the Grade 11 variance first, then review high-risk students for recurring absence patterns.',
      suggestedAction: 'Draft a check-in request for Grade 11 advisors',
    };
  }

  if (question.includes('priorit') || question.includes('today') || question.includes('urgent') || question.includes('morning')) {
    return {
      facts: 'Today has two critical priorities: missing compliance documents and the Grade 11 attendance anomaly. Aging admissions inquiries need attention; tuition collection is healthy overall.',
      evidence: [
        'Operations brief · Required Documents: critical',
        `Attendance feed · Grade 11: ${DAILY_ATTENDANCE.grade11Rate}% vs. ${DAILY_ATTENDANCE.historicalRate}% baseline`,
        `Admissions CRM · ${SYNTHETIC_INQUIRIES.filter((item) => item.submittedDaysAgo >= 2 && (item.lastFollowUpDaysAgo === null || item.lastFollowUpDaysAgo >= 2)).length} overdue inquiries`,
        `Finance summary · ${TUITION_SUMMARY.collectionRate}% collected`,
      ],
      recommendation: 'Address compliance before today’s deadline, investigate Grade 11 attendance by noon, then clear overdue admissions follow-ups.',
      suggestedAction: 'Create a prioritized follow-up task list',
    };
  }

  if (question.includes('student') || grade) {
    const highRisk = scopedStudents.filter((student) => student.attendanceRisk === 'high').length;
    const missingDocs = scopedStudents.filter((student) => student.missingDocuments.length > 0).length;
    const accountFlags = scopedStudents.filter((student) => student.tuitionStatus !== 'current').length;
    return {
      facts: `${scopedStudents.length} matching synthetic student records were found: ${highRisk} high attendance risk, ${missingDocs} with missing documents, and ${accountFlags} with account flags.`,
      evidence: scopedStudents.map((student) => `${student.id} · ${student.name}, Grade ${student.grade}: ${student.enrollmentStatus}; ${student.attendanceRate}% attendance`),
      recommendation: 'Review students with overlapping attendance, compliance, or account flags first.',
    };
  }

  return {
    facts: 'I could not map that question to a supported school-operations dataset.',
    evidence: ['Available synthetic sources: student directory, attendance feed, document status, admissions inquiries, tuition summary, and today’s operations brief.'],
    recommendation: 'Try asking about attendance, missing documents, inquiries, tuition flags, a grade level, or today’s priorities.',
  };
}