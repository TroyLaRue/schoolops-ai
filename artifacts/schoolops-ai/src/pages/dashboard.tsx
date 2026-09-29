import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  useCompleteAgentRun,
  useCreateAgentRun,
  useUpdateAgentAction,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar, TopHeader } from '@/components/layout/shell';
import { AgentActivity } from '@/components/dashboard/agent-activity';
import { ChatWidget } from '@/components/dashboard/chat-widget';
import { AboutModal } from '@/components/dashboard/about-modal';
import { IssueCard } from '@/components/dashboard/issue-card';
import { Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button } from '@/components/ui';
import type { Issue } from '@/data/mock';
import { useSchoolOperations, useSchoolActivityHistory } from '@/lib/school-scoped-data';
import { useSchoolSession } from '@/lib/school-session';

function auditIssues(operations: NonNullable<ReturnType<typeof useSchoolOperations>['data']>): Issue[] {
  const issues: Issue[] = [];
  const missing = operations.students.filter((student) => student.missingDocuments.length > 0);
  if (missing.length) {
    issues.push({
      id: 'missing-documents',
      title: `${missing.length} Student Records Need Document Review`,
      category: 'Required Documents',
      severity: 'critical',
      evidence: `${missing.length} active-school student records have missing document flags.`,
      impact: 'Unverified records may require administrative follow-up. Confirm each record before contacting families.',
      actions: [{
        id: 'review-missing-documents',
        type: 'task',
        title: 'Review missing-document records',
        description: 'Verify the source record and deadline before preparing any outreach.',
        content: `Review ${missing.length} records in this school's active operations feed. Verify source documents and processing status before any family communication.`,
        status: 'pending',
      }],
    });
  }
  const atRisk = operations.students.filter((student) => student.attendanceRisk !== 'low');
  if (atRisk.length || operations.attendance.overallRate < operations.attendance.historicalRate) {
    issues.push({
      id: 'attendance-review',
      title: 'Attendance Signals Need Review',
      category: 'Attendance',
      severity: atRisk.some((student) => student.attendanceRisk === 'high') ? 'critical' : 'attention',
      evidence: `School attendance is ${operations.attendance.overallRate}% against a ${operations.attendance.historicalRate}% historical rate. Grade 11 is ${operations.attendance.grade11Rate}% with ${operations.attendance.grade11Absent} absences; ${atRisk.length} student records have a non-low attendance risk.`,
      impact: 'Review attendance source records and patterns before deciding on a support response.',
      actions: [{
        id: 'review-attendance',
        type: 'task',
        title: 'Review attendance signals',
        description: 'Check the underlying attendance records and route findings to the appropriate school team.',
        content: `Review active-school attendance: overall ${operations.attendance.overallRate}%, historical ${operations.attendance.historicalRate}%, Grade 11 ${operations.attendance.grade11Rate}% (${operations.attendance.grade11Absent} absences).`,
        status: 'pending',
      }],
    });
  }
  const overdue = operations.inquiries.filter((inquiry) =>
    inquiry.submittedDaysAgo >= 2
    && (inquiry.lastFollowUpDaysAgo === null || inquiry.lastFollowUpDaysAgo >= 2));
  if (overdue.length) {
    issues.push({
      id: 'inquiry-follow-up',
      title: `${overdue.length} Inquiries May Need Follow-up`,
      category: 'Admissions',
      severity: 'attention',
      evidence: `${overdue.length} active-school inquiries have no follow-up in the last 48 hours.`,
      impact: 'Timely follow-up can help admissions teams respond to prospective families.',
      actions: [{
        id: 'review-inquiries',
        type: 'task',
        title: 'Review aging inquiries',
        description: 'Confirm ownership and contact history before assigning follow-up.',
        content: `Review ${overdue.length} inquiries in this school's active operations feed and confirm the contact history before assigning work.`,
        status: 'pending',
      }],
    });
  }
  issues.push({
    id: 'tuition-summary',
    title: 'Tuition Account Summary',
    category: 'Tuition',
    severity: operations.tuition.pastDueAccounts > 0 ? 'attention' : 'healthy',
    evidence: `${operations.tuition.collectionRate}% collection rate; ${operations.tuition.currentAccounts} current accounts, ${operations.tuition.pastDueAccounts} past due, and ${operations.tuition.paymentPlanAccounts} on payment plans.`,
    impact: 'Account flags are for staff review only and do not authorize automated collection or student-status changes.',
    actions: operations.tuition.pastDueAccounts || operations.tuition.paymentPlanAccounts ? [{
      id: 'review-accounts',
      type: 'task',
      title: 'Review account flags',
      description: 'Verify payment posting, balance age, and current arrangements.',
      content: `Review this school's ${operations.tuition.pastDueAccounts} past-due and ${operations.tuition.paymentPlanAccounts} payment-plan account counts. No family outreach is prepared.`,
      status: 'pending',
    }] : [],
  });
  return issues;
}

