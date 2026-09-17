import React, { useState } from 'react';
import { Sidebar, TopHeader } from '@/components/layout/shell';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, Badge, Button } from '@/components/ui';
import { Mail, CheckCircle2, Clock, XCircle, Smartphone, Info, Plus, LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addGmailActionLog } from '@/lib/gmail-demo';
import { useGetGmailStatus, useSendGmailDemoEmail } from '@workspace/api-client-react';

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
}

const INITIAL_COMMS: Communication[] = [
  {
    id: 'COM-2041',
    recipient: 'Johnson Family (Maya Johnson, 11th)',
    channel: 'email',
    subject: 'Urgent: Missing Immunization Record',
    message: 'Dear Johnson Family,\n\nOur records indicate that Maya is missing the required Tdap booster record. Per state law, students without this documentation cannot attend classes starting tomorrow. Please upload the record to the portal immediately.',
    reason: 'State compliance deadline approaching.',
    status: 'draft',
    timestamp: 'Today, 8:42 AM'
  },
  {
    id: 'COM-2042',
    recipient: 'Williams Family (Olivia Williams, 8th)',
    channel: 'sms',
    message: 'Oakridge Middle: Olivia is missing required emergency contact forms. Please update via parent portal today to avoid field trip restrictions.',
    reason: 'Missing emergency contacts.',
    status: 'draft',
    timestamp: 'Today, 8:45 AM'
  },
  {
    id: 'COM-2043',
    recipient: '11th Grade Advisors',
    channel: 'email',
    subject: 'Action Required: Attendance Check',
    message: 'Team, we are seeing an anomalous 81% attendance rate for Grade 11 today. Please check in with absent advisees to determine if this is illness-related or an unapproved skip day. Report findings by 12:00 PM.',
    reason: 'Attendance anomaly detection.',
    status: 'approved',
    timestamp: 'Today, 7:15 AM'
  }
];

export default function Communications() {
  const [comms, setComms] = useState<Communication[]>(INITIAL_COMMS);
  const [sendError, setSendError] = useState('');
  const gmailConnection = useGetGmailStatus();
  const sendGmail = useSendGmailDemoEmail();
  const sendingEnabled = gmailConnection.data?.canSend === true;

  const handleApprove = (id: string) => {
    const communication = comms.find((item) => item.id === id);
    setComms(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c));
    if (communication) addGmailActionLog('draft_approved', `Approved synthetic draft ${communication.id}`);
  };

  const handleReject = (id: string) => {
    setComms(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
  };

  const handleCreateDraft = () => {
    const id = `COM-${Date.now().toString().slice(-4)}`;
    const draft: Communication = {
      id,
      recipient: 'Connected Gmail test account (self-send)',
      channel: 'email',
      subject: 'Demo reminder: Tdap booster record',
      message: 'Dear Davis Family,\\n\\nThis is a synthetic SchoolOps AI demonstration. The demo record for Avery shows a missing Tdap booster document. Please review the test portal when convenient.\\n\\nNo real student or family data was used in this message.',
      reason: 'Synthetic missing-document flag.',
      status: 'draft',
      timestamp: 'Just now',
    };
    setComms((current) => [draft, ...current]);
    addGmailActionLog('draft_created', `Created synthetic Gmail draft ${id}`);
  };

  const handleSend = (id: string) => {
    if (!sendingEnabled) return;
    const communication = comms.find((item) => item.id === id);
    if (!communication?.subject) return;
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
        setComms((current) => current.map((item) => item.id === id ? { ...item, status: 'sent' } : item));
        addGmailActionLog('email_sent', `Sent approved synthetic draft ${id} to the connected Gmail test account`);
      },
      onError: () => {
        setSendError('Gmail could not send this demo message. The draft remains approved and unsent.');
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold tracking-tight">Communications Review</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Synthetic Data</Badge>
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
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-muted-foreground">
                  {comms.filter(c => c.status === 'draft').length} Items
                </Badge>
                <Button onClick={handleCreateDraft} className="gap-2">
                  <Plus className="h-4 w-4" /> Create Demo Draft
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {comms.map(comm => (
                <Card key={comm.id} className={cn(
                  "transition-all duration-200",
                  comm.status === 'approved' && "border-success/50 bg-success/5",
                  comm.status === 'rejected' && "border-destructive/50 bg-destructive/5 opacity-75"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {comm.channel === 'email' ? <Mail className="h-4 w-4 text-muted-foreground" /> : <Smartphone className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-semibold">{comm.recipient}</span>
                          <span className="text-xs text-muted-foreground ml-2">{comm.timestamp}</span>
                        </div>
                        {comm.subject && (
                          <div className="text-sm font-medium">Subject: {comm.subject}</div>
                        )}
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
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
                    <div className="bg-background border rounded-md p-4 text-sm whitespace-pre-wrap font-mono text-muted-foreground">
                      {comm.message}
                    </div>
                  </CardContent>
                  
                  {comm.status === 'draft' && (
                    <CardFooter className="bg-muted/30 border-t pt-4 flex justify-end gap-2">
                      <Button variant="outline" onClick={() => handleReject(comm.id)}>
                        Reject
                      </Button>
                      <Button variant="default" onClick={() => handleApprove(comm.id)} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Approve Draft
                      </Button>
                    </CardFooter>
                  )}
                  {comm.status === 'approved' && comm.channel === 'email' && (
                    <CardFooter className="flex-col items-stretch gap-2 border-t bg-muted/30 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <LockKeyhole className="h-3.5 w-3.5" />
                        {sendingEnabled ? 'Delivery is restricted to your connected Gmail test account.' : 'Connect a valid Gmail demo account in Settings to enable sending.'}
                      </div>
                      <Button onClick={() => handleSend(comm.id)} disabled={!sendingEnabled || sendGmail.isPending} className="gap-2">
                        <Mail className="h-4 w-4" /> {sendGmail.isPending ? 'Sending...' : 'Approve & Send'}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
              
              {comms.length === 0 && (
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