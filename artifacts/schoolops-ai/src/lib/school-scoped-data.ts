import {
  useGetActivityHistory,
  useGetSchoolOperations,
  useListPolicyDocuments,
} from '@workspace/api-client-react';
import { useSchoolSession } from '@/lib/school-session';

export function useSchoolOperations() {
  const { currentSchool } = useSchoolSession();
  const schoolId = currentSchool?.school.id;
  return useGetSchoolOperations({
    query: {
      enabled: schoolId !== undefined,
      queryKey: ['/api/operations', schoolId],
      staleTime: 15_000,
    },
  });
}

export function useSchoolActivityHistory() {
  const { currentSchool } = useSchoolSession();
  const schoolId = currentSchool?.school.id;
  return useGetActivityHistory({
    query: {
      enabled: schoolId !== undefined,
      queryKey: ['/api/agent/history', schoolId],
      staleTime: 15_000,
    },
  });
}

export function useSchoolPolicyDocuments() {
  const { currentSchool } = useSchoolSession();
  const schoolId = currentSchool?.school.id;
  return useListPolicyDocuments({
    query: {
      enabled: schoolId !== undefined,
      queryKey: ['/api/policy-documents', schoolId],
      staleTime: 15_000,
    },
  });
}