export default function Dashboard() {
  const { currentSchool } = useSchoolSession();
  const canApprove = currentSchool?.membership.role === 'admin' || currentSchool?.membership.role === 'principal';
  const operations = useSchoolOperations();
  const history = useSchoolActivityHistory();
  const [isRunning, setIsRunning] = useState(false);
  const activeRunId = useRef<number | null>(null);
  const actionRecordIds = useRef<Record<string, number>>({});
  const [persistenceError, setPersistenceError] = useState('');
  const queryClient = useQueryClient();
  const createRun = useCreateAgentRun();
  const completeRun = useCompleteAgentRun();
  const updateAction = useUpdateAgentAction();
  const sourceData = operations.data;
  const baseIssues = useMemo(() => sourceData ? auditIssues(sourceData) : [], [sourceData]);
  const latestRunActions = history.data?.runs[0]?.issues.flatMap((issue) => issue.actions) ?? [];
  const issues = useMemo(() => baseIssues.map((issue) => ({
    ...issue,
    actions: issue.actions.map((action) => ({
      ...action,
      status: latestRunActions.find((stored) => stored.sourceId === action.id)?.status ?? action.status,
    })),
  })), [baseIssues, latestRunActions]);
  const activityLog = sourceData ? [
    'Starting morning audit for the active school…',
    `Reading ${sourceData.students.length} active-school student records.`,
    `Reviewing attendance summary: ${sourceData.attendance.overallRate}% current rate.`,
    `Checking ${sourceData.students.filter((student) => student.missingDocuments.length > 0).length} student records with document flags.`,
    `Reviewing ${sourceData.inquiries.length} admissions inquiries.`,
    `Reading active-school tuition summary: ${sourceData.tuition.collectionRate}% collected.`,
    `Prepared ${baseIssues.length} findings for human review.`,
    'Audit complete. No external actions were performed.',
  ] : [];

  const handleRunAudit = () => {
    if (!sourceData || operations.isError || isRunning) return;
    setPersistenceError('');
    setIsRunning(true);
    createRun.mutate({
      data: {
        activityLog,
        issues: baseIssues.map((issue) => ({
          sourceId: issue.id,
          title: issue.title,
          category: issue.category,
          severity: issue.severity,
          evidence: issue.evidence,
          impact: issue.impact,
          actions: issue.actions.map((action) => ({
            sourceId: action.id,
            type: action.type,
            title: action.title,
            description: action.description,
            content: action.content ?? null,
            recipient: null,
            subject: null,
            channel: null,
            reason: null,
            status: 'pending' as const,
          })),
        })),
      },
    }, {
      onSuccess: (run) => {
        activeRunId.current = run.id;
        for (const issue of run.issues) {
          for (const action of issue.actions) actionRecordIds.current[action.sourceId] = action.id;
        }
        void queryClient.invalidateQueries({ queryKey: ['/api/agent/history'] });
      },
      onError: () => {
        setIsRunning(false);
        setPersistenceError('The audit could not be saved to this school’s history. Please retry.');
      },
    });
  };

  const handleAuditComplete = useCallback(() => {
    setIsRunning(false);
    if (activeRunId.current) {
      completeRun.mutate({ id: activeRunId.current }, {
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['/api/agent/history'] }),
        onError: () => setPersistenceError('The audit completed, but its completion timestamp could not be saved.'),
      });
    }
  }, [completeRun, queryClient]);

  const persistActionStatus = (actionId: string, status: 'approved' | 'dismissed') => {
    const recordId = actionRecordIds.current[actionId]
      ?? latestRunActions.find((action) => action.sourceId === actionId)?.id;
    if (!recordId) {
      setPersistenceError('Run the morning audit to create a history record before approving or dismissing its recommendations.');
      return;
    }
    updateAction.mutate({ id: recordId, data: { status } }, {
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['/api/agent/history'] }),
      onError: () => setPersistenceError('The recommendation could not be saved. No external action was performed.'),
    });
  };

  const criticalIssues = issues.filter((issue) => issue.severity === 'critical');
  const attentionIssues = issues.filter((issue) => issue.severity === 'attention');
  const hasRunBefore = (history.data?.runs.length ?? 0) > 0;
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 pb-20 md:pb-0 md:pl-64 flex flex-col min-w-0">
        <TopHeader onRunAudit={handleRunAudit} isRunning={isRunning || createRun.isPending} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto relative">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {persistenceError && <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">{persistenceError}</div>}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Today’s Operations Brief</h2>
                <p className="text-muted-foreground mt-1 text-sm">Active-school operational summary. Findings are synthetic and require human review.</p>
                {sourceData && <div className="mt-3 flex flex-wrap items-center gap-2"><Badge variant="secondary" className="border border-primary/15 bg-primary/10 text-primary">{sourceData.source.label}</Badge><span className="text-xs text-muted-foreground">Generated {new Date(sourceData.source.generatedAt).toLocaleString()}</span></div>}
              </div>
              <AboutModal />
            </div>
            {operations.isLoading ? <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Loading operations for the active school…</div> : null}
            {operations.isError ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-destructive">Active-school operations could not be loaded. No other-school findings are shown. <Button variant="outline" className="ml-3" onClick={() => operations.refetch()}>Retry</Button></div> : null}
            {history.isError && <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">This school’s activity history could not be loaded. New findings remain visible, but history-based approvals are unavailable until history can be refreshed. <Button variant="outline" className="ml-3" onClick={() => history.refetch()}>Retry history</Button></div>}
            {sourceData && (
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6 xl:gap-8 xl:items-start">
                <div className="space-y-6">
                  <Tabs defaultValue="all" className="w-full min-w-0">
                    <div className="flex items-center justify-between mb-4">
                      <TabsList className="grid h-auto w-full grid-cols-3 bg-muted/50 p-1 sm:inline-flex sm:w-auto">
                        <TabsTrigger value="all" className="min-h-10 px-2 text-[11px] sm:px-3 sm:text-sm">All Items <Badge variant="secondary" className="ml-2 bg-background">{issues.length}</Badge></TabsTrigger>
                        <TabsTrigger value="critical" className="min-h-10 px-2 text-[11px] sm:px-3 sm:text-sm">Critical <Badge variant="destructive" className="ml-2">{criticalIssues.length}</Badge></TabsTrigger>
                        <TabsTrigger value="attention" className="min-h-10 px-2 text-[11px] sm:px-3 sm:text-sm">Attention <Badge variant="warning" className="ml-2">{attentionIssues.length}</Badge></TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="all" className="space-y-4 m-0">{issues.map((issue) => <IssueCard key={issue.id} issue={issue} actionsEnabled={canApprove && hasRunBefore && !isRunning} onActionApprove={(_, actionId) => persistActionStatus(actionId, 'approved')} onActionDismiss={(_, actionId) => persistActionStatus(actionId, 'dismissed')} />)}</TabsContent>
                    <TabsContent value="critical" className="space-y-4 m-0">{criticalIssues.map((issue) => <IssueCard key={issue.id} issue={issue} actionsEnabled={canApprove && hasRunBefore && !isRunning} onActionApprove={(_, actionId) => persistActionStatus(actionId, 'approved')} onActionDismiss={(_, actionId) => persistActionStatus(actionId, 'dismissed')} />)}{!criticalIssues.length && <div className="p-8 text-center border rounded-lg bg-card text-muted-foreground">No critical issues to display.</div>}</TabsContent>
                    <TabsContent value="attention" className="space-y-4 m-0">{attentionIssues.map((issue) => <IssueCard key={issue.id} issue={issue} actionsEnabled={canApprove && hasRunBefore && !isRunning} onActionApprove={(_, actionId) => persistActionStatus(actionId, 'approved')} onActionDismiss={(_, actionId) => persistActionStatus(actionId, 'dismissed')} />)}{!attentionIssues.length && <div className="p-8 text-center border rounded-lg bg-card text-muted-foreground">No items need attention.</div>}</TabsContent>
                  </Tabs>
                </div>
                <div className="space-y-6 flex flex-col xl:sticky xl:top-8 xl:h-[calc(100vh-120px)] pb-4 xl:pb-0">
                  <AgentActivity isRunning={isRunning} onComplete={handleAuditComplete} hasRunBefore={hasRunBefore} activityLog={isRunning ? activityLog : history.data?.runs[0]?.activityLog ?? activityLog} />
                  <div className="flex-1 min-h-[500px] lg:min-h-0 flex flex-col"><ChatWidget /></div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}