import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui';
import { ShieldAlert, AlertTriangle, CheckCircle, FileText, Check, X, Eye, MessageSquare, ListTodo, Activity, BookOpen } from 'lucide-react';
import { Issue, RecommendedAction } from '@/data/mock';
import { cn } from '@/lib/utils';

interface IssueCardProps {
  issue: Issue;
  onActionApprove: (issueId: string, actionId: string) => void;
  onActionDismiss: (issueId: string, actionId: string) => void;
  actionsEnabled?: boolean;
}

export function IssueCard({ issue, onActionApprove, onActionDismiss, actionsEnabled = true }: IssueCardProps) {
  const [selectedAction, setSelectedAction] = useState<RecommendedAction | null>(null);

  const getSeverityConfig = (severity: Issue['severity']) => {
    switch (severity) {
      case 'critical': return { icon: ShieldAlert, color: 'text-destructive', badge: 'destructive' as const };
      case 'attention': return { icon: AlertTriangle, color: 'text-warning', badge: 'warning' as const };
      case 'healthy': return { icon: CheckCircle, color: 'text-success', badge: 'success' as const };
    }
  };

  const config = getSeverityConfig(issue.severity);
  const Icon = config.icon;

  return (
    <Card className={cn("overflow-hidden border-l-4 transition-all hover:shadow-md", 
      issue.severity === 'critical' ? 'border-l-destructive' : 
      issue.severity === 'attention' ? 'border-l-warning' : 
      'border-l-success'
    )}>
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-start justify-between gap-4">
           <div className="flex min-w-0 items-center gap-2">
             <Icon className={cn("h-5 w-5 shrink-0", config.color)} />
             <Badge variant="outline" className="min-w-0 max-w-full truncate uppercase tracking-wider text-[10px] bg-background">
              {issue.category}
            </Badge>
          </div>
           <Badge variant={config.badge} className="shrink-0 capitalize shadow-sm">
            {issue.severity}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-3 font-semibold text-foreground/90 leading-tight">
          {issue.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-5 text-sm">
        <div className="grid gap-3">
          <div className="flex gap-3 items-start">
            <div className="bg-accent/50 p-1.5 rounded-sm mt-0.5">
              <Activity className="h-4 w-4 text-primary" />
            </div>
             <div className="min-w-0 break-words">
              <span className="font-semibold text-foreground block mb-1">Evidence</span>
              <p className="text-muted-foreground leading-relaxed">{issue.evidence}</p>
            </div>
          </div>
          
          <div className="flex gap-3 items-start">
            <div className="bg-accent/50 p-1.5 rounded-sm mt-0.5">
              <AlertTriangle className="h-4 w-4 text-primary" />
            </div>
             <div className="min-w-0 break-words">
              <span className="font-semibold text-foreground block mb-1">Business Impact</span>
              <p className="text-muted-foreground leading-relaxed">{issue.impact}</p>
            </div>
          </div>
          
          {issue.policyBasis && (
            <div className="flex gap-3 items-start">
              <div className="bg-accent/50 p-1.5 rounded-sm mt-0.5">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-foreground block mb-1">Policy Basis</span>
                 <p className="break-words text-muted-foreground leading-relaxed">{issue.policyBasis}</p>
              </div>
            </div>
          )}
        </div>

        {issue.actions.length > 0 && (
          <div className="pt-4 border-t">
            <span className="font-semibold text-foreground block mb-3 text-xs uppercase tracking-wider">Recommended Actions</span>
            <div className="space-y-3">
              {issue.actions.map(action => (
                <div key={action.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border bg-muted/20 gap-3 transition-colors">
                  <div className="flex items-center gap-3">
                    {action.type === 'communication' ? 
                      <MessageSquare className="h-4 w-4 text-primary shrink-0" /> : 
                      <ListTodo className="h-4 w-4 text-primary shrink-0" />
                    }
                     <div className="min-w-0 break-words">
                      <p className="font-medium text-foreground">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {action.status === 'pending' ? (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="min-h-10 text-xs bg-background" disabled={!actionsEnabled} title={!actionsEnabled ? 'Run the audit to save these recommendations to this school’s history.' : undefined}>
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                {action.type === 'communication' ? <MessageSquare className="h-5 w-5 text-primary" /> : <ListTodo className="h-5 w-5 text-primary" />}
                                Review {action.type === 'communication' ? 'Draft' : 'Task'}
                              </DialogTitle>
                            </DialogHeader>
                             <div className="mt-4 break-words rounded-md border bg-muted/50 p-4 font-mono text-sm text-foreground whitespace-pre-wrap">
                              {action.content}
                            </div>
                             <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <DialogClose asChild>
                                 <Button onClick={() => onActionApprove(issue.id, action.id)} disabled={!actionsEnabled}>
                                   Approve recommendation
                                </Button>
                              </DialogClose>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          disabled={!actionsEnabled}
                          onClick={() => onActionDismiss(issue.id, action.id)}
                          title="Dismiss"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                           className="min-h-10 flex-1 text-xs sm:flex-none"
                           disabled={!actionsEnabled}
                          onClick={() => onActionApprove(issue.id, action.id)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Approve
                        </Button>
                      </>
                    ) : action.status === 'approved' ? (
                      <Badge variant="success" className="bg-success/10 text-success border-success/20 py-1">
                        <CheckCircle className="h-3 w-3 mr-1" /> Approved
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="py-1">
                        Dismissed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
