import React, { useMemo } from 'react';
import { Link, useParams } from 'wouter';
import { Sidebar } from '@/components/layout/shell';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { buttonVariants } from '@/components/ui/button';
import { NORMALIZED_SCHOOL_DATA, SCHOOL_OPS_DATA_SOURCE } from '@/data/schoolops-data';
import { 
  ChevronRight, 
  Sparkles, 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  AlertCircle, 
  Clock3, 
  Mail, 
  ArrowLeft 
} from 'lucide-react';
import { 
  useGetActivityHistory, 
  useUpdateAgentAction, 
  getGetActivityHistoryQueryKey, 
  type AgentAction 
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

function ActionRow({ action, onApprove }: { action: AgentAction, onApprove: (id: number) => void }) {
  const isPending = action.status === 'pending';
  
  return (
    <div className="p-4 flex gap-3 hover:bg-muted/50 transition-colors">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {action.type === 'communication' ? <Mail className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-sm text-foreground">{action.title}</span>
          <Badge 
            variant={action.status === 'completed' ? 'success' : action.status === 'approved' ? 'success' : 'secondary'} 
            className={cn("text-[10px] px-1.5 py-0 capitalize", action.status === 'pending' && "border-warning text-warning bg-warning/10")}
          >
            {action.status}
          </Badge>
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {action.type === 'communication' ? 'Gmail' : 'SchoolOps'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
        
        {action.type === 'communication' && action.content && (
          <div className="mt-2 p-2 bg-background border rounded text-xs font-mono text-muted-foreground line-clamp-3 whitespace-pre-wrap">
             {action.content}
          </div>
        )}

        <div className="pt-2 flex items-center justify-between">
           <span className="text-[10px] text-muted-foreground">
             {new Date(action.createdAt).toLocaleDateString()}
           </span>
           {isPending && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onApprove(action.id)}>
                 Approve for review
             </Button>
           )}
        </div>
      </div>
    </div>
  );
}

export default function StudentDetail() {
  const params = useParams<{ studentId: string }>();
  const studentId = params?.studentId;
  const queryClient = useQueryClient();
  const { data: history } = useGetActivityHistory();
  const updateAction = useUpdateAgentAction();

  const student = useMemo(() => 
    NORMALIZED_SCHOOL_DATA.students.find(s => s.id === studentId),
  [studentId]);

  const relevantActions = useMemo(() => {
    if (!history || !student) return [];
    const nameParts = student.name.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    
    return history.actions.filter(action => {
      const targetStr = [
        action.recipient, 
        action.description, 
        action.content, 
        action.title, 
        action.reason
      ].filter(Boolean).join(' ').toLowerCase();
      
      return targetStr.includes(student.name.toLowerCase()) || 
             targetStr.includes(`${lastName.toLowerCase()} family`) ||
             targetStr.includes(student.id.toLowerCase());
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [history, student]);
  const relatedCommunications = relevantActions.filter((action) => action.type === 'communication');

  const handleApprove = (actionId: number) => {
    updateAction.mutate({ id: actionId, data: { status: 'approved' } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetActivityHistoryQueryKey() })
    });
  };

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 pb-20 md:pb-0 md:pl-64 flex flex-col min-w-0">
          <header className="min-h-16 border-b bg-card flex items-center px-4 py-2 sm:px-6 sticky top-0 z-20">
             <Link href="/students" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Directory</Link>
             <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
             <span className="text-sm font-medium text-foreground">Not Found</span>
          </header>
          <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
             <Card className="max-w-md w-full text-center p-8 border-dashed">
               <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
               <h2 className="text-lg font-semibold mb-2">Student Not Found</h2>
               <p className="text-sm text-muted-foreground mb-6">We couldn't find a synthetic student record matching ID "{studentId}".</p>
               <Link href="/students" className={cn(buttonVariants({ variant: 'default' }), "gap-2")}>
                 <ArrowLeft className="h-4 w-4" /> Return to Directory
               </Link>
             </Card>
          </main>
        </div>
      </div>
    );
  }

  const flags = [];
  if (student.attendanceRisk !== 'low') flags.push(`attendance (${student.attendanceRate}% vs ${NORMALIZED_SCHOOL_DATA.attendance.historicalRate}% baseline)`);
  if (student.missingDocuments.length > 0) flags.push(`missing documents (${student.missingDocuments.join(', ')})`);
  if (student.tuitionStatus !== 'current') flags.push(`account status (${student.tuitionStatus.replace('_', ' ')})`);
  if (student.enrollmentStatus !== 'active') flags.push(`enrollment status (${student.enrollmentStatus})`);

  const isHealthy = flags.length === 0;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 pb-20 md:pb-0 md:pl-64 flex flex-col min-w-0">
        <header className="min-h-16 border-b bg-card flex items-center px-4 py-2 sm:px-6 sticky top-0 z-20">
           <Link href="/students" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Directory</Link>
           <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
           <span className="text-sm font-medium text-foreground">{student.name}</span>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            
            <div className="flex items-start justify-between gap-4 flex-col sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{student.name}</h1>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <span>{student.id}</span>
                  <span>&bull;</span>
                  <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">Synthetic Data</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                
                {/* AI Summary */}
                <Card className={cn("border-primary/20 shadow-sm", isHealthy ? "bg-success/5" : "bg-primary/5")}>
                  <CardHeader className="pb-2 border-b border-primary/10">
                    <CardTitle className="text-sm flex items-center gap-2 text-primary">
                      <Sparkles className="h-4 w-4" /> SchoolOps AI Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-foreground/90 mb-3 leading-relaxed">
                      {isHealthy 
                        ? `${student.name} is currently in good standing across all tracked operational metrics. No risk factors detected in the latest sync.` 
                        : `${student.name} has been flagged for attention due to anomalies in ${flags.join(', ')}.`
                      }
                    </p>
                    <div className="flex items-start gap-2 bg-background/50 rounded-md p-3 border border-primary/10">
                       <span className="font-semibold text-[10px] uppercase tracking-wider text-primary shrink-0 mt-0.5">Recommendation</span>
                       <span className="text-sm text-foreground/80">
                         {isHealthy 
                           ? "No immediate operational action is required." 
                           : "Review the specific flags below and approve the suggested communications or tasks to resolve these issues."}
                       </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Info */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-semibold">Profile</CardTitle>
                        <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px] font-medium">{SCHOOL_OPS_DATA_SOURCE.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-base truncate">{student.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{student.id}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Grade</div>
                          <div className="text-sm font-medium flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-muted-foreground"/> Grade {student.grade}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Enrollment</div>
                          <Badge variant={student.enrollmentStatus === 'active' ? 'success' : 'secondary'} className="capitalize bg-success/10 text-success border-success/20">{student.enrollmentStatus}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Attendance & Account */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">Operational Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                      <div>
                        <div className="flex justify-between items-end mb-1.5">
                          <div className="text-[10px] uppercase font-semibold text-muted-foreground">Attendance Rate</div>
                          <div className={cn("text-sm font-bold", student.attendanceRisk === 'high' ? 'text-destructive' : student.attendanceRisk === 'medium' ? 'text-warning' : 'text-success')}>
                            {student.attendanceRate}%
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 mb-1.5 overflow-hidden">
                           <div className={cn("h-1.5 rounded-full", student.attendanceRisk === 'high' ? 'bg-destructive' : student.attendanceRisk === 'medium' ? 'bg-warning' : 'bg-success')} style={{ width: `${student.attendanceRate}%` }}></div>
                        </div>
                        <div className="text-xs text-muted-foreground flex justify-between">
                          <span>Baseline: {NORMALIZED_SCHOOL_DATA.attendance.historicalRate}%</span>
                          <span className="capitalize">{student.attendanceRisk} Risk</span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">Tuition & Account</div>
                        <div className="flex items-center gap-2">
                           {student.tuitionStatus === 'current' ? (
                             <Badge variant="success" className="bg-success/10 text-success border-success/20 gap-1.5"><CheckCircle2 className="h-3 w-3"/> Current</Badge>
                           ) : (
                             <Badge variant="warning" className="gap-1.5 bg-warning/10 text-warning-foreground border-warning/20"><AlertTriangle className="h-3 w-3"/> {student.tuitionStatus.replace('_', ' ')}</Badge>
                           )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Documents */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-semibold">Compliance Documents</CardTitle>
                      <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px] font-medium">{SCHOOL_OPS_DATA_SOURCE.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {student.missingDocuments.length > 0 && (
                         <div className="bg-destructive/5 p-4 sm:p-5">
                            <h4 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-3">
                              <AlertCircle className="h-4.5 w-4.5" /> Action Required: Missing Documents
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {student.missingDocuments.map(doc => (
                                <div key={doc} className="flex items-center gap-3 bg-background border border-destructive/20 rounded-md p-3 shadow-sm">
                                  <FileText className="h-4 w-4 text-destructive shrink-0" />
                                  <div className="font-medium text-sm text-foreground">{doc}</div>
                                </div>
                              ))}
                            </div>
                         </div>
                      )}
                      <div className="p-4 sm:p-5">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Completed Documents</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {student.completedDocuments.length > 0 ? student.completedDocuments.map(doc => (
                            <div key={doc} className="flex items-center gap-3 bg-background border rounded-md p-3">
                              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                              <div className="font-medium text-sm text-muted-foreground">{doc}</div>
                            </div>
                          )) : (
                            <div className="text-sm text-muted-foreground col-span-full">No standard documents recorded.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>

              <div className="space-y-6">
                <Card className="shadow-sm">
                   <CardHeader className="pb-3 border-b">
                     <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-semibold">Recent Communications</CardTitle>
                        <Badge variant="outline" className="text-[10px] font-medium">Gmail</Badge>
                     </div>
                   </CardHeader>
                    <CardContent className="p-0">
                       {relatedCommunications.length > 0 ? (
                        <div className="divide-y">
                            {relatedCommunications.slice(0, 4).map(action => (
                              <ActionRow key={action.id} action={action} onApprove={handleApprove} />
                           ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
                          <Clock3 className="h-8 w-8 mb-3 text-muted-foreground/30" />
                           No recent synthetic communications found for this student.
                        </div>
                      )}
                   </CardContent>
                </Card>

                 <Card className="shadow-sm">
                   <CardHeader className="border-b pb-3">
                     <div className="flex items-center justify-between gap-3">
                       <CardTitle className="text-base font-semibold">Recommended Actions</CardTitle>
                       <Badge variant="outline" className="text-[10px] font-medium">SchoolOps</Badge>
                     </div>
                   </CardHeader>
                   <CardContent className="p-0">
                     {relevantActions.length > 0 ? (
                       <div className="divide-y">
                         {relevantActions.slice(0, 6).map((action) => (
                           <ActionRow key={action.id} action={action} onApprove={handleApprove} />
                         ))}
                       </div>
                     ) : (
                       <div className="p-6 text-center text-sm text-muted-foreground">No open or completed recommendations are linked to this student.</div>
                     )}
                     <div className="border-t bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                       Approval records administrator intent only. Any external Gmail delivery still requires the guarded send step in Communications Review.
                     </div>
                   </CardContent>
                 </Card>

                 <Card className="shadow-sm">
                   <CardHeader className="border-b pb-3">
                     <CardTitle className="text-base font-semibold">Activity History</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-3 pt-4">
                     {relevantActions.length > 0 ? relevantActions.slice(0, 6).map((action) => {
                       const occurredAt = action.completedAt ?? action.dismissedAt ?? action.approvedAt ?? action.createdAt;
                       return (
                         <div key={action.id} className="flex gap-3">
                           <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                           <div className="min-w-0">
                             <p className="text-sm font-medium">{action.title}</p>
                             <p className="text-xs text-muted-foreground">
                               {action.status === 'completed' ? 'Completed' : action.status === 'approved' ? 'Approved for review' : action.status === 'dismissed' ? 'Dismissed' : 'Created for review'}
                               {' · '}
                               {new Date(occurredAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                             </p>
                           </div>
                         </div>
                       );
                     }) : (
                       <p className="text-sm text-muted-foreground">No student-specific history is available in the current synthetic activity feed.</p>
                     )}
                   </CardContent>
                 </Card>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
