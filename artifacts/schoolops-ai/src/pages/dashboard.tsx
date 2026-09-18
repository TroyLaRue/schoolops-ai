import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getGetActivityHistoryQueryKey, useCompleteAgentRun, useCreateAgentRun, useGetActivityHistory, useUpdateAgentAction } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar, TopHeader } from '@/components/layout/shell';
import { AgentActivity } from '@/components/dashboard/agent-activity';
import { ChatWidget } from '@/components/dashboard/chat-widget';
import { AboutModal } from '@/components/dashboard/about-modal';
import { IssueCard } from '@/components/dashboard/issue-card';
import { Tabs, TabsList, TabsTrigger, TabsContent, Badge } from '@/components/ui';
import { MOCK_ACTIVITY_LOG, MOCK_ISSUES, Issue } from '@/data/mock';
import { SCHOOL_OPS_DATA_SOURCE } from '@/data/schoolops-data';

export default function Dashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [hasRunBefore, setHasRunBefore] = useState(true); // Seeded state
  const [issues, setIssues] = useState<Issue[]>(MOCK_ISSUES);
  const activeRunId = useRef<number | null>(null);
  const actionRecordIds = useRef<Record<string, number>>({});
  const queryClient = useQueryClient();
  const history = useGetActivityHistory();
  const createRun = useCreateAgentRun();
  const completeRun = useCompleteAgentRun();
  const updateAction = useUpdateAgentAction();
  const [persistenceError, setPersistenceError] = useState('');

  useEffect(() => {
    if (activeRunId.current || !history.data?.runs[0]) return;
    for (const issue of history.data.runs[0].issues) {
      for (const action of issue.actions) {
        actionRecordIds.current[action.sourceId] = action.id;
      }
    }
  }, [history.data]);
  
  // Reset data when re-running audit
  const handleRunAudit = () => {
    setPersistenceError('');
    setIsRunning(true);
    setHasRunBefore(true);
    createRun.mutate({
      data: {
        activityLog: MOCK_ACTIVITY_LOG,
        issues: MOCK_ISSUES.map((issue) => ({
          sourceId: issue.id,
          title: issue.title,
          category: issue.category,
          severity: issue.severity,
          evidence: issue.evidence,
          impact: issue.impact,
          actions: issue.actions.map((action) => ({
            sourceId: action.id,
            type: action.type,
            title: action.title,
            description: action.description,
            content: action.content ?? null,
            recipient: null,
            subject: null,
            channel: null,
            reason: null,
            status: 'pending' as const,
          })),
        })),
      },
    }, {
      onSuccess: (run) => {
        activeRunId.current = run.id;
        for (const issue of run.issues) {
          for (const action of issue.actions) {
            actionRecordIds.current[action.sourceId] = action.id;
          }
        }
        queryClient.invalidateQueries({ queryKey: getGetActivityHistoryQueryKey() });
      },
      onError: () => setPersistenceError('This audit is running, but its history record could not be saved.'),
    });
    // When running, clear the board visually for effect, or show skeletons
    // For this demo, we'll just dim them or show an empty state until it finishes
  };

  const handleAuditComplete = useCallback(() => {
    setIsRunning(false);
    if (activeRunId.current) {
      completeRun.mutate({ id: activeRunId.current }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetActivityHistoryQueryKey() }),
        onError: () => setPersistenceError('The audit finished, but its completion timestamp could not be saved.'),
      });
    }
    // Reset any dismissed actions to show the full board again for demo purposes
    setIssues(MOCK_ISSUES.map(issue => ({
      ...issue,
      actions: issue.actions.map(a => ({ ...a, status: 'pending' as const }))
    })));
  }, [completeRun, queryClient]);

  const persistActionStatus = (actionId: string, status: 'approved' | 'dismissed') => {
    const recordId = actionRecordIds.current[actionId];
    if (!recordId) return;
    updateAction.mutate({
      id: recordId,
      data: { status },
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetActivityHistoryQueryKey() }),
      onError: () => setPersistenceError('The action changed on screen, but its history status could not be saved.'),
    });
  };

  const handleActionApprove = (issueId: string, actionId: string) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        return {
          ...issue,
          actions: issue.actions.map(action => 
            action.id === actionId ? { ...action, status: 'approved' } : action
          )
        };
      }
      return issue;
    }));
    persistActionStatus(actionId, 'approved');
  };

  const handleActionDismiss = (issueId: string, actionId: string) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        return {
          ...issue,
          actions: issue.actions.map(action => 
            action.id === actionId ? { ...action, status: 'dismissed' } : action
          )
        };
      }
      return issue;
    }));
    persistActionStatus(actionId, 'dismissed');
  };

  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const attentionIssues = issues.filter(i => i.severity === 'attention');
  const healthyIssues = issues.filter(i => i.severity === 'healthy');

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 pb-20 md:pb-0 md:pl-64 flex flex-col min-w-0">
        <TopHeader onRunAudit={handleRunAudit} isRunning={isRunning} />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto relative">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {persistenceError && (
              <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                {persistenceError}
              </div>
            )}
            
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Today's Operations Brief</h2>
                <p className="text-muted-foreground mt-1 text-sm">Generated by SchoolOps AI from the normalized overnight data sync.</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="border border-primary/15 bg-primary/10 text-primary">{SCHOOL_OPS_DATA_SOURCE.label}</Badge>
                  <span className="text-xs text-muted-foreground">{SCHOOL_OPS_DATA_SOURCE.detail}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AboutModal />
              </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6 xl:gap-8 xl:items-start">
              
              {/* Left Column (Issues) */}
              <div className="space-y-6">
                <Tabs defaultValue="all" className="w-full min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <TabsList className="grid h-auto w-full grid-cols-3 bg-muted/50 p-1 sm:inline-flex sm:w-auto">
                      <TabsTrigger value="all" className="min-h-10 px-2 text-[11px] sm:px-3 sm:text-sm">
                        All <span className="hidden min-[360px]:inline">&nbsp;Items</span> <Badge variant="secondary" className="ml-1 sm:ml-2 bg-background">{issues.length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="critical" className="min-h-10 px-2 text-[11px] sm:px-3 sm:text-sm data-[state=active]:text-destructive">
                        Critical <Badge variant="destructive" className="ml-1 sm:ml-2">{criticalIssues.length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="attention" className="min-h-10 px-2 text-[11px] sm:px-3 sm:text-sm data-[state=active]:text-warning">
                        Attention <Badge variant="warning" className="ml-1 sm:ml-2">{attentionIssues.length}</Badge>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className={isRunning ? 'opacity-50 pointer-events-none transition-opacity duration-300 blur-[1px]' : 'transition-opacity duration-500'}>
                    <TabsContent value="all" className="space-y-4 m-0">
                      {issues.map(issue => (
                        <IssueCard 
                          key={issue.id} 
                          issue={issue} 
                          onActionApprove={handleActionApprove}
                          onActionDismiss={handleActionDismiss}
                        />
                      ))}
                    </TabsContent>
                    <TabsContent value="critical" className="space-y-4 m-0">
                      {criticalIssues.map(issue => (
                        <IssueCard 
                          key={issue.id} 
                          issue={issue} 
                          onActionApprove={handleActionApprove}
                          onActionDismiss={handleActionDismiss}
                        />
                      ))}
                      {criticalIssues.length === 0 && (
                        <div className="p-8 text-center border rounded-lg bg-card text-muted-foreground">No critical issues to display.</div>
                      )}
                    </TabsContent>
                    <TabsContent value="attention" className="space-y-4 m-0">
                      {attentionIssues.map(issue => (
                        <IssueCard 
                          key={issue.id} 
                          issue={issue} 
                          onActionApprove={handleActionApprove}
                          onActionDismiss={handleActionDismiss}
                        />
                      ))}
                      {attentionIssues.length === 0 && (
                        <div className="p-8 text-center border rounded-lg bg-card text-muted-foreground">No items need attention.</div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              {/* Right Column (Agent Logs & Chat) */}
              <div className="space-y-6 flex flex-col xl:sticky xl:top-8 xl:h-[calc(100vh-120px)] pb-4 xl:pb-0">
                <div className="shrink-0">
                  <AgentActivity 
                    isRunning={isRunning} 
                    onComplete={handleAuditComplete} 
                    hasRunBefore={hasRunBefore} 
                  />
                </div>
                
                <div className="flex-1 min-h-[500px] lg:min-h-0 flex flex-col">
                  <ChatWidget />
                </div>
              </div>
              
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
