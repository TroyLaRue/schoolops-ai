import React, { useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Mail,
  MessageSquare,
  ShieldAlert,
  UserRound,
  XCircle,
} from 'lucide-react';
import { useGetActivityHistory, type ActivityHistory, type AgentAction } from '@workspace/api-client-react';
import { Sidebar } from '@/components/layout/shell';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'pending' | 'approved' | 'dismissed' | 'completed';
type TypeFilter = 'all' | 'communication' | 'task';

function formatDate(value: Date | string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusLabel(status: AgentAction['status']) {
  return status === 'pending' ? 'Needs review' : status.charAt(0).toUpperCase() + status.slice(1);
}

function statusClass(status: AgentAction['status']) {
  switch (status) {
    case 'approved':
      return 'border-success/30 bg-success/10 text-success';
    case 'completed':
      return 'border-primary/30 bg-primary/10 text-primary';
    case 'dismissed':
      return 'border-destructive/30 bg-destructive/10 text-destructive';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
}

function ActionRow({ action }: { action: AgentAction }) {
  const actionDate = action.completedAt ?? action.dismissedAt ?? action.approvedAt ?? action.createdAt;
  return (
    <div className="flex gap-3 border-t px-4 py-4 first:border-t-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {action.type === 'communication' ? <MessageSquare className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{action.title}</span>
          <span className={cn('rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', statusClass(action.status))}>
            {statusLabel(action.status)}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="capitalize">{action.type}</span>
          <span>{formatDate(actionDate)}</span>
          {action.recipient && <span className="flex items-center gap-1"><UserRound className="h-3 w-3" />{action.recipient}</span>}
        </div>
        <p className="text-sm text-muted-foreground">{action.description}</p>
        {action.subject && <p className="text-xs font-medium text-foreground">Subject: {action.subject}</p>}
      </div>
    </div>
  );
}

function RunCard({ run }: { run: ActivityHistory['runs'][number] }) {
  const actions = run.issues.flatMap((issue) => issue.actions);
  const criticalCount = run.issues.filter((issue) => issue.severity === 'critical').length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Morning Operations Audit
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(run.startedAt)}</span>
              <span>{run.issueCount} findings</span>
              <span>{actions.length} recommendations</span>
            </div>
          </div>
          <span className={cn('w-fit rounded-md border px-2.5 py-1 text-xs font-semibold capitalize', run.status === 'completed' ? 'border-success/30 bg-success/10 text-success' : 'border-border bg-muted text-muted-foreground')}>
            {run.status}
          </span>
        </div>
        {run.summary && <p className="pt-2 text-sm text-muted-foreground">{run.summary}</p>}
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {run.issues.map((issue) => (
            <div key={issue.id} className="p-4">
              <div className="flex gap-3">
                <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md', issue.severity === 'critical' ? 'bg-destructive/10 text-destructive' : issue.severity === 'attention' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success')}>
                  {issue.severity === 'critical' ? <ShieldAlert className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">{issue.title}</h3>
                    <span className="rounded-md border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{issue.category}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{issue.evidence}</p>
                  <p className="mt-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Impact:</span> {issue.impact}</p>
                </div>
              </div>
              {issue.actions.length > 0 && (
                <div className="ml-11 mt-3 rounded-md border bg-background">
                  {issue.actions.map((action) => <ActionRow key={action.id} action={action} />)}
                </div>
              )}
            </div>
          ))}
        </div>
        {criticalCount > 0 && (
          <div className="border-t bg-destructive/5 px-4 py-3 text-xs text-destructive">
            {criticalCount} critical finding{criticalCount === 1 ? '' : 's'} require administrator attention.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryLoading() {
  return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Loading persistent activity history…</CardContent></Card>;
}

export default function HistoryPage() {
  const { data, isLoading, isError } = useGetActivityHistory();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [type, setType] = useState<TypeFilter>('all');
  const [fromDate, setFromDate] = useState('');

  const filtered = useMemo(() => {
    if (!data) return { runs: [], actions: [] };
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const actions = data.actions.filter((action) => {
      const actionDate = new Date(action.createdAt);
      return (status === 'all' || action.status === status)
        && (type === 'all' || action.type === type)
        && (!from || actionDate >= from);
    });
    const matchingActionIds = new Set(actions.map((action) => action.id));
    const runs = data.runs.filter((run) => {
      const runDate = new Date(run.startedAt);
      const runActions = run.issues.flatMap((issue) => issue.actions);
      return (!from || runDate >= from)
        && (status === 'all' || runActions.some((action) => matchingActionIds.has(action.id)))
        && (type === 'all' || runActions.some((action) => matchingActionIds.has(action.id)));
    });
    return { runs, actions };
  }, [data, fromDate, status, type]);

  const counts = {
    runs: data?.runs.length ?? 0,
    findings: data?.runs.reduce((sum, run) => sum + run.issueCount, 0) ?? 0,
    actions: data?.actions.length ?? 0,
    completed: data?.actions.filter((action) => action.status === 'completed').length ?? 0,
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 pb-20 md:pb-0 md:pl-64 flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b bg-card px-4 py-2 sm:px-6">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Activity History</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">Persistent record of agent runs, findings, approvals, and completed actions.</p>
          </div>
          <Badge variant="secondary" className="shrink-0 gap-1.5 bg-primary/10 text-primary"><Clock3 className="h-3.5 w-3.5" /> Persistent log</Badge>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ['Agent runs', counts.runs],
                ['Findings', counts.findings],
                ['Tracked actions', counts.actions],
                ['Completed', counts.completed],
              ].map(([label, value]) => (
                <Card key={label as string}><CardContent className="p-4"><div className="text-2xl font-semibold">{value}</div><div className="mt-1 text-xs text-muted-foreground">{label}</div></CardContent></Card>
              ))}
            </div>

            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
                <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">
                  Status
                  <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="min-h-10 rounded-md border bg-background px-3 text-sm font-normal text-foreground">
                    <option value="all">All statuses</option>
                    <option value="pending">Needs review</option>
                    <option value="approved">Approved</option>
                    <option value="dismissed">Dismissed</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
                <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">
                  Action type
                  <select value={type} onChange={(event) => setType(event.target.value as TypeFilter)} className="min-h-10 rounded-md border bg-background px-3 text-sm font-normal text-foreground">
                    <option value="all">All types</option>
                    <option value="communication">Communications</option>
                    <option value="task">Tasks</option>
                  </select>
                </label>
                <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">
                  From date
                  <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="min-h-10 rounded-md border bg-background px-3 text-sm font-normal text-foreground" />
                </label>
                <Button variant="outline" className="min-h-10" onClick={() => { setStatus('all'); setType('all'); setFromDate(''); }}>Clear filters</Button>
              </CardContent>
            </Card>

            {isLoading && <HistoryLoading />}
            {isError && <Card><CardContent className="p-8 text-center text-sm text-destructive">Activity history could not be loaded. Check that the API server is running.</CardContent></Card>}

            {!isLoading && !isError && (
              <>
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Agent runs</h2>
                    <span className="text-xs text-muted-foreground">{filtered.runs.length} shown</span>
                  </div>
                  {filtered.runs.length ? filtered.runs.map((run) => <RunCard key={run.id} run={run} />) : <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No agent runs match these filters.</CardContent></Card>}
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Action trail</h2>
                    <span className="text-xs text-muted-foreground">{filtered.actions.length} shown</span>
                  </div>
                  <Card>
                    {filtered.actions.length ? filtered.actions.map((action) => <ActionRow key={action.id} action={action} />) : <CardContent className="p-8 text-center text-sm text-muted-foreground">No actions match these filters.</CardContent>}
                  </Card>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}