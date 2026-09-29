import { SignIn, SignUp } from '@clerk/react';
import { Link } from 'wouter';
import { ShieldCheck } from 'lucide-react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function AuthFrame({ children, title }: { children: React.ReactNode; title: string }) {
  return <div className="grid min-h-[100dvh] bg-background lg:grid-cols-[.88fr_1.12fr]">
    <aside className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
      <Link href="/" className="flex items-center gap-3 text-lg font-semibold"><img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-10 w-10 rounded-xl" /> SchoolOps AI</Link>
      <div><div className="mb-7 inline-flex rounded-full border border-primary-foreground/30 p-3"><ShieldCheck className="h-7 w-7" /></div><h1 className="max-w-md text-5xl font-semibold leading-tight tracking-[-.045em]">{title}</h1><p className="mt-6 max-w-sm leading-relaxed text-primary-foreground/70">A focused workspace for your school, where context comes first and people make the call.</p></div>
      <p className="text-xs text-primary-foreground/60">SchoolOps AI · Synthetic data workspace</p>
    </aside>
    <main className="flex flex-col items-center justify-center px-4 py-12"><Link href="/" className="mb-8 flex items-center gap-2 text-sm font-semibold lg:hidden"><img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-8 w-8 rounded-lg" /> SchoolOps AI</Link>{children}<Link href="/" className="mt-7 text-sm text-muted-foreground hover:text-foreground">Back to welcome</Link></main>
  </div>;
}

function afterAuthDestination() {
  const requested = new URLSearchParams(window.location.search).get('redirect_url');
  return requested?.startsWith('/') && !requested.startsWith('//') ? requested : `${basePath}/`;
}

export function SignInPage() {
  return <AuthFrame title="Good to have you back."><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={afterAuthDestination()} /></AuthFrame>;
}

export function SignUpPage() {
  return <AuthFrame title="A better day starts here."><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl={afterAuthDestination()} /></AuthFrame>;
}