import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

let server;
let answerSchoolOpsQuestion;
let searchPolicySections;
let citationsForCategory;
let DEMO_POLICY_DOCUMENTS;
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
  ({ searchPolicySections, citationsForCategory, DEMO_POLICY_DOCUMENTS } = await server.ssrLoadModule('/src/data/schoolops-policies.ts'));
});

after(async () => {
  await server?.close();
});

test('returns concrete records and reasons for students needing attention today', () => {
  const answer = answerSchoolOpsQuestion('Which students need attention today?');

  assert.ok(answer.studentRecords?.length > 0);
  for (const student of answer.studentRecords) {
    assert.match(student.id, /^STU-/);
    assert.ok(student.name);
    assert.ok(Number.isInteger(student.grade));
    assert.ok(student.reasons.length > 0);
    assert.notDeepEqual(student.reasons, ['No current exception flags']);
  }
  assert.match(answer.recommendation, /review/i);
  assert.match(answer.suggestedAction, /review/i);
});

test('immunization questions exclude unrelated missing documents', () => {
  const answer = answerSchoolOpsQuestion('Show me the students missing immunization records');

  assert.ok(answer.studentRecords?.length > 0);
  for (const student of answer.studentRecords) {
    assert.ok(student.reasons.every((reason) => /tdap|immuniz|booster/i.test(reason)));
    assert.ok(student.reasons.every((reason) => !/physical/i.test(reason)));
  }
});

test('Grade 11 attendance questions return only Grade 11 attendance concerns', () => {
  const answer = answerSchoolOpsQuestion('Which Grade 11 students have attendance concerns?');

  assert.ok(answer.studentRecords?.length > 0);
  assert.ok(answer.studentRecords.every((student) => student.grade === 11));
  for (const student of answer.studentRecords) {
    assert.ok(student.reasons.some((reason) => /attendance/i.test(reason)));
    assert.ok(student.reasons.some((reason) => /historical baseline/i.test(reason)));
  }
});

test('admissions and finance questions remain operational summaries', () => {
  const admissions = answerSchoolOpsQuestion('Which admissions inquiries need follow-up?');
  const finance = answerSchoolOpsQuestion('What is the tuition collection status?');

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
  const docs = [...DEMO_POLICY_DOCUMENTS, uploaded];
  for (const question of [
    'What does the policy say about attendance below 85%?',
    'What happens when attendance falls below 85%?',
    'What happens after three consecutive unexcused absences?',
  ]) {
    const answer = answerSchoolOpsQuestion(question, docs);
    assert.match(answer.facts, /85% or 3 consecutive unexcused absences/);
    assert.equal(answer.citations?.[0].sourceId, uploaded.sourceId);
    assert.equal(answer.citations?.[0].filename, uploaded.filename);
    assert.equal(answer.citations?.[0].policyId, 'POL-ATT-101');
    assert.match(answer.citations?.[0].section, /^2\. ATTENDANCE AND ENGAGEMENT$/);
    assert.equal(answer.recommendationBasis, 'policy-grounded');
  }
});

test('section matching works across document categories without fabricating policy IDs', () => {
  const docs = [...DEMO_POLICY_DOCUMENTS, uploaded];
  assert.equal(citationsForCategory('attendance', [uploaded])[0]?.policyId, 'POL-ATT-101');
  assert.equal(searchPolicySections('attendance below 85%', docs)[0]?.sourceId, uploaded.sourceId);
  const builtIn = searchPolicySections('daily attendance review', DEMO_POLICY_DOCUMENTS)[0];
  assert.equal(builtIn.sourceId, 'POL-ATT-2026');
  assert.equal(builtIn.policyId, undefined);
  assert.equal(builtIn.section, 'Section 2. Daily attendance review');
});

test('archived sections and unrelated questions return no policy citation', () => {
  const archived = { ...uploaded, status: 'archived' };
  assert.deepEqual(searchPolicySections('attendance below 85%', [archived]), []);
  const answer = answerSchoolOpsQuestion('What is the policy on extraterrestrial parking?', [...DEMO_POLICY_DOCUMENTS, uploaded]);
  assert.equal(answer.citations, undefined);
  assert.match(answer.facts, /could not find an active policy section/i);
  assert.equal(answer.recommendationBasis, 'general-suggestion');
});

test('attendance statistics remain operational answers', () => {
  const answer = answerSchoolOpsQuestion('What is the overall attendance rate today?', [...DEMO_POLICY_DOCUMENTS, uploaded]);
  assert.match(answer.facts, /school-wide attendance/i);
  assert.notEqual(answer.facts, uploaded.content);
});