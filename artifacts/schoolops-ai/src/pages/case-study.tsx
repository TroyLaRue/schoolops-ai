import { useEffect } from 'react';
import { Link } from 'wouter';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleDashed,
  Database,
  Fingerprint,
  GitBranch,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';

const demoSteps = [
  { number: '01', title: 'Enter the case', detail: 'A fictional school and student set the context. No account or school workspace is opened.' },
  { number: '02', title: 'See the finding', detail: 'Three unexcused absences in ten school days trigger a prompt to review—not a diagnosis.' },
  { number: '03', title: 'Inspect evidence', detail: 'The attendance entries sit beside a matched, invented policy section and its citation.' },
  { number: '04', title: 'Make the decision', detail: 'A person approves the proposed internal review in the demo interface.' },
  { number: '05', title: 'Choose follow-up', detail: 'Optionally simulate an email or calendar reminder, or skip. Nothing is sent or scheduled.' },
  { number: '06', title: 'Read the trail', detail: 'A browser-local activity history records the simulated choice for this tab only.' },
];

const featureList = [
  { title: 'Morning attention', detail: 'Surface patterns that deserve a closer look without implying a cause.' },
  { title: 'Ask SchoolOps', detail: 'Answer common operations questions using active-school facts and relevant policy excerpts.' },
  { title: 'Policy knowledge', detail: 'Keep guidance in inspectable sections so a response can cite the text it actually matched.' },
  { title: 'Decision history', detail: 'Make proposals, approvals, rejections, and completed demo-safe actions traceable.' },
];

const stack = [
  ['Interface', 'React 19 · TypeScript · Vite · Wouter · Tailwind CSS'],
  ['Identity & access', 'Clerk authentication · school membership and role checks'],
  ['Service', 'Express API · OpenAPI contract · generated React Query client'],
  ['Persistence', 'PostgreSQL · Drizzle ORM'],
  ['Optional test actions', 'Replit Connectors SDK · Gmail / Google Calendar'],
];

