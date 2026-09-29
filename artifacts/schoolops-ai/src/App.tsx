import { type ReactNode } from 'react';
import { ClerkProvider, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SchoolSessionProvider, useSchoolSession } from '@/lib/school-session';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/dashboard';
import Students from '@/pages/students';
import StudentDetail from '@/pages/student-detail';
import Communications from '@/pages/communications';
import Settings from '@/pages/settings';
import HistoryPage from '@/pages/history';
import Integrations from '@/pages/integrations';
import Knowledge from '@/pages/knowledge';
import Welcome from '@/pages/welcome';
import Onboarding from '@/pages/onboarding';
import { SignInPage, SignUpPage } from '@/pages/auth';

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: { colorPrimary: '#173766', colorForeground: '#14243b', colorMutedForeground: '#62738a', colorDanger: '#c93951', colorBackground: '#ffffff', colorInput: '#f6f8fb', colorInputForeground: '#14243b', colorNeutral: '#d7e0eb', fontFamily: 'Inter, sans-serif', borderRadius: '6px' },
  elements: {
    rootBox: 'w-full flex justify-center', cardBox: 'bg-white rounded-xl w-[440px] max-w-full overflow-hidden border border-slate-200 shadow-sm', card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-slate-900 font-semibold', headerSubtitle: 'text-slate-600', socialButtonsBlockButtonText: 'text-slate-900', formFieldLabel: 'text-slate-900', footerActionLink: 'text-blue-900', footerActionText: 'text-slate-600', dividerText: 'text-slate-600', identityPreviewEditButton: 'text-blue-900', formFieldSuccessText: 'text-blue-900', alertText: 'text-slate-900',
    logoBox: 'mb-2', logoImage: 'h-10 w-10', socialButtonsBlockButton: 'border-slate-200', formButtonPrimary: 'bg-[#173766] text-white', formFieldInput: 'bg-[#f6f8fb] text-slate-900', footerAction: 'border-slate-200', dividerLine: 'bg-slate-200', alert: 'bg-[#f6f8fb]', otpCodeFieldInput: 'bg-[#f6f8fb]', formFieldRow: 'gap-2', main: 'p-7',
  },
};

function LoadingPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5"><div className="w-full max-w-md space-y-5 rounded-xl border bg-card p-8"><div className="h-9 w-9 animate-pulse rounded-lg bg-muted" /><div className="h-6 w-2/3 animate-pulse rounded bg-muted" /><div className="h-4 w-full animate-pulse rounded bg-muted" /><div className="h-4 w-3/4 animate-pulse rounded bg-muted" /></div></div>;
}

function Authenticated({ children, needsSchool = true, adminOnly = false }: { children: ReactNode; needsSchool?: boolean; adminOnly?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { currentSchool, isAdmin, isLoading, isError, retry } = useSchoolSession();
  const [location, navigate] = useLocation();
  if (!isLoaded || (isSignedIn && isLoading)) return <LoadingPage />;
  if (!isSignedIn) {
    const destination = `${basePath}${location}`;
    queueMicrotask(() => navigate(`/sign-in?redirect_url=${encodeURIComponent(destination)}`, { replace: true }));
    return <LoadingPage />;
  }
  if (isError) return <div className="flex min-h-[100dvh] items-center justify-center bg-background p-5"><div className="max-w-md rounded-xl border bg-card p-8"><h1 className="text-xl font-semibold">We could not load your school session.</h1><p className="mt-2 text-sm text-muted-foreground">Your workspace is safe. Please try again.</p><button type="button" onClick={retry} className="mt-5 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Retry</button></div></div>;
  if (needsSchool && !currentSchool) { queueMicrotask(() => navigate('/onboarding', { replace: true })); return <LoadingPage />; }
  if (adminOnly && !isAdmin) { queueMicrotask(() => navigate('/', { replace: true })); return <LoadingPage />; }
  return <>{children}</>;
}

function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingPage />;
  return isSignedIn ? <Authenticated><Dashboard /></Authenticated> : <Welcome />;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={Home} />
    <Route path="/sign-in/*?" component={SignInPage} />
    <Route path="/sign-up/*?" component={SignUpPage} />
    <Route path="/onboarding">{() => <Authenticated needsSchool={false}><Onboarding /></Authenticated>}</Route>
    <Route path="/join">{() => <Authenticated needsSchool={false}><Onboarding /></Authenticated>}</Route>
    <Route path="/students">{() => <Authenticated><Students /></Authenticated>}</Route>
    <Route path="/students/:studentId">{() => <Authenticated><StudentDetail /></Authenticated>}</Route>
    <Route path="/communications">{() => <Authenticated><Communications /></Authenticated>}</Route>
    <Route path="/history">{() => <Authenticated><HistoryPage /></Authenticated>}</Route>
    <Route path="/knowledge">{() => <Authenticated><Knowledge /></Authenticated>}</Route>
    <Route path="/integrations">{() => <Authenticated><Integrations /></Authenticated>}</Route>
    <Route path="/settings">{() => <Authenticated adminOnly><Settings /></Authenticated>}</Route>
    <Route>{() => <Authenticated><NotFound /></Authenticated>}</Route>
  </Switch></RoutedErrorBoundary>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to your school workspace' } }, signUp: { start: { title: 'Create your account', subtitle: 'Start with the right school' } } }}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  ><QueryClientProvider client={queryClient}><SchoolSessionProvider><TooltipProvider><Router /><Toaster /></TooltipProvider></SchoolSessionProvider></QueryClientProvider></ClerkProvider>;
}

function App() {
  return <WouterRouter base={basePath}><ClerkProviderWithRoutes /></WouterRouter>;
}

export default App;