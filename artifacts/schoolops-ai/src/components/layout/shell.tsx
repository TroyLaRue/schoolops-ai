import { useState } from 'react';
import { useClerk, useUser } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Users, MessageSquare, Settings, History, Link2, BookOpen, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSchoolSession } from '@/lib/school-session';

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const { session, currentSchool, isAdmin, switchSchool, isSwitching } = useSchoolSession();
  const [switchError, setSwitchError] = useState('');
  const name = user?.fullName || user?.primaryEmailAddress?.emailAddress || session?.userId || 'Account';
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Users, label: 'Students', href: '/students' },
    { icon: MessageSquare, label: 'Communications', href: '/communications' },
    { icon: BookOpen, label: 'Knowledge', href: '/knowledge' },
    { icon: Link2, label: 'Integrations', href: '/integrations' },
    { icon: History, label: 'Activity History', mobileLabel: 'History', href: '/history' },
    ...(isAdmin ? [{ icon: Settings, label: 'Settings', href: '/settings' }] : []),
  ];
  async function handleSwitch(id: number) {
    setSwitchError('');
    try { await switchSchool(id); }
    catch (error) { setSwitchError(error instanceof Error ? error.message : 'Could not switch schools.'); }
  }
  async function handleSignOut() {
    queryClient.clear();
    await signOut({ redirectUrl: import.meta.env.BASE_URL });
  }
  return <>
    <aside className="fixed left-0 top-0 hidden h-[100dvh] w-64 flex-col border-r bg-card md:flex">
      <Link href="/" className="flex h-16 items-center gap-2.5 border-b px-5 font-semibold tracking-tight"><img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-8 w-8 rounded-md" /> SchoolOps AI</Link>
      <div className="border-b p-4"><div className="rounded-lg border bg-background p-3"><div className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Active school</div><div className="mt-1 truncate text-sm font-semibold" title={currentSchool?.school.name}>{currentSchool?.school.name}</div><div className="mt-1 text-xs capitalize text-muted-foreground">{currentSchool?.membership.role}</div>{session && session.memberships.length > 1 && <label className="relative mt-3 flex items-center"><span className="sr-only">Switch school</span><select aria-label="Switch school" disabled={isSwitching} value={currentSchool?.school.id} onChange={e=>void handleSwitch(Number(e.target.value))} className="min-h-9 w-full appearance-none rounded-md border bg-card pl-2 pr-7 text-xs font-medium disabled:opacity-60">{session.memberships.map(m=><option key={m.school.id} value={m.school.id}>{m.school.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" /></label>}{switchError && <p role="alert" className="mt-2 text-xs text-destructive">{switchError}</p>}</div></div>
      <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto p-4"><div className="mb-4 px-2 text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Workspace</div>{navItems.map(item=><Link key={item.href} href={item.href} className={cn('flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors', location === item.href ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}><item.icon className="h-4 w-4" />{item.label}</Link>)}</nav>
      <div className="border-t p-4"><div className="min-w-0 px-2"><div className="truncate text-sm font-medium" title={name}>{name}</div><div className="truncate text-xs capitalize text-muted-foreground">{currentSchool?.membership.role} · {user?.primaryEmailAddress?.emailAddress || session?.userId}</div></div><button type="button" onClick={() => void handleSignOut()} className="mt-3 flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"><LogOut className="h-4 w-4" /> Sign out</button></div>
    </aside>
    <div className="relative z-30 flex min-h-14 items-center justify-between gap-3 border-b bg-card px-4 md:hidden"><div className="min-w-0"><div className="truncate text-sm font-semibold">{currentSchool?.school.name}</div><div className="truncate text-[11px] text-muted-foreground">{name} · <span className="capitalize">{currentSchool?.membership.role}</span></div></div><div className="flex shrink-0 items-center gap-2">{session && session.memberships.length > 1 && <select aria-label="Switch school" disabled={isSwitching} value={currentSchool?.school.id} onChange={e=>void handleSwitch(Number(e.target.value))} className="max-w-28 rounded border bg-background px-1 py-2 text-xs">{session.memberships.map(m=><option key={m.school.id} value={m.school.id}>{m.school.name}</option>)}</select>}<button type="button" aria-label="Sign out" title="Sign out" onClick={() => void handleSignOut()} className="rounded-md p-2 text-muted-foreground hover:bg-accent"><LogOut className="h-4 w-4" /></button></div></div>
    <nav aria-label="Main navigation" className="mobile-safe-bottom fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t bg-card/95 px-1 pt-1 shadow-[0_-8px_24px_rgba(15,23,42,.08)] backdrop-blur-md md:hidden snap-x [&::-webkit-scrollbar]:hidden">{navItems.map(item=><Link key={item.href} href={item.href} className={cn('flex min-h-14 min-w-[72px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-md px-1 text-[10px] font-medium', location === item.href ? 'bg-primary/10 text-primary' : 'text-muted-foreground active:bg-accent')}><item.icon className="h-5 w-5" /><span>{item.mobileLabel ?? item.label}</span></Link>)}</nav>
  </>;
}

export function TopHeader({ onRunAudit, isRunning }: { onRunAudit: () => void; isRunning: boolean }) {
  return <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b bg-card px-4 py-2 sm:px-6"><h1 className="text-lg font-semibold tracking-tight sm:text-xl">Command Center</h1><button type="button" onClick={onRunAudit} disabled={isRunning} className={cn('flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-sm transition-colors sm:px-4', isRunning ? 'cursor-not-allowed bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90')}>{isRunning ? 'Running audit…' : <><History className="h-4 w-4" /><span className="sm:hidden">Run Audit</span><span className="hidden sm:inline">Run Morning Audit</span></>}</button></header>;
}