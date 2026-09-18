import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

let server;
let answerSchoolOpsQuestion;
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