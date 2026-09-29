import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useClaimDemoSchool, useCreateSchool, useJoinSchool, type SchoolClaimInputSlug } from '@workspace/api-client-react';
import { ArrowRight, Building2, Check, KeyRound, ShieldCheck } from 'lucide-react';
import { useSchoolSession } from '@/lib/school-session';

type Mode = 'demo' | 'create' | 'join';

export default function Onboarding() {
  const queryClient = useQueryClient();
  const { currentSchool } = useSchoolSession();
  const [mode, setMode] = useState<Mode>(() => window.location.pathname.includes('/join') || !!new URLSearchParams(window.location.search).get('token') ? 'join' : 'demo');
  const [slug, setSlug] = useState<SchoolClaimInputSlug>('oakridge-middle');
  const [name, setName] = useState('');
  const [token, setToken] = useState(new URLSearchParams(window.location.search).get('token') ?? '');
  const [error, setError] = useState('');
  const claim = useClaimDemoSchool();
  const create = useCreateSchool();
  const join = useJoinSchool();
  const busy = claim.isPending || create.isPending || join.isPending;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      if (mode === 'demo') await claim.mutateAsync({ data: { slug } });
      if (mode === 'create') await create.mutateAsync({ data: { name: name.trim() } });
      if (mode === 'join') await join.mutateAsync({ data: { token: token.trim() } });
      queryClient.clear();
      window.location.assign(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not work. Please try again.');
    }
  }

  return <div className="min-h-[100dvh] bg-background text-foreground">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6"><Link href="/" className="flex items-center gap-2.5 font-semibold"><img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-9 w-9 rounded-lg" /> SchoolOps AI</Link>{currentSchool && <Link href="/" className="text-sm font-medium text-primary hover:underline">Back to workspace</Link>}</header>
    <main className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-10 md:grid-cols-[.85fr_1fr] md:pt-20">
      <div><div className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Your workspace</div><h1 className="mt-5 text-4xl font-semibold leading-tight tracking-[-.045em] md:text-5xl">Start with the right school.</h1><p className="mt-5 max-w-md leading-relaxed text-muted-foreground">Choose a synthetic demo school, create a new one, or use an invitation from your administrator. Your work stays within your active school.</p><div className="mt-10 flex items-start gap-3 border-t pt-6 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span>School membership is verified on the server. No records are shared across schools.</span></div></div>
      <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-8">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Workspace setup">
          {([['demo','Claim demo'],['create','Create school'],['join','Join school']] as const).map(([key,label]) => <button key={key} type="button" role="tab" aria-selected={mode===key} onClick={() => { setMode(key); setError(''); }} className={`rounded-md px-2 py-2.5 text-xs font-medium transition-colors sm:text-sm ${mode===key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{label}</button>)}
        </div>
        <form onSubmit={submit} className="mt-8">
          {mode === 'demo' && <><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div><h2 className="text-xl font-semibold">Explore with a demo school</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">These schools contain synthetic data only. A demo school can be claimed once; if it has already been claimed, choose the other school or create your own.</p><fieldset className="mt-6 space-y-3"><legend className="mb-3 text-sm font-medium">Choose a school</legend>{([['oakridge-middle','Oakridge Middle School'],['pinecrest-academy','Pinecrest Academy']] as const).map(([value,label]) => <label key={value} className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 text-sm font-medium ${slug === value ? 'border-primary bg-primary/5' : 'hover:bg-accent/40'}`}><span>{label}</span><input type="radio" name="school" checked={slug===value} onChange={() => setSlug(value)} className="accent-primary" /></label>)}</fieldset></>}
          {mode === 'create' && <><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div><h2 className="text-xl font-semibold">Create a school workspace</h2><p className="mt-2 text-sm text-muted-foreground">You will be the administrator of this synthetic-only workspace.</p><label htmlFor="school-name" className="mt-7 block text-sm font-medium">School name</label><input id="school-name" required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your school name" className="mt-2 min-h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></>}
          {mode === 'join' && <><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><KeyRound className="h-5 w-5" /></div><h2 className="text-xl font-semibold">Join with an invitation</h2><p className="mt-2 text-sm text-muted-foreground">Enter the one-time code shared by a school administrator.</p><label htmlFor="invite-code" className="mt-7 block text-sm font-medium">Invitation code</label><input id="invite-code" required minLength={20} maxLength={200} autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} placeholder="Paste your invitation code" className="mt-2 min-h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></>}
          {error && <div role="alert" className="mt-5 rounded-md border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
          <button disabled={busy} type="submit" className="mt-8 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{busy ? 'Setting up your workspace…' : mode === 'demo' ? 'Claim demo school' : mode === 'create' ? 'Create school' : 'Join school'} {busy ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</button>
        </form>
      </div>
    </main>
  </div>;
}