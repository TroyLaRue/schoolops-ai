export type IssueSeverity = 'critical' | 'attention' | 'healthy';
export type ActionStatus = 'pending' | 'approved' | 'dismissed' | 'completed';
export type IssueStatus = 'open' | 'resolved';

export interface RecommendedAction {
  id: string;
  type: 'communication' | 'task';
  title: string;
  description: string;
  status: ActionStatus;
  content?: string;
}

export interface Issue {
  id: string;
  title: string;
  category: string;
  severity: IssueSeverity;
  evidence: string;
  impact: string;
  policyBasis?: string;
  actions: RecommendedAction[];
}