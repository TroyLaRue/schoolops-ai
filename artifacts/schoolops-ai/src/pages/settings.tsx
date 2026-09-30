import { useEffect, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateSchoolInvitation, useListSchoolMembers, useUpdateCurrentSchool, useUpdateSchoolMemberRole, type SchoolRole } from '@workspace/api-client-react';
import { Building2, Check, Copy, KeyRound, ShieldCheck, Users } from 'lucide-react';
import { Sidebar } from '@/components/layout/shell';
import { useSchoolSession } from '@/lib/school-session';

const roles: SchoolRole[] = ['admin', 'principal', 'staff'];

export default function Settings() {
  const { session, currentSchool, isAdmin } = useSchoolSession();
  const queryClient = useQueryClient();
  const school = currentSchool?.school;
  const [name, setName] = useState(school?.name ?? '');
  const [inviteRole, setInviteRole] = useState<SchoolRole>('staff');
  const [inviteToken, setInviteToken] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const members = useListSchoolMembers({ query: { enabled: !!currentSchool && isAdmin, queryKey: ['/api/schools/members', school?.id], staleTime: 10_000 } });
  const updateSchool = useUpdateCurrentSchool();
  const updateRole = useUpdateSchoolMemberRole();
  const createInvite = useCreateSchoolInvitation();

  useEffect(() => { setName(school?.name ?? ''); setInviteToken(''); setError(''); setNotice(''); }, [school?.id, school?.name]);

  async function saveSchool(event: FormEvent) {
    event.preventDefault(); setError(''); setNotice('');
    try {
      const updated = await updateSchool.mutateAsync({ data: { name: name.trim() } });
      queryClient.setQueryData(['/api/session', session?.userId], (old: typeof session) => old && old.currentSchool ? { ...old, currentSchool: { ...old.currentSchool, school: updated }, memberships: old.memberships.map(m => m.school.id === updated.id ? { ...m, school: updated } : m) } : old);
      setNotice('School details saved.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save school details.'); }
  }

  async function createInvitation(event: FormEvent) {
    event.preventDefault(); setError(''); setNotice(''); setInviteToken('');
    try { const result = await createInvite.mutateAsync({ data: { role: inviteRole, expiresInDays: 7 } }); setInviteToken(result.token); setExpiresAt(result.expiresAt); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not create invitation.'); }
  }

  async function changeRole(id: number, role: SchoolRole) {
    setError(''); setNotice('');
    try { await updateRole.mutateAsync({ id, data: { role } }); await queryClient.invalidateQueries({ queryKey: ['/api/schools/members', school?.id] }); setNotice('Member role updated.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not change role.'); }
  }

  return <div className="flex min-h-[100dvh] flex-col bg-background md:flex-row"><Sidebar /><div className="min-w-0 flex-1 pb-24 md:pl-64 md:pb-0">
    <header className="sticky top-0 z-20 flex min-h-16 items-center border-b bg-card px-5 md:px-8"><div><h1 className="text-lg font-semibold tracking-tight">School settings</h1><p className="text-xs text-muted-foreground">{school?.name}</p></div></header>
    <main className="mx-auto max-w-5xl space-y-8 px-5 py-8 md:px-8 md:py-12">
      <div><p className="text-xs font-semibold uppercase tracking-[.17em] text-primary">Workspace administration</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">The people and place behind the work.</h2><p className="mt-2 text-sm text-muted-foreground">Manage this school's identity and access. Changes stay within this workspace.</p></div>
      {!isAdmin && <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground"><ShieldCheck className="mb-3 h-5 w-5 text-primary" />Only administrators can manage school settings and members. Your role is {currentSchool?.membership.role}.</div>}
      {error && <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      {notice && <div role="status" className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-4 text-sm text-primary"><Check className="h-4 w-4" />{notice}</div>}
      <section className="rounded-xl border bg-card p-6 shadow-sm"><div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">School profile</h3></div><p className="mt-2 text-sm text-muted-foreground">A clear name helps your team know which school they are working in.</p><form onSubmit={saveSchool} className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-medium">School name<input required minLength={2} maxLength={100} value={name} disabled={!isAdmin} onChange={e=>setName(e.target.value)} className="mt-2 min-h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70" /></label>{isAdmin && <button type="submit" disabled={updateSchool.isPending || name.trim() === school?.name} className="min-h-11 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50">{updateSchool.isPending ? 'Saving…' : 'Save changes'}</button>}</form><div className="mt-4 text-xs text-muted-foreground">Workspace slug: {school?.slug} · Synthetic data only</div></section>
      {isAdmin && <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-xl border bg-card p-6 shadow-sm"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">Members</h3></div><p className="mt-2 text-sm text-muted-foreground">Assign the right level of access to each person.</p><div className="mt-6 divide-y border-t">
          {members.isLoading && <div className="space-y-3 py-5"><div className="h-12 animate-pulse rounded bg-muted" /><div className="h-12 animate-pulse rounded bg-muted" /></div>}
          {members.isError && <div className="py-5 text-sm text-destructive">Members could not be loaded. <button type="button" onClick={() => void members.refetch()} className="font-semibold underline">Retry</button></div>}
          {members.data?.length === 0 && <div className="py-6 text-sm text-muted-foreground">No members have joined yet. Create an invitation to bring someone in.</div>}
          {members.data?.map(member => <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{member.clerkUserId === session?.userId ? 'You' : `Member ${member.id}`}</p><p className="text-xs text-muted-foreground">{member.clerkUserId === session?.userId ? member.clerkUserId : `Joined ${new Date(member.createdAt).toLocaleDateString()}`}</p></div><label className="text-xs text-muted-foreground">Role<select aria-label={`Role for member ${member.id}`} value={member.role} disabled={updateRole.isPending || member.clerkUserId === session?.userId} onChange={e=>void changeRole(member.id, e.target.value as SchoolRole)} className="ml-2 min-h-10 rounded-md border bg-background px-2 text-sm capitalize text-foreground disabled:opacity-60">{roles.map(role=><option key={role} value={role}>{role[0].toUpperCase()+role.slice(1)}</option>)}</select></label></div>)}
        </div></div>
        <div className="rounded-xl border bg-card p-6 shadow-sm"><div className="flex items-center gap-3"><KeyRound className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">Invite a teammate</h3></div><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Create a one-time invitation. The code appears only here, so share it securely before leaving this page.</p><form onSubmit={createInvitation} className="mt-6"><label className="block text-sm font-medium">Access level<select value={inviteRole} onChange={e=>setInviteRole(e.target.value as SchoolRole)} className="mt-2 min-h-11 w-full rounded-md border bg-background px-3 text-sm capitalize">{roles.map(role=><option key={role} value={role}>{role[0].toUpperCase()+role.slice(1)}</option>)}</select></label><p className="mt-2 text-xs text-muted-foreground">Admin manages access; Principal and Staff can use the workspace.</p><button type="submit" disabled={createInvite.isPending} className="mt-5 min-h-11 w-full rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50">{createInvite.isPending ? 'Creating…' : 'Create one-time invitation'}</button></form>
          {inviteToken && <div className="mt-6 rounded-lg border border-primary/25 bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-widest text-primary">One-time code · save it now</p><code className="mt-3 block break-all rounded-md border bg-card p-3 text-sm">{inviteToken}</code><button type="button" onClick={() => void navigator.clipboard.writeText(inviteToken).then(() => setNotice('Invitation code copied.')).catch(() => setError('Copy failed. Select and copy the code manually.'))} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><Copy className="h-4 w-4" /> Copy code</button><p className="mt-3 text-xs text-muted-foreground">Expires {new Date(expiresAt).toLocaleDateString()}. Your teammate can redeem it on the Join school tab during onboarding.</p></div>}
        </div>
      </section>}
    </main>
  </div></div>;
}