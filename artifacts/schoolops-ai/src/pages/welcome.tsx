import { Link } from 'wouter';
import { ArrowRight, CheckCheck, LockKeyhole, School, ShieldCheck } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight"><img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-10 w-10 rounded-xl" /> SchoolOps AI</Link>
        <nav className="flex items-center gap-2 text-sm font-medium sm:gap-3"><Link href="/case-study" data-testid="link-case-study-header" className="rounded-md px-3 py-2 text-primary hover:bg-accent">Case study</Link><Link href="/demo" data-testid="link-try-demo-header" className="rounded-md px-3 py-2 text-primary hover:bg-accent">Try Demo</Link><Link href="/sign-in" className="rounded-md px-3 py-2 hover:bg-accent">Sign in</Link><Link href="/sign-up" className="hidden rounded-md bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 sm:inline-flex">Get started</Link></nav>
      </header>
      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 md:grid-cols-[1.1fr_.9fr] md:items-center md:px-10 md:pb-32 md:pt-28">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.16em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> A quieter way to run the day</div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.07] tracking-[-.055em] sm:text-6xl lg:text-7xl">A clear view of what needs your attention.</h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">Bring school operations into one considered workspace. See the evidence, review the recommendation, and make the final call yourself.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/demo" data-testid="link-try-demo-hero" className="inline-flex min-h-12 items-center gap-2 rounded-md bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/90">Try Demo <ArrowRight className="h-4 w-4" /></Link><Link href="/sign-up" className="inline-flex min-h-12 items-center rounded-md border bg-card px-6 font-medium hover:bg-accent">Create your workspace</Link></div>
            <p className="mt-6 text-xs text-muted-foreground">A two-minute guided walkthrough. Synthetic data only; no account needed.</p>
          </div>
          <div className="relative rounded-[28px] border border-primary/10 bg-[#e8eef7] p-5 shadow-[0_30px_80px_rgba(23,55,102,.09)] md:p-8">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b pb-5"><div><div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Morning overview</div><h2 className="mt-2 text-2xl font-semibold tracking-tight">Today, in focus</h2></div><div className="rounded-full bg-primary/10 p-2 text-primary"><School className="h-5 w-5" /></div></div>
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border bg-background p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">Attendance patterns</span><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">Review</span></div><p className="mt-2 text-sm text-muted-foreground">A proposed follow-up, with context before action.</p></div>
                <div className="rounded-lg border bg-background p-4"><div className="flex items-center gap-2 text-sm font-semibold"><CheckCheck className="h-4 w-4 text-primary" /> Communications awaiting approval</div><p className="mt-2 text-sm text-muted-foreground">Nothing goes out until someone on your team says so.</p></div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" /> Your school's workspace stays separate.</div>
            </div>
          </div>
        </section>
        <section className="border-y bg-card"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-[.7fr_1fr] md:px-10"><div className="text-xs font-semibold uppercase tracking-[.22em] text-primary">Built for responsible decisions</div><p className="text-2xl font-medium leading-snug tracking-tight md:text-3xl">A recommendation should make your judgment stronger, not replace it.</p></div></section>
        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-2 md:px-10"><div className="border-l-2 border-primary pl-6"><ShieldCheck className="mb-5 h-7 w-7 text-primary" /><h2 className="text-2xl font-semibold tracking-tight">Human review stays in the loop.</h2><p className="mt-3 max-w-md leading-relaxed text-muted-foreground">From follow-ups to communications, your team sees the reasoning and approves the next step.</p></div><div className="border-l-2 border-primary/30 pl-6"><School className="mb-5 h-7 w-7 text-primary" /><h2 className="text-2xl font-semibold tracking-tight">One school at a time.</h2><p className="mt-3 max-w-md leading-relaxed text-muted-foreground">Your active school is always visible. Memberships, records, and operations stay within the right workspace.</p></div></section>
        <section className="bg-primary px-5 py-20 text-primary-foreground md:px-10"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-primary-foreground/70">Start on solid ground</p><h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight md:text-5xl">Make room for the decisions that matter.</h2></div><Link href="/sign-up" className="inline-flex min-h-12 items-center gap-2 rounded-md bg-card px-6 font-semibold text-primary hover:bg-card/90">Get started <ArrowRight className="h-4 w-4" /></Link></div></section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground md:px-10"><span>SchoolOps AI</span><span>Thoughtful operations for the people behind every school day.</span></footer>
    </div>
  );
}