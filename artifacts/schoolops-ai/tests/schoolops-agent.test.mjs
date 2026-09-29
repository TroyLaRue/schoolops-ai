import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

let server;
let answerSchoolOpsQuestion;
let searchPolicySections;
let citationsForCategory;
const testOperations = {
  students: [
    { id: 'TEST-01', name: 'Test Student One', grade: 11, attendanceRate: 79, attendanceRisk: 'high', missingDocuments: ['Tdap Booster'], enrollmentStatus: 'active', tuitionStatus: 'past_due' },
    { id: 'TEST-02', name: 'Test Student Two', grade: 7, attendanceRate: 86, attendanceRisk: 'medium', missingDocuments: ['Annual Physical'], enrollmentStatus: 'active', tuitionStatus: 'current' },
  ],
  inquiries: [{ id: 'INQ-TEST', family: 'Test Family', student: 'Test Student', grade: 9, submittedDaysAgo: 4, lastFollowUpDaysAgo: null, stage: 'new' }],
  attendance: { overallRate: 91, historicalRate: 94, grade11Rate: 81, grade11Absent: 3 },
  tuition: { collectionRate: 94, currentAccounts: 10, pastDueAccounts: 2, paymentPlanAccounts: 1 },
  source: { kind: 'synthetic', label: 'Test School', generatedAt: '2026-01-01T00:00:00.000Z' },
};
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

before(async () => {
  server = await createServer({
    configFile: false,
    root: projectRoot,
    resolve: {
      alias: {
        '@': path.join(projectRoot, 'src'),
      },
    },
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  });
  ({ answerSchoolOpsQuestion } = await server.ssrLoadModule('/src/lib/schoolops-agent.ts'));
  ({ searchPolicySections, citationsForCategory } = await server.ssrLoadModule('/src/data/schoolops-policies.ts'));
});

function answerFromTestSchool(question, policies = []) {
  return answerSchoolOpsQuestion(question, testOperations, policies);
}

after(async () => {
  await server?.close();
});

test('returns concrete records and reasons for students needing attention today', () => {
  const answer = answerFromTestSchool('Which students need attention today?');

  assert.ok(answer.studentRecords?.length > 0);
  for (const student of answer.studentRecords) {
    assert.match(student.id, /^TEST-/);
    assert.ok(student.name);
    assert.ok(Number.isInteger(student.grade));
    assert.ok(student.reasons.length > 0);
    assert.notDeepEqual(student.reasons, ['No current exception flags']);
  }
  assert.match(answer.recommendation, /review/i);
  assert.match(answer.suggestedAction, /review/i);
});

test('immunization questions exclude unrelated missing documents', () => {
  const answer = answerFromTestSchool('Show me the students missing immunization records');

  assert.ok(answer.studentRecords?.length > 0);
  for (const student of answer.studentRecords) {
    assert.ok(student.reasons.every((reason) => /tdap|immuniz|booster/i.test(reason)));
    assert.ok(student.reasons.every((reason) => !/physical/i.test(reason)));
  }
});

test('Grade 11 attendance questions return only Grade 11 attendance concerns', () => {
  const answer = answerFromTestSchool('Which Grade 11 students have attendance concerns?');

  assert.ok(answer.studentRecords?.length > 0);
  assert.ok(answer.studentRecords.every((student) => student.grade === 11));
  for (const student of answer.studentRecords) {
    assert.ok(student.reasons.some((reason) => /attendance/i.test(reason)));
    assert.ok(student.reasons.some((reason) => /historical baseline/i.test(reason)));
  }
});

test('admissions and finance questions remain operational summaries', () => {
  const admissions = answerFromTestSchool('Which admissions inquiries need follow-up?');
  const finance = answerFromTestSchool('What is the tuition collection status?');

  assert.equal(admissions.studentRecords, undefined);
  assert.equal(finance.studentRecords, undefined);
  assert.match(admissions.facts, /inquiries/i);
  assert.match(finance.facts, /tuition/i);
});

