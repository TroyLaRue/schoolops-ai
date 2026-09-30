import React, { useState } from 'react';
import { useCreateAgentAction, useUpdateAgentAction } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/shell';
import { Card, CardContent, CardHeader, CardFooter, Badge, Button } from '@/components/ui';
import { Mail, CheckCircle2, Clock, XCircle, Smartphone, Info, Plus, LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGetGmailStatus, useSendGmailDemoEmail } from '@workspace/api-client-react';
import { useSchoolActivityHistory, useSchoolOperations } from '@/lib/school-scoped-data';
import { useSchoolSession } from '@/lib/school-session';

const SAFE_EMAIL_SUBJECT = 'SchoolOps synthetic follow-up test';
const SAFE_EMAIL_BODY = 'This is a synthetic SchoolOps email test. It contains no student, family, or school operational information.';

type CommStatus = 'draft' | 'approved' | 'sent' | 'rejected';

interface Communication {
  id: string;
  recipient: string;
  channel: 'email' | 'sms';
  subject?: string;
  message: string;
  reason: string;
  status: CommStatus;
  timestamp: string;
  recordId?: number;
}

export default function Communications() {
  const { currentSchool } = useSchoolSession();
  const canApprove = currentSchool?.membership.role === 'admin' || currentSchool?.membership.role === 'principal';
  const [sendError, setSendError] = useState('');
  const gmailConnection = useGetGmailStatus();
  const sendGmail = useSendGmailDemoEmail();
  const history = useSchoolActivityHistory();
  const operations = useSchoolOperations();
  const queryClient = useQueryClient();
  const createAction = useCreateAgentAction();
  const updateAction = useUpdateAgentAction();
  const sendingEnabled = gmailConnection.data?.canSend === true;

  const comms: Communication[] = (history.data?.actions ?? [])
      .filter((action) => action.type === 'communication')
      .map((action) => ({
        id: action.sourceId,
        recordId: action.id,
        recipient: action.recipient ?? 'Synthetic recipient',
        channel: action.channel === 'sms' ? 'sms' : 'email',
        subject: action.subject ?? undefined,
        message: action.content ?? '',
        reason: action.reason ?? 'Synthetic SchoolOps recommendation.',
        status: action.status === 'completed' ? 'sent' : action.status === 'approved' ? 'approved' : action.status === 'dismissed' ? 'rejected' : 'draft',
        timestamp: new Date(action.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      }));

  const handleApprove = (id: string) => {
    const communication = comms.find((item) => item.id === id);
    if (communication?.recordId) {
      updateAction.mutate({ id: communication.recordId, data: { status: 'approved' } }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/agent/history'] }),
        onError: () => setSendError('The approval could not be saved to this school’s activity history.'),
      });
    }
  };

  const handleReject = (id: string) => {
    const communication = comms.find((item) => item.id === id);
    if (communication?.recordId) {
      updateAction.mutate({ id: communication.recordId, data: { status: 'dismissed' } }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/agent/history'] }),
        onError: () => setSendError('The rejection could not be saved to this school’s activity history.'),
      });
    }
  };

  const handleCreateDraft = () => {
    const id = `COM-${Date.now().toString().slice(-4)}`;
    const draft: Communication = {
      id,
      recipient: 'Active-school communications review',
      channel: 'email',
      subject: 'School operations follow-up draft',
      message: 'Draft a school-specific message here after verifying the relevant active-school records. No recipient or student details have been added.',
      reason: 'User-created draft for active-school review.',
      status: 'draft',
      timestamp: 'Just now',
    };
    createAction.mutate({
      data: {
        sourceId: id,
        type: 'communication',
        title: draft.subject ?? 'Synthetic Gmail draft',
        description: 'User-created active-school draft awaiting administrator review.',
        content: draft.message,
        recipient: draft.recipient,
        subject: draft.subject ?? null,
        channel: draft.channel,
        reason: draft.reason,
        status: 'pending',
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/agent/history'] });
      },
      onError: () => setSendError('The draft could not be saved to this school’s activity history.'),
    });
  };

  const handleSend = (id: string) => {
    if (!sendingEnabled || !canApprove) return;
    const communication = comms.find((item) => item.id === id);
    if (communication?.subject !== SAFE_EMAIL_SUBJECT || communication.message !== SAFE_EMAIL_BODY) return;
    setSendError('');
    sendGmail.mutate({
      data: {
        recipient: 'connected-test-account',
        subject: communication.subject,
        body: communication.message,
        approved: true,
        syntheticDataOnly: true,
      },
    }, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['/api/agent/history'] });
      },
      onError: () => {
        setSendError('Gmail could not send this synthetic message. The persisted draft remains approved and unsent.');
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar />
      <div className="flex-1 pb-24 md:pb-0 md:pl-64 flex flex-col min-w-0">
        <header className="min-h-16 border-b bg-card flex items-center justify-between gap-3 px-4 py-2 sm:px-6 sticky top-0 z-20">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight leading-tight">Communications Review</h1>
            <Badge variant="secondary" className="max-w-full truncate bg-primary/10 text-primary border-primary/20">{operations.data?.source.label ?? 'Active-school communications'}</Badge>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 items-start">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-primary">Human-in-the-Loop Required</h3>
                <p className="text-sm text-primary/80 mt-1">
                  SchoolOps AI uses synthetic records to prepare drafts. Review and approval are required before sending, and Gmail sending remains locked until valid demo-account credentials are configured.
                </p>
              </div>
            </div>

            {sendError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {sendError}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Pending Review</h2>
              <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                <Badge variant="outline" className="text-muted-foreground">
                  {comms.filter(c => c.status === 'draft').length} Items
                </Badge>
                  <Button onClick={handleCreateDraft} className="min-h-11 gap-2" disabled={createAction.isPending}>
                  <Plus className="h-4 w-4" /> Create Review Draft
                </Button>
              </div>
            </div>

            {history.isLoading && <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Loading this school’s communications…</div>}
            {history.isError && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-destructive">Could not load this school’s communication history. No other-school drafts are shown. <Button variant="outline" className="ml-3" onClick={() => history.refetch()}>Retry</Button></div>}
            <div className="space-y-4">
              {!history.isLoading && !history.isError && comms.map(comm => (
                <Card key={comm.recordId ?? comm.id} className={cn(
                  "transition-all duration-200",
                  comm.status === 'approved' && "border-success/50 bg-success/5",
                  comm.status === 'rejected' && "border-destructive/50 bg-destructive/5 opacity-75"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          {comm.channel === 'email' ? <Mail className="h-4 w-4 text-muted-foreground" /> : <Smartphone className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-semibold">{comm.recipient}</span>
                          <span className="text-xs text-muted-foreground sm:ml-2">{comm.timestamp}</span>
                        </div>
                        {comm.subject && (
                          <div className="text-sm font-medium">Subject: {comm.subject}</div>
                        )}
                        <div className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="font-medium">Trigger:</span> {comm.reason}
                        </div>
                      </div>
                      
                      {comm.status === 'draft' ? (
                        <Badge variant="outline" className="bg-background text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Needs Review
                        </Badge>
                      ) : comm.status === 'approved' ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </Badge>
                      ) : comm.status === 'sent' ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Sent
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Rejected
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="break-words bg-background border rounded-md p-3 sm:p-4 text-xs sm:text-sm whitespace-pre-wrap font-mono text-muted-foreground">
                      {comm.message}
                    </div>
                  </CardContent>
                  
                  {comm.status === 'draft' && canApprove && (
                    <CardFooter className="grid grid-cols-2 gap-2 border-t bg-muted/30 pt-4 sm:flex sm:justify-end">
                      <Button variant="outline" onClick={() => handleReject(comm.id)} className="min-h-11">
                        Reject
                      </Button>
                      <Button variant="default" onClick={() => handleApprove(comm.id)} className="min-h-11 gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Approve Draft
                      </Button>
                    </CardFooter>
                  )}
                  {comm.status === 'draft' && !canApprove && (
                    <CardFooter className="border-t bg-muted/30 pt-4 text-xs text-muted-foreground">
                      An administrator or principal must review this draft.
                    </CardFooter>
                  )}
                  {comm.status === 'approved' && comm.channel === 'email' && (
                    <CardFooter className="flex-col items-stretch gap-2 border-t bg-muted/30 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <LockKeyhole className="h-3.5 w-3.5" />
                        {comm.subject !== SAFE_EMAIL_SUBJECT || comm.message !== SAFE_EMAIL_BODY
                          ? 'Only the server-provided synthetic test template can be sent through Gmail.'
                          : sendingEnabled ? 'Delivery is restricted to the connected Gmail test account.' : 'Gmail test delivery is unavailable for this school or role.'}
                      </div>
                      {comm.subject === SAFE_EMAIL_SUBJECT && comm.message === SAFE_EMAIL_BODY && canApprove && (
                        <Button onClick={() => handleSend(comm.id)} disabled={!sendingEnabled || sendGmail.isPending} className="min-h-11 w-full gap-2 sm:w-auto">
                          <Mail className="h-4 w-4" /> {sendGmail.isPending ? 'Sending...' : 'Send approved test email'}
                        </Button>
                      )}
                    </CardFooter>
                  )}
                </Card>
              ))}
              
              {!history.isLoading && !history.isError && comms.length === 0 && (
                <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
                  No communications pending review.
                </div>
              )}
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}