import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/shell';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, Button, Badge } from '@/components/ui';
import { Building, ShieldCheck, Link2, BellRing, Database, AlertCircle, Mail, ExternalLink, LockKeyhole, CheckCircle2, Clock3 } from 'lucide-react';
import { GMAIL_STATE_EVENT, getGmailActionLog, getGmailStatus, setGmailStatus, type GmailActionLogEntry, type GmailConnectionStatus } from '@/lib/gmail-demo';

export default function Settings() {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [gmailStatus, setGmailStatusState] = useState<GmailConnectionStatus>(getGmailStatus);
  const [gmailLog, setGmailLog] = useState<GmailActionLogEntry[]>(getGmailActionLog);

  React.useEffect(() => {
    const syncGmailState = () => {
      setGmailStatusState(getGmailStatus());
      setGmailLog(getGmailActionLog());
    };
    window.addEventListener(GMAIL_STATE_EVENT, syncGmailState);
    return () => window.removeEventListener(GMAIL_STATE_EVENT, syncGmailState);
  }, []);

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  const handleConnectGmail = () => {
    setGmailStatus('oauth_pending');
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center px-6 sticky top-0 z-20">
          <h1 className="text-xl font-semibold tracking-tight">Settings & Configuration</h1>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">School Profile</h2>
                <p className="text-sm text-muted-foreground">Manage your institution's core operational parameters.</p>
              </div>
              <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
              </Button>
            </div>

            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-card shadow-sm">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">Gmail Integration</CardTitle>
                        <Badge variant="secondary" className="border border-primary/15 bg-primary/10 text-primary">Demo / Test Account</Badge>
                      </div>
                      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                        Prepare and review synthetic communications through a secure, human-approved workflow. No real school records are used.
                      </p>
                    </div>
                  </div>
                  <Badge variant={gmailStatus === 'connected' ? 'success' : 'outline'} className="w-fit gap-1.5 py-1">
                    {gmailStatus === 'connected' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-muted-foreground" />}
                    {gmailStatus === 'connected' ? 'Connected' : gmailStatus === 'oauth_pending' ? 'OAuth setup pending' : 'Not connected'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1.15fr_.85fr]">
                <div className="space-y-4">
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <LockKeyhole className="h-4 w-4 text-primary" />
                      Safe connection flow
                    </div>
                    <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3"><span className="font-mono text-xs text-primary">01</span><span>Authorize a dedicated Gmail demo account through Google OAuth.</span></li>
                      <li className="flex gap-3"><span className="font-mono text-xs text-primary">02</span><span>SchoolOps creates a draft with synthetic recipient, subject, and body fields.</span></li>
                      <li className="flex gap-3"><span className="font-mono text-xs text-primary">03</span><span>A human reviews and approves the draft before any send request.</span></li>
                    </ol>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={handleConnectGmail} className="gap-2" disabled={gmailStatus === 'oauth_pending'}>
                      <ExternalLink className="h-4 w-4" />
                      {gmailStatus === 'oauth_pending' ? 'Connection requested' : 'Connect Gmail'}
                    </Button>
                    <span className="text-xs text-muted-foreground">Sending stays disabled until valid credentials are confirmed.</span>
                  </div>
                </div>

                <div className="rounded-lg border bg-card">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="text-sm font-semibold">Gmail action log</div>
                    <Badge variant="outline">{gmailLog.length} events</Badge>
                  </div>
                  <div className="max-h-52 overflow-y-auto p-4">
                    {gmailLog.length ? (
                      <div className="space-y-3">
                        {gmailLog.slice(0, 6).map((entry) => (
                          <div key={entry.id} className="flex gap-3 text-xs">
                            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-foreground">{entry.message}</div>
                              <div className="mt-0.5 text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-7 text-center text-xs text-muted-foreground">Draft, approval, and send events will appear here.</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column */}
              <div className="md:col-span-2 space-y-6">
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building className="h-5 w-5 text-primary" /> Institution Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">School Name</label>
                        <input type="text" defaultValue="Oakridge Middle School" className="w-full px-3 py-2 border rounded-md text-sm bg-background" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">District ID</label>
                        <input type="text" defaultValue="DIST-8842" className="w-full px-3 py-2 border rounded-md text-sm bg-muted text-muted-foreground" disabled />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Operating Hours</label>
                      <div className="flex items-center gap-2">
                        <input type="time" defaultValue="07:30" className="px-3 py-2 border rounded-md text-sm bg-background" />
                        <span className="text-muted-foreground">to</span>
                        <input type="time" defaultValue="15:30" className="px-3 py-2 border rounded-md text-sm bg-background" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldCheck className="h-5 w-5 text-primary" /> AI Agent Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-foreground">Autonomy Level</h4>
                      
                      <label className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                        <input type="radio" name="autonomy" className="mt-1" defaultChecked />
                        <div>
                          <div className="font-medium text-sm">Human-in-the-Loop (Recommended)</div>
                          <div className="text-xs text-muted-foreground mt-0.5">AI drafts communications and proposes tasks, but requires explicit human approval before execution.</div>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                        <input type="radio" name="autonomy" className="mt-1" />
                        <div>
                          <div className="font-medium text-sm">Semi-Autonomous</div>
                          <div className="text-xs text-muted-foreground mt-0.5">AI executes routine tasks automatically but requires approval for external communications.</div>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-foreground">Alert Thresholds</h4>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm">Attendance Drop Anomaly</span>
                        <select defaultValue="10% Variance" className="border rounded-md text-sm p-1.5 bg-background">
                          <option>5% Variance</option>
                          <option>10% Variance</option>
                          <option>15% Variance</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm">Missing Document Deadline</span>
                        <select defaultValue="48 Hours Before" className="border rounded-md text-sm p-1.5 bg-background">
                          <option>24 Hours Before</option>
                          <option>48 Hours Before</option>
                          <option>1 Week Before</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Right Column */}
              <div className="space-y-6">
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Link2 className="h-5 w-5 text-primary" /> Future Integrations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded-md mb-4 flex gap-2 items-start">
                      <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        These integrations are strictly demo-only and not connected to any live data systems.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-3">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">PowerSchool SIS</span>
                        </div>
                        <Badge variant="outline">Simulated source</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-3">
                          <BellRing className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Twilio SMS</span>
                        </div>
                        <Badge variant="outline">Simulated source</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-md opacity-60 grayscale">
                        <div className="flex items-center gap-3">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Blackbaud CRM</span>
                        </div>
                        <Button variant="outline" size="sm" className="h-6 text-xs px-2">Planned</Button>
                      </div>
                    </div>
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