const uploaded = {
  sourceId: 'POL-UPL-test', title: 'SchoolOps AI Demo Policy Document', category: 'handbook',
  filename: 'SchoolOps_AI_Demo_Policy_Document.txt',
  version: '1.0', status: 'active', sourceKind: 'uploaded',
  content: `SchoolOps AI Demo Policy Document
1. PURPOSE AND OPERATING PRINCIPLES
Staff members review any external action before it is sent.

2. ATTENDANCE AND ENGAGEMENT
Policy ID: POL-ATT-101
Attention:
Attendance below 90% over the current review period.
High priority:
Attendance below 85% or 3 consecutive unexcused absences.
Agent response: Recommend family outreach and a follow-up task.

3. REQUIRED RECORDS AND ENROLLMENT DOCUMENTATION
Policy ID: POL-DOC-201
Missing required enrollment records should be reviewed by staff.`,
};

test('numbered uploaded sections outrank built-in policies on specific threshold questions', () => {
  const docs = [uploaded];
  for (const question of [
    'What does the policy say about attendance below 85%?',
    'What happens when attendance falls below 85%?',
    'What happens after three consecutive unexcused absences?',
    'Which attendance threshold makes a student high priority?',
  ]) {
    const answer = answerFromTestSchool(question, docs);
    assert.equal(answer.facts, 'Below 85% attendance or 3 consecutive unexcused absences.');
    assert.match(answer.citations?.[0].quote, /Attendance below 85% or 3 consecutive unexcused absences/);
    assert.equal(answer.citations?.[0].sourceId, uploaded.sourceId);
    assert.equal(answer.citations?.[0].filename, uploaded.filename);
    assert.equal(answer.citations?.[0].policyId, 'POL-ATT-101');
    assert.match(answer.citations?.[0].section, /^2\. ATTENDANCE AND ENGAGEMENT$/);
    assert.equal(answer.recommendationBasis, 'policy-grounded');
  }
});

test('section matching works across document categories without fabricating policy IDs', () => {
  const docs = [uploaded];
  assert.equal(citationsForCategory('attendance', [uploaded])[0]?.policyId, 'POL-ATT-101');
  assert.equal(searchPolicySections('attendance below 85%', docs)[0]?.sourceId, uploaded.sourceId);
  const matchingSection = searchPolicySections('attendance review', [uploaded])[0];
  assert.equal(matchingSection.sourceId, uploaded.sourceId);
  assert.equal(matchingSection.policyId, 'POL-ATT-101');
});

test('90 percent attention questions do not receive the 85 percent high-priority answer', () => {
  const answer = answerFromTestSchool('What is the 90% attendance attention threshold?', [uploaded]);
  assert.equal(answer.facts, 'Attendance below 90% triggers an attention flag for staff review.');
  assert.equal(answer.citations?.[0].policyId, 'POL-ATT-101');
});

test('archived sections and unrelated questions return no policy citation', () => {
  const archived = { ...uploaded, status: 'archived' };
  assert.deepEqual(searchPolicySections('attendance below 85%', [archived]), []);
  const answer = answerFromTestSchool('What is the policy on extraterrestrial parking?', [uploaded]);
  assert.equal(answer.citations, undefined);
  assert.match(answer.facts, /could not find an active policy section/i);
  assert.equal(answer.recommendationBasis, 'general-suggestion');
});

test('answers do not invent a policy ID when the source has none', () => {
  const answer = answerFromTestSchool('What is the daily attendance review policy?', [uploaded]);
  assert.ok(answer.facts.length <= 240);
  assert.equal(answer.citations[0].policyId, 'POL-ATT-101');
  assert.equal(answer.citations[0].sourceId, uploaded.sourceId);
});

test('attendance statistics remain operational answers', () => {
  const answer = answerFromTestSchool('What is the overall attendance rate today?', [uploaded]);
  assert.match(answer.facts, /school-wide attendance/i);
  assert.notEqual(answer.facts, uploaded.content);
});