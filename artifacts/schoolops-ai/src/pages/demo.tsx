import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, BookOpenText, CalendarDays, Check, CheckCircle2, CircleHelp, ClipboardList, Clock3, FileCheck2, History, LockKeyhole, Mail, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

type FollowUp = 'email' | 'calendar' | 'skipped' | null;
type Walkthrough = { step: number; approvedAt: string | null; followUp: FollowUp; actionAt: string | null };
const STORAGE_KEY = 'schoolops-public-demo-v2';
const initial: Walkthrough = { step: 0, approvedAt: null, followUp: null, actionAt: null };
const stages = ['About this demo', 'The finding', 'Review the evidence', 'Human decision', 'Safe follow-up', 'Activity History'];

function readWalkthrough(): Walkthrough {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return initial;
    const value = parsed as Partial<Walkthrough>;
    if (!Number.isInteger(value.step) || typeof value.step !== 'number' || value.step < 0 || value.step > 5) return initial;
    if (value.approvedAt !== null && typeof value.approvedAt !== 'string' && value.approvedAt !== undefined) return initial;
    const approvedAt = typeof value.approvedAt === 'string' && !Number.isNaN(Date.parse(value.approvedAt)) ? value.approvedAt : null;
    if (value.step >= 4 && !approvedAt) return initial;
    if (value.followUp !== null && value.followUp !== 'email' && value.followUp !== 'calendar' && value.followUp !== 'skipped' && value.followUp !== undefined) return initial;
    const followUp = value.followUp ?? null;
    const actionAt = typeof value.actionAt === 'string' && !Number.isNaN(Date.parse(value.actionAt)) ? value.actionAt : null;
    if (value.step === 5 && (!followUp || (followUp !== 'skipped' && !actionAt))) return initial;
    return { step: value.step, approvedAt, followUp, actionAt };
  } catch {
    return initial;
  }
}

const actionButton = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#173766] px-6 text-sm font-semibold text-[#f8f9f6] transition-colors hover:bg-[#264c80] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173766]';
const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#d8e0e9] bg-[#fffefa] px-4 text-sm font-medium text-[#244062] transition-colors hover:bg-[#edf2f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173766]';

