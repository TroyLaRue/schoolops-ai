import { useState, type ReactNode } from 'react';
import { useGetGmailStatus, useGetCalendarStatus } from '@workspace/api-client-react';
import { Sidebar } from '@/components/layout/shell';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
  ArrowRight,
  Braces,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Clock3,
  Database,
  FileSpreadsheet,
  FlaskConical,
  HeartPulse,
  Info,
  Mail,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  WalletCards,
} from 'lucide-react';

type ConnectorStatus = 'connected' | 'demo' | 'planned' | 'available';

const statusStyles: Record<ConnectorStatus, { label: string; className: string }> = {
  connected: {
    label: 'Connected',
    className: 'border-success/20 bg-success/10 text-success',
  },
  demo: {
    label: 'Demo Connector',
    className: 'border-warning/25 bg-warning/10 text-warning-foreground',
  },
  planned: {
    label: 'Planned',
    className: 'border-border bg-muted/60 text-muted-foreground',
  },
  available: {
    label: 'Available',
    className: 'border-primary/20 bg-primary/10 text-primary',
  },
};

function StatusBadge({ status }: { status: ConnectorStatus }) {
  const config = statusStyles[status];
  return (
    <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
      {status === 'connected' ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : status === 'demo' ? (
        <FlaskConical className="h-3.5 w-3.5" />
      ) : status === 'available' ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <CircleDashed className="h-3.5 w-3.5" />
      )}
      {config.label}
    </Badge>
  );
}

