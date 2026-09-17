import React, { useState } from 'react';
import { Sidebar, TopHeader } from '@/components/layout/shell';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, Badge, Button } from '@/components/ui';
import { Mail, CheckCircle2, Clock, XCircle, Smartphone, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type CommStatus = 'draft' | 'approved' | 'rejected';

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

  const handleApprove = (id: string) => {
    setComms(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c));
  };

  const handleReject = (id: string) => {
    setComms(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
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
                  SchoolOps AI drafts these communications based on operational triggers. Approving a message marks it as approved for simulation purposes only. No real emails or SMS messages will be sent.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Pending Review</h2>
              <Badge variant="outline" className="text-muted-foreground">
                {comms.filter(c => c.status === 'draft').length} Items
              </Badge>
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
                        <CheckCircle2 className="h-4 w-4" /> Approve for Simulation
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