export default function Demo() {
  const [walkthrough, setWalkthrough] = useState<Walkthrough>(readWalkthrough);
  const { step, approvedAt, followUp, actionAt } = walkthrough;

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(walkthrough)); } catch { /* Storage can be unavailable; the in-tab walkthrough still works. */ }
  }, [walkthrough]);

  function advance() { setWalkthrough(current => current.step < 3 ? { ...current, step: current.step + 1 } : current); }
  function back() { setWalkthrough(current => current.step > 0 && current.step <= 3 ? { ...current, step: current.step - 1 } : current); }
  function approve() {
    setWalkthrough(current => current.step === 3 ? { ...current, step: 4, approvedAt: current.approvedAt ?? new Date().toISOString() } : current);
  }
  function completeFollowUp(choice: Exclude<FollowUp, null>) {
    setWalkthrough(current => current.step === 4 && current.approvedAt
      ? { ...current, step: 5, followUp: choice, actionAt: choice === 'skipped' ? null : new Date().toISOString() }
      : current);
  }
  function reset() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* The in-memory state is still cleared. */ }
    setWalkthrough({ ...initial });
  }

  return (
    <div className="min-h-[100dvh] bg-[#f5f7f8] text-[#14243b]">
      <header className="border-b border-[#dce4ec] bg-[#fffefa]">
        <div className="mx-auto flex min-h-17 max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-10">
          <Link href="/" data-testid="link-demo-home" className="flex items-center gap-3 rounded-md text-sm font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173766]">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-9 w-9 rounded-lg" /> SchoolOps AI
            <span className="ml-1 hidden border-l border-[#dce4ec] pl-3 text-xs font-medium text-[#697b90] sm:inline">Public walkthrough</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs font-medium text-[#667991] sm:inline-flex"><LockKeyhole className="h-3.5 w-3.5" /> No sign-in required</span>
            <button type="button" data-testid="button-reset-demo" onClick={reset} className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-semibold text-[#355475] hover:bg-[#edf2f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#173766]"><RotateCcw className="h-3.5 w-3.5" /> Restart demo</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-24 pt-10 md:px-10 md:pt-14">
        <div className="mb-10 grid gap-6 border-b border-[#dce4ec] pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#496c93]"><span className="h-2 w-2 rounded-full bg-[#c39350]" /> A guided case study · approximately 90 seconds</div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-.055em] sm:text-5xl lg:text-[3.7rem]">The evidence comes <span className="text-[#567394]">before the action.</span></h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#5d7188]">Follow one illustrative attendance finding from signal to review. Nothing here connects to a school workspace.</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#d9e3ec] bg-[#fffefa] px-4 py-3 text-xs font-medium text-[#526b86]"><ShieldCheck className="h-4 w-4 text-[#42678d]" /> Synthetic case · browser-local only</div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          <aside className="lg:sticky lg:top-6 lg:self-start" aria-label="Walkthrough progress">
            <div className="rounded-xl border border-[#dce4ec] bg-[#fffefa] p-5 shadow-[0_12px_34px_rgba(25,54,85,.035)]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#71849a]">Your path</span>
                 <span data-testid="text-demo-progress" className="font-mono text-xs font-medium text-[#31577c]">0{step + 1} / 06</span>
              </div>
               <div role="progressbar" aria-label="Walkthrough progress" aria-valuemin={1} aria-valuemax={6} aria-valuenow={step + 1} className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e5ebf1]"><div className="h-full rounded-full bg-[#476b91] transition-[width] duration-300" style={{ width: `${(step + 1) / 6 * 100}%` }} /></div>
              <ol className="mt-5 space-y-1">
                {stages.map((stage, index) => (
                  <li key={stage} aria-current={index === step ? 'step' : undefined} className={`flex items-center gap-3 rounded-md px-2 py-2.5 text-xs ${index === step ? 'bg-[#eaf0f6] font-semibold text-[#173766]' : index < step ? 'font-medium text-[#4b6989]' : 'text-[#8998a9]'}`}>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${index < step ? 'border-[#4b6989] bg-[#4b6989] text-[#fffefa]' : index === step ? 'border-[#173766] text-[#173766]' : 'border-[#cfd9e3]'}`}>{index < step ? <Check className="h-3 w-3" /> : index + 1}</span>{stage}
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-4 rounded-lg border border-[#dce4ec] bg-[#eef3f7] p-4 text-xs leading-relaxed text-[#5f748b]">
              <span className="mb-1 block font-semibold text-[#294969]">Next step</span>
               <span data-testid="text-demo-next-step">{step === 5 ? 'Review the demo-only history, then restart whenever you like.' : step === 4 ? 'Choose a simulated follow-up or skip to the demo history.' : `After this: ${stages[step + 1]}.`}</span>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#567394]"><span className="font-mono">0{step + 1}</span><span className="h-px w-6 bg-[#b9c8d8]" /> {stages[step]}</div>
              <span className="rounded-full border border-[#d8e1ea] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#657d96]">Illustrative only</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#d8e2eb] bg-[#fffefa] shadow-[0_20px_60px_rgba(23,55,102,.055)]">
              {step === 0 && <div data-testid="panel-demo-about" className="p-6 sm:p-10 lg:p-12">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8eff6] text-[#315a82]"><CircleHelp className="h-6 w-6" /></span>
                <p className="mt-8 text-[11px] font-bold uppercase tracking-[.2em] text-[#7590a9]">About this demo</p>
                 <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl">One case. Six deliberate steps.</h2>
                 <p className="mt-5 max-w-2xl text-base leading-7 text-[#5d7188]">This is a guided, synthetic example of how a school team could review a flagged issue before deciding what to do. Inspect the supporting evidence and sample policy, approve an <strong className="font-semibold text-[#274462]">internal review task</strong>, then optionally simulate a safe follow-up.</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#dce5ec] bg-[#f5f8fa] p-5"><LockKeyhole className="h-5 w-5 text-[#52759a]" /><h3 className="mt-3 text-sm font-semibold">A closed example</h3><p className="mt-2 text-sm leading-6 text-[#65788d]">The student, school, dates, policy and finding are invented. No tenant or student records are read.</p></div>
                   <div className="rounded-xl border border-[#dce5ec] bg-[#f5f8fa] p-5"><ClipboardList className="h-5 w-5 text-[#52759a]" /><h3 className="mt-3 text-sm font-semibold">No outside action</h3><p className="mt-2 text-sm leading-6 text-[#65788d]">Approval and optional follow-ups are simulated in this browser tab. No email, calendar event or database entry is created.</p></div>
                </div>
              </div>}

              {step === 1 && <div data-testid="panel-demo-finding">
                <div className="border-b border-[#e0e7ee] bg-[#f0f4f8] px-6 py-5 sm:px-10"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#607c99]">Illustrative morning review / attendance</span><span className="rounded-full border border-[#dfc9a6] bg-[#fbf2e5] px-3 py-1 text-[11px] font-semibold text-[#8a6030]">Needs a closer look</span></div></div>
                <div className="p-6 sm:p-10 lg:p-12">
                  <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f8ead7] font-serif text-2xl text-[#8a6030]">!</div><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#7489a1]">Flagged issue · synthetic student</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Attendance pattern for Maya R.</h2></div></div>
                  <p className="mt-6 max-w-2xl text-base leading-7 text-[#5c7087]">A repeated absence pattern merits human review, not an automatic conclusion. The case is flagged because the attendance log shows three unexcused absences across ten school days.</p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_1fr_1fr]">
                    <div className="rounded-lg border border-[#dce4ec] p-4"><div className="text-[10px] font-bold uppercase tracking-widest text-[#7c8fa4]">Window</div><div className="mt-3 text-lg font-semibold">10 school days</div><div className="mt-1 text-xs text-[#65788d]">Illustrative dates in March</div></div>
                    <div className="rounded-lg border border-[#dce4ec] p-4"><div className="text-[10px] font-bold uppercase tracking-widest text-[#7c8fa4]">Recorded absences</div><div className="mt-3 text-lg font-semibold">3 unexcused</div><div className="mt-1 text-xs text-[#65788d]">Mar 4, 7 and 12</div></div>
                    <div className="rounded-lg border border-[#dce4ec] p-4"><div className="text-[10px] font-bold uppercase tracking-widest text-[#7c8fa4]">Current status</div><div className="mt-3 text-lg font-semibold">Review needed</div><div className="mt-1 text-xs text-[#65788d]">No action taken</div></div>
                  </div>
                  <p className="mt-8 border-l-2 border-[#b9c9d9] pl-4 text-sm italic leading-6 text-[#62768c]">A flag is a prompt to look closer. It is not a judgment about the student or family.</p>
                </div>
              </div>}

              {step === 2 && <div data-testid="panel-demo-evidence" className="p-6 sm:p-10 lg:p-12">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8eff6] text-[#315a82]"><BookOpenText className="h-6 w-6" /></span>
                <p className="mt-7 text-[11px] font-bold uppercase tracking-[.18em] text-[#7489a1]">Trace the reasoning</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">What supports this flag?</h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#65788d]">Read both the sample attendance facts and the sample policy context before you decide whether the recommendation is appropriate.</p>
                <div className="mt-8 grid gap-5 xl:grid-cols-2">
                  <section className="rounded-xl border border-[#dce4ec] bg-[#f6f8fa] p-5 sm:p-6" aria-labelledby="demo-log-title"><div className="flex items-center gap-2 text-[#42678d]"><ClipboardList className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[.16em]">Evidence 01 · synthetic log</span></div><h3 id="demo-log-title" className="mt-4 text-lg font-semibold">Attendance entries</h3><div className="mt-4 divide-y divide-[#dce4ec] text-sm">{[['Mar 4', 'Unexcused absence'], ['Mar 7', 'Unexcused absence'], ['Mar 12', 'Unexcused absence']].map(([date, event]) => <div key={date} className="flex justify-between gap-3 py-3"><span className="font-mono text-xs text-[#58728d]">{date}</span><span className="text-right text-[#304a65]">{event}</span></div>)}</div><p className="mt-4 text-xs leading-5 text-[#71849a]">Illustrative ten-school-day window. No live register was queried.</p></section>
                  <section className="rounded-xl border border-[#dce4ec] bg-[#f6f8fa] p-5 sm:p-6" aria-labelledby="demo-policy-title"><div className="flex items-center gap-2 text-[#42678d]"><FileCheck2 className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[.16em]">Evidence 02 · synthetic policy</span></div><h3 id="demo-policy-title" className="mt-4 text-lg font-semibold">Attendance review guidance</h3><div className="mt-2 font-mono text-xs font-semibold text-[#62809d]">ID: DEMO-ATT-04 · illustrative excerpt</div><blockquote className="mt-5 border-l-2 border-[#8ea9c3] pl-4 text-sm leading-7 text-[#3b5671]">“When three unexcused absences appear within ten school days, a staff member should check the attendance record and relevant context before determining whether any follow-up is appropriate.”</blockquote><p className="mt-5 text-xs leading-5 text-[#71849a]">This policy is invented for the demo. It is not legal, district or school guidance.</p></section>
                </div>
                <div className="mt-6 flex items-start gap-3 rounded-lg border border-[#dce4ec] bg-[#eef3f7] p-4 text-sm leading-6 text-[#405d7a]"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>Interpretation:</strong> the example meets the review threshold. The evidence does not establish why the absences occurred.</span></div>
              </div>}

              {step === 3 && <div data-testid="panel-demo-decision" className="p-6 sm:p-10 lg:p-12">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8eff6] text-[#315a82]"><ShieldCheck className="h-6 w-6" /></span>
                <p className="mt-7 text-[11px] font-bold uppercase tracking-[.18em] text-[#7489a1]">Decision point · your approval required</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">A recommendation, not an instruction.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#65788d]">The evidence suggests an internal review. You decide whether to approve this proposed next step in the demo.</p>
                <div className="mt-8 rounded-xl border border-[#cddce9] bg-[#f2f6f9] p-5 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#59799a]">Recommended internal action</span><span className="rounded-full bg-[#e1ebf4] px-3 py-1 text-xs font-medium text-[#315a82]">Awaiting your decision</span></div>
                  <h3 className="mt-5 text-xl font-semibold">Review Maya R.’s attendance record</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#526b84]">Ask an authorized staff member to verify the three entries and consider relevant context before determining whether a follow-up is needed.</p>
                  <div className="mt-6 border-t border-[#d5e1eb] pt-5 text-xs leading-5 text-[#667e96]"><strong className="text-[#2f4d6b]">Not included:</strong> contacting anyone, sending a message, scheduling a meeting, changing a student record or creating a real task.</div>
                </div>
                <p className="mt-6 text-xs leading-5 text-[#71849a]">Selecting “Approve in demo” records only your browser-local demonstration decision. It does not act on a school workspace.</p>
              </div>}

              {step === 4 && approvedAt && <div data-testid="panel-demo-follow-up" className="p-6 sm:p-10 lg:p-12">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f2ef] text-[#3e7468]"><CheckCircle2 className="h-6 w-6" /></span>
                <p className="mt-7 text-[11px] font-bold uppercase tracking-[.18em] text-[#608779]">Internal review approved · demo only</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">What could happen next?</h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#65788d]">In a school workspace, an authorized person could separately decide whether to use a connected account. This public walkthrough has no school membership or connector access, so these options <strong className="font-semibold text-[#304e6d]">simulate the follow-up only</strong>. Nothing is sent or scheduled.</p>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col rounded-xl border border-[#dce4ec] bg-[#f6f8fa] p-5">
                    <Mail className="h-5 w-5 text-[#42678d]" />
                    <h3 className="mt-4 text-lg font-semibold">Synthetic Gmail message</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-[#60758b]">Preview a harmless test follow-up with no address, student details, or outside delivery.</p>
                    <button type="button" data-testid="button-demo-simulate-email" onClick={() => completeFollowUp('email')} className={`${secondaryButton} mt-5 w-full`}>Simulate email <ArrowRight className="h-4 w-4" /></button>
                  </div>
                  <div className="flex flex-col rounded-xl border border-[#dce4ec] bg-[#f6f8fa] p-5">
                    <CalendarDays className="h-5 w-5 text-[#42678d]" />
                    <h3 className="mt-4 text-lg font-semibold">Synthetic calendar review</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-[#60758b]">Preview an internal review reminder with no attendees, notification, or real event.</p>
                    <button type="button" data-testid="button-demo-simulate-calendar" onClick={() => completeFollowUp('calendar')} className={`${secondaryButton} mt-5 w-full`}>Simulate calendar <ArrowRight className="h-4 w-4" /></button>
                  </div>
                </div>
                <button type="button" data-testid="button-demo-skip-follow-up" onClick={() => completeFollowUp('skipped')} className="mt-6 min-h-10 text-sm font-medium text-[#45698e] underline underline-offset-4 hover:text-[#173766]">Skip external follow-up and view history</button>
              </div>}

              {step === 5 && approvedAt && <div data-testid="panel-demo-history" className="p-6 sm:p-10 lg:p-12">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f2ef] text-[#3e7468]"><CheckCircle2 className="h-6 w-6" /></span>
                <p className="mt-7 text-[11px] font-bold uppercase tracking-[.18em] text-[#608779]">Walkthrough complete</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">A decision with a clear trail.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#65788d]">Your approval{followUp !== 'skipped' ? ' and simulated follow-up have' : ' has'} been recorded for this demo tab. Nothing was added to a school workspace.</p>
                <section aria-labelledby="demo-history-title" className="mt-8 overflow-hidden rounded-xl border border-[#d7e3e8]">
                  <div className="flex items-center gap-2 border-b border-[#dce6eb] bg-[#eff5f6] px-5 py-4 text-[#335d69]"><History className="h-4 w-4" /><h3 id="demo-history-title" className="text-sm font-semibold">Activity History · demo only</h3></div>
                  <div data-testid="entry-demo-history" className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-sm font-semibold">Internal attendance review approved</div><div className="mt-1 text-xs text-[#6c8195]">Synthetic case · Maya R. · DEMO-ATT-04</div></div><span className="rounded-full bg-[#e8f2ed] px-3 py-1 text-xs font-semibold text-[#397064]">Approved in demo</span></div><div className="mt-5 flex items-start gap-2 border-t border-[#e3e9ee] pt-4 text-xs leading-5 text-[#61798e]"><Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span data-testid="text-demo-approval-time">Approved locally on {new Date(approvedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div><p className="mt-3 text-xs font-medium leading-5 text-[#42647e]">This is a browser-local demo record in this tab, not an entry in any school workspace or database. No real task was created.</p></div>
                  {followUp !== 'skipped' && actionAt && <div data-testid="entry-demo-follow-up" className="border-t border-[#dce6eb] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-sm font-semibold">{followUp === 'email' ? 'Synthetic Gmail follow-up' : 'Synthetic calendar review'}</div><div className="mt-1 text-xs text-[#6c8195]">Illustrative follow-up · after human approval</div></div><span className="rounded-full bg-[#eaf0f6] px-3 py-1 text-xs font-semibold text-[#315a82]">Simulated only</span></div><p className="mt-4 text-xs leading-5 text-[#61798e]">Simulated locally on {new Date(actionAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}. {followUp === 'email' ? 'No message was sent.' : 'No event or attendee was created.'}</p></div>}
                  {followUp === 'skipped' && <p data-testid="text-demo-follow-up-skipped" className="border-t border-[#dce6eb] px-5 py-4 text-xs text-[#61798e]">External follow-up skipped. The internal approval remains visible above.</p>}
                </section>
                <div className="mt-7 flex flex-wrap items-center gap-3"><button type="button" data-testid="button-restart-after-completion" onClick={reset} className={actionButton}><RotateCcw className="h-4 w-4" /> Walk through again</button><Link href="/" data-testid="link-demo-exit" className={secondaryButton}>Back to SchoolOps AI <ArrowRight className="h-4 w-4" /></Link></div>
              </div>}

              {step < 4 && <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e0e7ee] bg-[#fbfcfc] px-6 py-5 sm:px-10">
                {step > 0 ? <button type="button" data-testid="button-demo-back" onClick={back} className={secondaryButton}><ArrowLeft className="h-4 w-4" /> Previous step</button> : <span className="text-xs text-[#71859a]">A safe space to explore.</span>}
                {step === 3 ? <button type="button" data-testid="button-demo-approve" onClick={approve} className={actionButton}><Check className="h-4 w-4" /> Approve in demo</button> : <button type="button" data-testid="button-demo-next" onClick={advance} className={actionButton}>{['Start walkthrough', 'Examine evidence', 'Review recommendation'][step]} <ArrowRight className="h-4 w-4" /></button>}
              </div>}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8090a1]"><span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Designed to show the review flow, not simulate a live school.</span><span>SchoolOps AI · public demo</span></div>
          </div>
        </div>
      </main>
    </div>
  );
}