function ConnectorIcon({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'teal' | 'amber' | 'violet';
}) {
  const toneStyles = {
    default: 'border-primary/15 bg-primary/10 text-primary',
    teal: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-700',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
    violet: 'border-violet-500/20 bg-violet-500/10 text-violet-700',
  };
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${toneStyles[tone]}`}>
      {children}
    </div>
  );
}

function IntegrationCard({
  name,
  description,
  status,
  icon,
  tone,
  children,
}: {
  name: string;
  description: string;
  status: ConnectorStatus;
  icon: ReactNode;
  tone?: 'default' | 'teal' | 'amber' | 'violet';
  children?: ReactNode;
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="gap-4 border-b bg-gradient-to-br from-card to-muted/20 pb-5">
        <div className="flex items-start justify-between gap-3">
          <ConnectorIcon tone={tone}>{icon}</ConnectorIcon>
          <StatusBadge status={status} />
        </div>
        <div>
          <CardTitle className="text-base">{name}</CardTitle>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-5 pt-5">{children}</CardContent>
    </Card>
  );
}

export default function Integrations() {
  const gmailConnection = useGetGmailStatus();
  const calendarConnection = useGetCalendarStatus();
  const [showSmartcareMapping, setShowSmartcareMapping] = useState(false);
  const [showImportMapping, setShowImportMapping] = useState(false);

  const gmailIsConnected = gmailConnection.data?.connected === true;
  const gmailIsChecking = gmailConnection.isLoading;

  const calendarIsConnected = calendarConnection.data?.connected === true;
  const calendarIsChecking = calendarConnection.isLoading;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-col pb-20 md:ml-64 md:pb-0">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-primary">SchoolOps control plane</p>
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">Integrations & data layer</h1>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <ShieldCheck className="h-4 w-4 text-success" />
            Human-reviewed operational data
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-8">
            <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-primary p-5 text-primary-foreground shadow-sm sm:p-8">
              <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[28px] border-primary-foreground/5" />
              <div className="pointer-events-none absolute -bottom-32 right-20 h-64 w-64 rounded-full border-[18px] border-primary-foreground/5" />
              <div className="relative max-w-3xl">
                <div className="mb-4 flex items-center gap-2 text-primary-foreground/70">
                  <Database className="h-4 w-4" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em]">Source registry / 04 active lanes</span>
                </div>
                <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-4xl">
                  Connect the work. Keep the meaning consistent.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/75 sm:text-base">
                  SchoolOps brings operational signals into one normalized layer before the agent reads them. That keeps recommendations grounded in shared school context, whether a record arrived by email, import, or a future connector.
                </p>
              </div>
              <div className="relative mt-7 grid max-w-2xl grid-cols-3 gap-2 border-t border-primary-foreground/15 pt-5 sm:gap-8">
                <div>
                  <div className="font-mono text-xl font-medium sm:text-2xl">01</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-primary-foreground/60">Sources</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-medium sm:text-2xl">02</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-primary-foreground/60">Normalized</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-medium sm:text-2xl">03</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-primary-foreground/60">Agent-ready</div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Connector registry</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">Your operational sources</h2>
                </div>
                <p className="max-w-md text-sm leading-5 text-muted-foreground sm:text-right">
                  Live access is deliberately separated from demo and planned sources.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <IntegrationCard
                  name="Gmail"
                  description="A connected demo account for reviewed, synthetic communications workflows."
                  status={gmailIsConnected ? 'connected' : 'planned'}
                  icon={<Mail className="h-5 w-5" />}
                >
                  {gmailIsChecking ? (
                    <div className="space-y-3" aria-label="Checking Gmail connection">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-full animate-pulse rounded bg-muted" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                    </div>
                  ) : gmailConnection.isError ? (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
                      <p className="font-medium text-destructive">Connection status unavailable</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">We could not verify the connected demo account.</p>
                      <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => gmailConnection.refetch()}>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry check
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/25 px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <HeartPulse className="h-4 w-4 text-success" />
                          <span className="text-sm font-medium">Connection verified</span>
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground">LIVE STATUS</span>
                      </div>
                      <dl className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <dt className="text-muted-foreground">Account label</dt>
                          <dd className="mt-1 truncate font-medium text-foreground">{gmailConnection.data?.accountLabel ?? 'Demo account'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Outbound actions</dt>
                          <dd className="mt-1 font-medium text-foreground">{gmailConnection.data?.canSend ? 'Approval required' : 'Disabled'}</dd>
                        </div>
                      </dl>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Synthetic data only. Sending stays constrained to the connected test account and an explicit human approval step.
                      </p>
                    </div>
                  )}
                </IntegrationCard>

                <IntegrationCard
                  name="Smartcare"
                  description="A safe demonstration surface for care and attendance-shaped workflows."
                  status="demo"
                  tone="teal"
                  icon={<Stethoscope className="h-5 w-5" />}
                >
                  <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                    <div className="flex gap-2.5">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
                      <p className="text-xs leading-5 text-muted-foreground">
                        Demo Connector uses synthetic records only. It is not connected to Smartcare or any live vendor system, and it does not import real student or care data.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full justify-between gap-2" onClick={() => setShowSmartcareMapping((value) => !value)}>
                    {showSmartcareMapping ? 'Hide demo mapping' : 'View demo mapping'}
                    {showSmartcareMapping ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  {showSmartcareMapping && (
                    <div className="rounded-lg bg-muted/35 p-3 font-mono text-[11px] leading-5 text-muted-foreground">
                      <div><span className="text-primary">source</span>: smartcare_demo</div>
                      <div><span className="text-primary">record</span>: attendance_signal</div>
                      <div><span className="text-primary">mode</span>: synthetic_only</div>
                    </div>
                  )}
                </IntegrationCard>

                <IntegrationCard
                  name="QuickBooks"
                  description="Planned source for budget context, purchasing patterns, and invoice signals."
                  status="planned"
                  tone="violet"
                  icon={<WalletCards className="h-5 w-5" />}
                >
                  <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/20 p-3">
                    <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-xs leading-5 text-muted-foreground">Connector design is being scoped. No QuickBooks data is accessed today.</p>
                  </div>
                </IntegrationCard>

                <IntegrationCard
                  name="Google Calendar"
                  description="A connected source for scheduling context and automated follow-ups."
                  status={calendarIsConnected ? 'connected' : 'planned'}
                  tone="amber"
                  icon={<CalendarDays className="h-5 w-5" />}
                >
                  {calendarIsChecking ? (
                    <div className="space-y-3" aria-label="Checking Calendar connection">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-full animate-pulse rounded bg-muted" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                    </div>
                  ) : calendarConnection.isError ? (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
                      <p className="font-medium text-destructive">Connection status unavailable</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">We could not verify the connected calendar account.</p>
                      <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => calendarConnection.refetch()}>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry check
                      </Button>
                    </div>
                  ) : calendarIsConnected ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/25 px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <HeartPulse className="h-4 w-4 text-success" />
                          <span className="text-sm font-medium">Connection verified</span>
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground">LIVE STATUS</span>
                      </div>
                      <dl className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <dt className="text-muted-foreground">Account label</dt>
                          <dd className="mt-1 truncate font-medium text-foreground">{calendarConnection.data?.accountLabel ?? 'Demo calendar'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Event creation</dt>
                          <dd className="mt-1 font-medium text-foreground">{calendarConnection.data?.canCreate ? 'Approval required' : 'Disabled'}</dd>
                        </div>
                      </dl>
                      <p className="text-xs leading-5 text-muted-foreground">
                        Synthetic tasks only. Follow-ups are created without attendees and require explicit human approval.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-lg border border-dashed bg-muted/20 p-3">
                      <div className="flex items-start gap-3">
                        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <p className="text-xs leading-5 text-muted-foreground">
                          Google Calendar is not connected with event-creation access. Complete OAuth in the workspace Integrations tool, then verify the connection here.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => calendarConnection.refetch()}>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Verify setup
                      </Button>
                    </div>
                  )}
                </IntegrationCard>

                <IntegrationCard
                  name="CSV / Excel Import"
                  description="Bring a prepared operational extract into the normalized SchoolOps layer."
                  status="available"
                  icon={<FileSpreadsheet className="h-5 w-5" />}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Available for structured, human-reviewed files
                    </div>
                    <Button variant="outline" className="w-full justify-between gap-2" onClick={() => setShowImportMapping((value) => !value)}>
                      {showImportMapping ? 'Hide accepted fields' : 'See accepted fields'}
                      {showImportMapping ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    {showImportMapping && (
                      <div className="flex flex-wrap gap-1.5">
                        {['student_id', 'event_date', 'status', 'owner', 'notes'].map((field) => (
                          <span key={field} className="rounded-md border bg-muted/35 px-2 py-1 font-mono text-[10px] text-muted-foreground">
                            {field}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </IntegrationCard>
              </div>
            </section>

            <section className="grid gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-7 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <Braces className="h-5 w-5" />
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em]">The SchoolOps data layer</span>
                </div>
                <h2 className="mt-3 max-w-md text-2xl font-semibold tracking-tight">Different sources. One operational vocabulary.</h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                  Each connector is translated into shared entities and signals before the agent sees it. The agent reasons over normalized fields, cites source evidence, and proposes a next action; it never treats a connector label as permission to act.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    ['01', 'Ingest', 'Capture the source record and preserve its origin.'],
                    ['02', 'Normalize', 'Map dates, people, ownership, and status to common fields.'],
                    ['03', 'Reason', 'Let the agent compare signals and draft a reviewable action.'],
                  ].map(([number, title, copy]) => (
                    <div key={number} className="flex gap-3">
                      <span className="font-mono text-[10px] text-primary">{number}</span>
                      <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{copy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 border-b pb-4">
                  <div>
                    <p className="text-sm font-semibold">Sample mapping</p>
                    <p className="mt-1 text-xs text-muted-foreground">Smartcare demo → normalized signal</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">SCHEMA V1</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="py-3 pr-3 font-medium">Source field</th>
                        <th className="px-3 py-3 font-medium">Normalized field</th>
                        <th className="py-3 pl-3 font-medium">Agent uses it for</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['client_ref', 'person.id', 'Identity matching'],
                        ['check_in_date', 'event.occurred_at', 'Timeline context'],
                        ['attendance_code', 'signal.status', 'Issue detection'],
                        ['case_owner', 'responsibility.owner', 'Routing a follow-up'],
                      ].map(([source, normalized, purpose]) => (
                        <tr key={source} className="border-b last:border-0">
                          <td className="py-3 pr-3 font-mono text-[11px] text-muted-foreground">{source}</td>
                          <td className="px-3 py-3 font-mono text-[11px] text-primary">{normalized}</td>
                          <td className="py-3 pl-3 text-muted-foreground">{purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/5 p-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Provenance stays attached to every normalized record, so an agent recommendation can be traced back to its source and reviewed before execution.
                  </p>
                </div>
              </div>
            </section>

            <div className="flex items-center justify-between gap-4 border-t pt-5 text-xs text-muted-foreground">
              <p>Connector permissions are reviewed separately from agent autonomy.</p>
              <div className="hidden items-center gap-1.5 font-mono sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Registry monitored
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}