function Label({ number, children, light = false }: { number: string; children: React.ReactNode; light?: boolean }) {
  return (
    <div className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.19em] ${light ? 'text-[#b9c9d4]' : 'text-[#536e82]'}`}>
      <span className={`font-mono text-[11px] tracking-normal ${light ? 'text-[#d4b985]' : 'text-[#a46e39]'}`}>{number}</span>
      <span className={`h-px w-6 ${light ? 'bg-[#65798a]' : 'bg-[#b8c5c9]'}`} />
      {children}
    </div>
  );
}

function SectionHeading({ id, number, label, title, children }: { id: string; number: string; label: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-[660px]">
      <Label number={number}>{label}</Label>
      <h2 id={id} className="mt-5 font-['Georgia',serif] text-[clamp(2.15rem,4vw,3.6rem)] leading-[1.08] tracking-[-0.045em] text-[#172e3c]">{title}</h2>
      {children && <p className="mt-5 max-w-[590px] text-[15px] leading-[1.8] text-[#526977] sm:text-base">{children}</p>}
    </div>
  );
}

function Rule() {
  return <div aria-hidden="true" className="h-px w-full bg-[#ccd4d1]" />;
}

export default function CaseStudy() {
  useEffect(() => {
    const title = 'SchoolOps AI Case Study | Evidence Before Action';
    const description = 'Explore how SchoolOps AI combines school-scoped evidence, policy context, human approval, and a synthetic no-sign-in demo.';
    const previousTitle = document.title;
    const tags = [
      ['meta[name="description"]', description],
      ['meta[property="og:title"]', title],
      ['meta[property="og:description"]', description],
      ['meta[name="twitter:title"]', title],
      ['meta[name="twitter:description"]', description],
    ] as const;
    const previous = tags.map(([selector, value]) => {
      const element = document.querySelector<HTMLMetaElement>(selector);
      const oldValue = element?.content;
      if (element) element.content = value;
      return [element, oldValue] as const;
    });
    document.title = title;
    return () => {
      document.title = previousTitle;
      previous.forEach(([element, value]) => { if (element && value !== undefined) element.content = value; });
    };
  }, []);

  return (
    <div className="case-study min-h-[100dvh] overflow-x-hidden bg-[#f2f0e9] font-['Avenir_Next','Segoe_UI',sans-serif] text-[#172e3c] selection:bg-[#e5cfa1] selection:text-[#172e3c]">
      <style>{`
        @keyframes case-enter { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .case-enter { animation: case-enter .75s cubic-bezier(.2,.75,.3,1) both; }
        .case-enter-delay { animation-delay: .13s; }
        .case-enter-late { animation-delay: .24s; }
        .case-study { scroll-behavior: smooth; }
        .case-study section[id] { scroll-margin-top: 92px; }
        @media (prefers-reduced-motion: reduce) {
          .case-enter { animation: none !important; }
          .case-study { scroll-behavior: auto; }
          .case-study * { transition-duration: .01ms !important; }
        }
      `}</style>

      <a href="#main-content" data-testid="link-skip-content" className="sr-only rounded bg-[#f2f0e9] px-4 py-3 text-[#172e3c] focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">Skip to content</a>

      <header className="relative z-10 border-b border-[#344d5b] bg-[#172e3c] text-[#f3f0e8]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-14">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#d0b98b] text-[#d0b98b]"><span className="font-['Georgia',serif] text-lg italic leading-none">S</span></span>
            <span className="truncate text-[13px] font-semibold tracking-[0.01em]">SchoolOps AI</span>
            <span className="hidden border-l border-[#627481] pl-3 text-[10px] uppercase tracking-[0.19em] text-[#aabcc6] sm:block">Case study / portfolio</span>
          </div>
          <nav aria-label="Primary navigation" className="flex shrink-0 items-center gap-4 sm:gap-7">
            <a href="#overview" data-testid="link-case-overview" className="hidden text-xs text-[#becbd0] underline-offset-4 hover:text-[#f3f0e8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d0b98b] sm:block">Overview</a>
            <Link href="/demo" data-testid="link-case-demo-header" className="inline-flex items-center gap-2 border-b border-[#d0b98b] pb-1 text-xs font-semibold text-[#f3f0e8] transition-colors hover:text-[#d0b98b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d0b98b]">Explore demo <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section id="overview" aria-labelledby="case-title" className="relative overflow-hidden bg-[#172e3c] text-[#f2f0e9]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.13]" style={{ backgroundImage: 'linear-gradient(#9cbbc3 1px, transparent 1px), linear-gradient(90deg, #9cbbc3 1px, transparent 1px)', backgroundSize: '72px 72px', maskImage: 'linear-gradient(to right, transparent 20%, black 100%)' }} />
          <div className="relative mx-auto grid max-w-[1440px] gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:min-h-[670px] lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:gap-16 lg:px-14 lg:pb-28 lg:pt-24">
            <div className="case-enter">
              <div className="mb-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c7d2d1]"><span className="h-[6px] w-[6px] rounded-full bg-[#cfb787]" /> Independent portfolio prototype <span className="h-px w-10 bg-[#738797]" /></div>
              <h1 id="case-title" className="max-w-[700px] font-['Georgia',serif] text-[clamp(3.3rem,6.5vw,6.8rem)] leading-[0.99] tracking-[-0.058em]">The evidence<br />comes <em className="font-normal text-[#d9be8c]">before</em><br />the action.</h1>
              <p className="mt-8 max-w-[570px] text-base leading-[1.8] text-[#bfd0d4] sm:text-lg">A school-operations prototype that turns scattered signals into reviewable decisions. It shows the facts, names the policy context, and leaves the final call with a person.</p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="/demo" data-testid="link-case-demo-hero" className="group inline-flex min-h-12 items-center gap-6 bg-[#d7bd8d] px-5 py-3 text-[13px] font-bold text-[#172e3c] transition-colors hover:bg-[#eddbb9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7bd8d]">Walk through the demo <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                <a href="https://github.com/TroyLaRue/schoolops-ai" target="_blank" rel="noopener noreferrer" data-testid="link-case-github-hero" className="inline-flex min-h-12 items-center gap-2 px-1 text-[13px] font-medium text-[#e4e7e1] underline decoration-[#82939b] underline-offset-4 transition-colors hover:text-[#d7bd8d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7bd8d]">View the code <ArrowUpRight aria-hidden="true" className="h-4 w-4" /><span className="sr-only">(opens in a new tab)</span></a>
              </div>
              <p className="mt-6 text-xs leading-relaxed text-[#92a9b2]">No sign-in. Six steps. Entirely fictional, browser-local walkthrough.</p>
            </div>

            <div className="case-enter case-enter-delay relative w-full max-w-[600px] justify-self-center lg:justify-self-end" aria-label="Illustration of an evidence-based review workflow">
              <div className="absolute -left-4 -top-5 h-16 w-16 border-l border-t border-[#77909a]/60 sm:-left-8 sm:-top-8" aria-hidden="true" />
              <div className="absolute -bottom-5 -right-4 h-16 w-16 border-b border-r border-[#77909a]/60 sm:-bottom-8 sm:-right-8" aria-hidden="true" />
              <div className="border border-[#5a7180] bg-[#203b4a]/90 p-5 shadow-[0_30px_70px_rgba(8,21,30,.2)] sm:p-7">
                <div className="flex items-center justify-between gap-3 border-b border-[#526a76] pb-5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d5c092]"><CircleDashed aria-hidden="true" className="h-4 w-4" /> Review brief / illustrative</div>
                  <span className="font-mono text-[10px] text-[#98b0ba]">01 — 03</span>
                </div>
                <div className="pt-6">
                  <div className="mb-5 flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#c8af80] font-['Georgia',serif] text-xl text-[#e2c996]">!</div>
                    <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#a8bac0]">Attention, not conclusion</p><p className="mt-1 font-['Georgia',serif] text-xl leading-tight text-[#f2f0e9] sm:text-2xl">An attendance pattern worth reviewing.</p></div>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[80px_1fr] gap-3 border-t border-[#496370] py-3 text-xs sm:grid-cols-[100px_1fr]"><span className="font-mono uppercase tracking-wider text-[#9eb5bc]">Signal</span><span className="text-[#e4eae5]">3 unexcused absences / 10 school days</span></div>
                    <div className="grid grid-cols-[80px_1fr] gap-3 border-t border-[#496370] py-3 text-xs sm:grid-cols-[100px_1fr]"><span className="font-mono uppercase tracking-wider text-[#9eb5bc]">Source</span><span className="text-[#e4eae5]">Synthetic attendance entries</span></div>
                    <div className="grid grid-cols-[80px_1fr] gap-3 border-t border-[#496370] py-3 text-xs sm:grid-cols-[100px_1fr]"><span className="font-mono uppercase tracking-wider text-[#9eb5bc]">Policy</span><span className="text-[#e4eae5]">DEMO-ATT-04 · matched section</span></div>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3 border border-[#839799] bg-[#314f59] p-4"><span className="text-xs font-semibold text-[#f0eee5]">Suggested: internal record review</span><span className="shrink-0 border border-[#d9be8c] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[#e6cea0]">Needs approval</span></div>
                </div>
              </div>
              <div className="absolute -bottom-3 -left-3 flex items-center gap-2 bg-[#d8c094] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#233b46] sm:-bottom-4 sm:-left-5"><span className="h-1.5 w-1.5 rounded-full bg-[#233b46]" /> Fictional case</div>
            </div>
          </div>
          <div className="relative border-t border-[#415a68]">
            <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9db2b9] sm:px-8 lg:px-14"><span>01 / The question</span><span>02 / The boundary</span><span>03 / The decision</span><a href="#problem" data-testid="link-case-scroll-problem" aria-label="Scroll to Problem" className="inline-flex items-center gap-2 text-[#e0c794] hover:text-[#f5e1b9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7bd8d]">Read the case <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" /></a></div>
          </div>
        </section>

        <div className="sticky top-0 z-20 overflow-x-auto border-b border-[#cbd4d2] bg-[#f2f0e9]/95 backdrop-blur-md">
          <nav aria-label="Case study sections" className="mx-auto flex max-w-[1440px] min-w-max items-center gap-6 px-5 py-3.5 text-[11px] font-semibold text-[#597180] sm:gap-8 sm:px-8 lg:px-14">
            {[
              ['problem', 'Problem'], ['solution', 'Solution'], ['how-it-works', 'How it works'], ['architecture', 'Architecture'],
              ['key-features', 'Features'], ['safety', 'Safety'], ['demo-flow', 'Demo flow'], ['tech-stack', 'Stack'],
              ['current-status', 'Status'], ['my-role', 'My role'],
            ].map(([id, title]) => <a key={id} href={`#${id}`} data-testid={`link-case-nav-${id}`} className="whitespace-nowrap underline-offset-4 transition-colors hover:text-[#173766] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173766]">{title}</a>)}
          </nav>
        </div>

        <section id="problem" aria-labelledby="problem-title" className="mx-auto grid max-w-[1440px] gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.9fr_1.1fr] lg:gap-20 lg:px-14">
          <div><Label number="01">Problem</Label><h2 id="problem-title" className="mt-5 max-w-lg font-['Georgia',serif] text-[clamp(2.4rem,4.5vw,4.5rem)] leading-[1.08] tracking-[-0.05em]">The day is spread across too many places.</h2></div>
          <div className="lg:pt-11">
            <p className="max-w-[620px] text-lg leading-[1.75] text-[#394f5b] sm:text-[21px]">An attendance entry lives in one system. A policy sits in a document. The next step exists in someone’s inbox—or only in their head.</p>
            <p className="mt-6 max-w-[620px] text-[15px] leading-[1.85] text-[#627782]">School teams need context before they act, but joining the facts to the right guidance takes time. A system that merely produces a confident-sounding answer can make this worse. The design challenge is to make the reasoning inspectable while keeping people accountable for what happens next.</p>
            <div className="mt-10 border-l-2 border-[#b69361] pl-5 font-['Georgia',serif] text-xl italic leading-[1.5] text-[#324a55]">A flag should start a conversation, not finish one.</div>
          </div>
        </section>

        <section id="solution" aria-labelledby="solution-title" className="bg-[#e6e8e1]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
            <SectionHeading id="solution-title" number="02" label="Solution" title="A reviewable path from signal to decision.">SchoolOps AI brings operational facts, relevant policy context, a proposed next step, and an explicit human decision into one sequence. It is built around what can be verified—not what can be made to sound certain.</SectionHeading>
            <div className="mt-12 grid gap-px border border-[#b7c4bf] bg-[#b7c4bf] md:grid-cols-3">
              {[
                { n: '01', title: 'Observe', copy: 'Identify a concrete pattern in normalized, school-scoped operational records.', icon: Database },
                { n: '02', title: 'Ground', copy: 'Show the entries and cite a matching policy section when one is available.', icon: BookOpen },
                { n: '03', title: 'Decide', copy: 'Separate the suggested response from the authorized person’s approval.', icon: ShieldCheck },
              ].map(({ n, title, copy, icon: Icon }) => <div key={n} className="bg-[#f2f0e9] p-7 sm:p-9"><div className="flex items-center justify-between"><span className="font-mono text-[11px] text-[#936a46]">{n} / 03</span><Icon aria-hidden="true" className="h-5 w-5 text-[#476579]" strokeWidth={1.5} /></div><h3 className="mt-9 font-['Georgia',serif] text-2xl tracking-[-0.03em]">{title}</h3><p className="mt-3 max-w-[280px] text-sm leading-[1.75] text-[#5a707a]">{copy}</p></div>)}
            </div>
          </div>
        </section>

        <section id="how-it-works" aria-labelledby="how-title" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
          <div className="grid gap-10 lg:grid-cols-[.68fr_1fr] lg:gap-20">
            <div><SectionHeading id="how-title" number="03" label="How It Works" title="The boundary is the design.">Inputs become comparable before any rule evaluates them. Outputs distinguish what was observed from what is merely proposed.</SectionHeading></div>
            <div className="border-t border-[#b9c7c6]">
              {[
                ['01', 'Normalize the inputs', 'Integration-shaped records become consistent school context. The illustrative Smartcare field mapping demonstrates the boundary; it does not connect to Smartcare.'],
                ['02', 'Evaluate with visible logic', 'Today’s reasoning uses deterministic application logic against active-school facts. It is not an autonomous LLM making decisions.'],
                ['03', 'Ground the answer', 'When policy text matches, cite the relevant section. If no section matches, a general suggestion is not dressed up as policy authority.'],
                ['04', 'Keep the human in control', 'Evidence and suggestion are presented separately. A proposed action can be approved or rejected before an eligible next step.'],
              ].map(([n, title, copy]) => <div key={n} className="grid gap-3 border-b border-[#b9c7c6] py-6 sm:grid-cols-[48px_1fr] sm:gap-6"><span className="font-mono text-xs text-[#ad7f50]">{n}</span><div><h3 className="text-base font-semibold text-[#243d4a]">{title}</h3><p className="mt-2 max-w-[620px] text-sm leading-[1.8] text-[#5b707a]">{copy}</p></div></div>)}
            </div>
          </div>
        </section>

        <section id="architecture" aria-labelledby="architecture-title" className="bg-[#203a47] text-[#f2f0e9]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
            <Label number="04" light>Architecture</Label>
            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_.8fr] lg:items-end">
              <h2 id="architecture-title" className="max-w-[660px] font-['Georgia',serif] text-[clamp(2.3rem,4vw,4rem)] leading-[1.08] tracking-[-0.045em]">Two experiences.<br /><em className="font-normal text-[#d7be8e]">Different trust boundaries.</em></h2>
              <p className="max-w-[440px] text-sm leading-[1.8] text-[#b7c8cc]">The public walkthrough never crosses into a school workspace. The authenticated application resolves school membership and the active-school context before accessing operational data or eligible actions.</p>
            </div>
            <div className="mt-12 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
              <div className="border border-[#70838a] bg-[#294653] p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e2c791]">Public /demo</span><LockKeyhole aria-hidden="true" className="h-4 w-4 text-[#e2c791]" /></div>
                <h3 className="mt-10 font-['Georgia',serif] text-2xl">A closed simulation.</h3>
                <p className="mt-3 text-sm leading-[1.8] text-[#bed0d1]">Synthetic case, invented policy, local approval, and a tab-local history. Uses browser session storage; no school API, connector call, email, calendar event, or database write.</p>
                <div className="mt-9 border-t border-[#5b7580] pt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#c6d1cd]">Browser → local state only</div>
              </div>
              <div className="border border-[#70838a] bg-[#294653] p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e2c791]">Authenticated workspace</span><Fingerprint aria-hidden="true" className="h-4 w-4 text-[#e2c791]" /></div>
                <div className="mt-8 flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#e3ebe8]">
                  {['React client', 'Express + Clerk', 'Active school', 'PostgreSQL'].map((item, index) => <div key={item} className="flex items-center gap-2"><span className="border border-[#768d94] px-2.5 py-2">{item}</span>{index < 3 && <ChevronRight aria-hidden="true" className="h-3 w-3 text-[#d3bc8a]" />}</div>)}
                </div>
                <p className="mt-7 text-sm leading-[1.8] text-[#bed0d1]">Membership and active-school isolation scope operations, policies, runs, and history. The API rechecks a persisted approval before any eligible authenticated demo-safe external action.</p>
                <div className="mt-7 border-t border-[#5b7580] pt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#c6d1cd]">Scoped data → proposed action → server-side approval gate</div>
              </div>
            </div>
            <p className="mt-5 max-w-[880px] text-xs leading-[1.75] text-[#aebfc3]"><strong className="text-[#e2c791]">Connector note.</strong> Smartcare is only a synthetic Demo Connector and illustrative mapping—not a live vendor integration. Gmail and Calendar are optional approved test actions on the original synthetic school using shared workspace connections, not per-school integrations. The public demo uses neither.</p>
          </div>
        </section>

        <section id="key-features" aria-labelledby="features-title" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
          <SectionHeading id="features-title" number="05" label="Key Features" title="Useful because it is inspectable.">The authenticated workspace is a working prototype, not a claim to replace a school’s system of record.</SectionHeading>
          <div className="mt-11 grid border-t border-[#b9c7c6] sm:grid-cols-2">
            {featureList.map(({ title, detail }, index) => <div key={title} className={`min-h-[190px] border-b border-[#b9c7c6] py-7 sm:p-8 ${index % 2 === 0 ? 'sm:border-r sm:pl-0' : 'sm:pl-10'}`}><div className="flex items-start gap-6"><span className="font-mono text-xs text-[#a4764b]">0{index + 1}</span><div><h3 className="font-['Georgia',serif] text-2xl tracking-[-0.035em]">{title}</h3><p className="mt-3 max-w-[370px] text-sm leading-[1.8] text-[#5b707a]">{detail}</p></div></div></div>)}
          </div>
        </section>

        <section id="safety" aria-labelledby="safety-title" className="border-y border-[#c6d0c9] bg-[#e4e9e5]">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.85fr_1.15fr] lg:gap-20 lg:px-14">
            <div><SectionHeading id="safety-title" number="06" label="Safety/Approval Design" title="Approval is not a decorative button.">The line between a recommendation and an action is an explicit trust boundary.</SectionHeading><div className="mt-9 inline-flex items-center gap-3 border border-[#9caeaa] px-4 py-3 text-xs font-semibold text-[#35534f]"><ShieldCheck aria-hidden="true" className="h-4 w-4" /> Human judgment stays in the loop</div></div>
            <div className="space-y-4">
              {[
                { icon: BookOpen, title: 'Citations have a source', text: 'Policy references point to matched sections of active-school guidance. Without a relevant match, the answer must not imply policy support.' },
                { icon: GitBranch, title: 'Evidence is not a suggestion', text: 'Observed attendance facts and the proposed review are labeled separately; the pattern does not establish why a student was absent.' },
                { icon: LockKeyhole, title: 'Approval is checked on the server', text: 'Authenticated demo-safe Gmail or Calendar actions require a stored, approved proposal and renewed server-side checks—not a client-only approval state.' },
                { icon: Fingerprint, title: 'A school is a boundary', text: 'Membership and selected active school govern access. Switching schools is limited to memberships, and school records are scoped to the selected context.' },
              ].map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-5 border-b border-[#bbc9c3] pb-5 last:border-0"><span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center border border-[#a9bab5] text-[#496b6a]"><Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} /></span><div><h3 className="font-semibold text-[#233e48]">{title}</h3><p className="mt-2 text-sm leading-[1.75] text-[#596e74]">{text}</p></div></div>)}
            </div>
          </div>
        </section>

        <section id="demo-flow" aria-labelledby="demo-title" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
          <div className="flex flex-wrap items-end justify-between gap-6"><SectionHeading id="demo-title" number="07" label="Demo Flow" title="Six steps. No leap of faith.">The public experience tells one synthetic attendance story, start to finish. It runs entirely in the browser and can be restarted at any time.</SectionHeading><Link href="/demo" data-testid="link-case-demo-flow" className="group inline-flex min-h-11 items-center gap-3 border-b border-[#173766] pb-1 text-sm font-semibold text-[#173766] hover:text-[#90663e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#173766]">Open public walkthrough <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div>
          <ol className="mt-12 grid gap-px overflow-hidden border border-[#b6c5c1] bg-[#b6c5c1] sm:grid-cols-2 lg:grid-cols-3">
            {demoSteps.map((step) => <li key={step.number} className="flex min-h-[190px] flex-col bg-[#f2f0e9] p-6 sm:p-7"><span className="font-mono text-[11px] text-[#9a7049]">{step.number} / 06</span><h3 className="mt-7 font-['Georgia',serif] text-xl tracking-[-0.025em]">{step.title}</h3><p className="mt-2 text-sm leading-[1.7] text-[#5c727b]">{step.detail}</p></li>)}
          </ol>
          <p className="mt-5 flex items-start gap-2 text-xs leading-[1.7] text-[#61777e]"><Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#51766e]" /> All people, policies, and scenarios are fictional. Public approval and follow-up are simulations, not real school actions.</p>
        </section>

        <section id="tech-stack" aria-labelledby="stack-title" className="bg-[#e9e6dc]">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:px-14">
            <div><SectionHeading id="stack-title" number="08" label="Tech Stack" title="A prototype with real boundaries.">The interface is one layer. The contract between identity, school context, persistence, and actions is where the operational thinking lives.</SectionHeading></div>
            <dl className="border-t border-[#b8c3bd]">
              {stack.map(([term, description]) => <div key={term} className="grid gap-2 border-b border-[#b8c3bd] py-5 sm:grid-cols-[150px_1fr] sm:gap-5"><dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#42606d]">{term}</dt><dd className="text-sm leading-[1.7] text-[#4d6570]">{description}</dd></div>)}
            </dl>
          </div>
        </section>

        <section id="current-status" aria-labelledby="status-title" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20"><div><SectionHeading id="status-title" number="09" label="Current Status" title="Working prototype. Clear limits.">Designed to demonstrate a responsible operations workflow, not to handle real student records.</SectionHeading></div>
            <div className="space-y-5">
              <div className="border-l-2 border-[#6c9189] bg-[#e8ede7] p-6"><h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#3e6660]">Implemented</h3><p className="mt-3 text-sm leading-[1.8] text-[#4c6869]">Public browser-local walkthrough; synthetic school workspace; deterministic question handling; policy-section citations; proposal review, approvals/rejections, and history; school-scoped access; constrained optional authenticated test actions.</p></div>
              <div className="border-l-2 border-[#bc996c] bg-[#efebe1] p-6"><h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#896744]">Not claimed</h3><p className="mt-3 text-sm leading-[1.8] text-[#6c6254]">No live Smartcare connection. No autonomous LLM reasoning. No production-grade student information system, verified school outcome metrics, or authorization to use actual student, family, or school records. Gmail and Calendar test connections are shared workspace setup for the original synthetic school, not per-school integrations.</p></div>
               <p className="px-1 text-xs leading-[1.75] text-[#617780]">A real deployment would require authorized vendor access, school-owned connection setup, data agreements, deeper security and isolation testing, and operational review.</p>
               <div className="border-t border-[#b9c7c6] pt-6"><h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#42606d]">What this project proves</h3><p className="mt-3 text-sm leading-[1.8] text-[#4d6570]">An operations assistant can be designed around inspectable evidence, policy context, tenant boundaries, and human approval—without claiming a black-box agent, live vendor data, or verified outcomes.</p></div>
            </div>
          </div>
        </section>

        <Rule />
        <section id="my-role" aria-labelledby="role-title" className="mx-auto grid max-w-[1440px] gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:px-14">
          <div><SectionHeading id="role-title" number="10" label="My Role" title="From field insight to working prototype." /></div>
          <div className="lg:pt-10"><p className="max-w-[650px] font-['Georgia',serif] text-[clamp(1.5rem,2.3vw,2.15rem)] leading-[1.5] tracking-[-0.025em] text-[#304854]">I independently conceived and built SchoolOps AI as a portfolio project, informed by real school-operations experience and graduate studies in AI and business.</p><p className="mt-6 max-w-[620px] text-sm leading-[1.85] text-[#60747c]">I worked across product framing, interface design, application flow, integration-shaped data modeling, and the safety boundaries around policy grounding and approval. This is my independent work: it is not officially sponsored, endorsed, or affiliated with the University of South Florida (USF) or Sunshine Christian Academy.</p></div>
        </section>

        <section aria-labelledby="closing-title" className="bg-[#172e3c] text-[#f2f0e9]">
          <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:flex-row lg:items-end lg:px-14">
            <div><Label number="↗" light>See the work</Label><h2 id="closing-title" className="mt-5 max-w-[650px] font-['Georgia',serif] text-[clamp(2.5rem,4.7vw,4.7rem)] leading-[1.08] tracking-[-0.05em]">Follow the reasoning.<br /><em className="font-normal text-[#d9be8c]">Then make the call.</em></h2></div>
            <div className="flex flex-wrap gap-3">
              <Link href="/demo" data-testid="link-case-demo-footer" className="inline-flex min-h-12 items-center gap-5 bg-[#d7bd8d] px-5 py-3 text-sm font-semibold text-[#172e3c] transition-colors hover:bg-[#eddbb9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7bd8d]">Try the six-step demo <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
              <a href="https://github.com/TroyLaRue/schoolops-ai" target="_blank" rel="noopener noreferrer" data-testid="link-case-github-footer" className="inline-flex min-h-12 items-center gap-3 border border-[#82949a] px-5 py-3 text-sm font-semibold text-[#edf0e9] transition-colors hover:border-[#d7bd8d] hover:text-[#d7bd8d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7bd8d]">Source on GitHub <ArrowUpRight aria-hidden="true" className="h-4 w-4" /><span className="sr-only">(opens in a new tab)</span></a>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#405b67] bg-[#172e3c] text-[#9eb2b8]"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-6 text-xs sm:px-8 lg:px-14"><span>SchoolOps AI · Independent portfolio project</span><span className="flex items-center gap-2"><Mail aria-hidden="true" className="h-3.5 w-3.5" /> Fictional data only · No public-demo messages sent</span></div></footer>
    </div>
  );
}