import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetSession, useSwitchSchool, type SchoolMembership, type SchoolSession } from '@workspace/api-client-react';

type SchoolSessionContextValue = {
  session: SchoolSession | null;
  currentSchool: SchoolMembership | null;
  isAdmin: boolean;
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
  switchSchool: (schoolId: number) => Promise<void>;
  isSwitching: boolean;
};

const SchoolSessionContext = createContext<SchoolSessionContextValue | null>(null);

export function SchoolSessionProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const queryClient = useQueryClient();
  const previousUser = useRef<string | null | undefined>(undefined);
  const switchMutation = useSwitchSchool();

  useEffect(() => {
    if (!isLoaded) return;
    const next = userId ?? null;
    if (previousUser.current !== undefined && previousUser.current !== next) {
      queryClient.clear();
    }
    previousUser.current = next;
  }, [isLoaded, userId, queryClient]);

  const query = useGetSession({
    query: { enabled: !!isLoaded && !!isSignedIn, queryKey: ['/api/session', userId], staleTime: 15_000, retry: 1 },
  });
  const session = query.data ?? null;
  const currentSchool = session?.currentSchool ?? null;

  const switchSchool = async (schoolId: number) => {
    if (!session?.memberships.some((entry) => entry.school.id === schoolId)) {
      throw new Error('This school is not in your memberships.');
    }
    await switchMutation.mutateAsync({ data: { schoolId } });
    queryClient.clear();
    window.location.assign(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/`);
  };

  return (
    <SchoolSessionContext.Provider value={{
      session,
      currentSchool,
      isAdmin: currentSchool?.membership.role === 'admin',
      isLoading: !isLoaded || (isSignedIn === true && query.isLoading),
      isError: query.isError,
      retry: () => { void query.refetch(); },
      switchSchool,
      isSwitching: switchMutation.isPending,
    }}>
      {children}
    </SchoolSessionContext.Provider>
  );
}

export function useSchoolSession() {
  const context = useContext(SchoolSessionContext);
  if (!context) throw new Error('useSchoolSession must be used inside SchoolSessionProvider');
  return context;
}