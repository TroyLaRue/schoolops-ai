import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { Send, Sparkles, User, Bot, ArrowRight, Database, Lightbulb, ShieldCheck, Check, BookOpen } from 'lucide-react';
import { AgentAnswer, answerSchoolOpsQuestion } from '@/lib/schoolops-agent';
import { cn } from '@/lib/utils';
import { useSchoolOperations, useSchoolPolicyDocuments } from '@/lib/school-scoped-data';

function citationLabel(section: string) {
  const number = section.match(/^(?:Section\s+)?(\d+(?:\.\d+)*)\./i);
  return number ? `Section ${number[1]}` : section;
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  content?: string;
  answer?: AgentAnswer;
}

export function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'agent', content: 'Ask a question about the active school’s operations. Answers are available after its data and policy documents load.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [stagedActions, setStagedActions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const operationsQuery = useSchoolOperations();
  const policyQuery = useSchoolPolicyDocuments();
  const policyDocs = policyQuery.data ?? [];
  const sourceLabel = operationsQuery.data?.source.label ?? 'Active-school data';

  const suggestions = [
    "How many 7th graders are missing documents?",
    "Which inquiries have not received follow-up?",
    "What is the overall attendance rate today?",
    "What should I prioritize this morning?"
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      if (!operationsQuery.data || policyQuery.isLoading || policyQuery.isError || operationsQuery.isError) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          answer: {
            facts: operationsQuery.isError || policyQuery.isError
              ? 'I could not load this school’s current operations or policy documents. No bundled or other-school information was used.'
              : 'The active-school operations and policy data are still loading. Please retry your question shortly.',
            evidence: [],
          },
        }]);
        setIsTyping(false);
        return;
      }
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        answer: answerSchoolOpsQuestion(text, operationsQuery.data, policyDocs),
      };
      setMessages(prev => [...prev, agentMsg]);
      setIsTyping(false);
    }, 1200);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <Card className="flex flex-col h-full shadow-sm border-muted flex-1 min-h-[520px] overflow-hidden">
      <CardHeader className="py-3 px-5 border-b bg-muted/20 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground/90">
            <Sparkles className="h-4 w-4 text-primary" />
            Ask SchoolOps
          </CardTitle>
           <span className="hidden text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:inline">{sourceLabel}</span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-5 sm:space-y-6 bg-muted/10">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3 sm:gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}>
              <div className={cn("h-8 w-8 shrink-0 rounded-full flex items-center justify-center mt-0.5 shadow-sm border", 
                msg.role === 'user' ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border")}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
              </div>
               <div className={cn("min-w-0 px-3 sm:px-4 py-3 rounded-2xl text-[14px] leading-relaxed max-w-[calc(100%-2.75rem)] sm:max-w-[88%] shadow-sm", 
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-sm border border-primary" 
                  : "bg-card text-foreground rounded-tl-sm border border-border")}>
                 {msg.content}
                 {msg.answer && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5">
                          <span>Answer</span>
                           <span className="text-muted-foreground">{sourceLabel}</span>
                        </div>
                        <p>{msg.answer.facts}</p>
                        {msg.answer.citations && msg.answer.citations.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.answer.citations.map((citation) => (
                              <p key={citation.id} className="text-[11px] leading-snug text-muted-foreground">
                                <BookOpen className="inline h-3 w-3 mr-1 align-[-2px]" />
                                Source: <span className="font-mono font-semibold text-foreground">{citation.policyId ?? citation.sourceId}</span>, {citationLabel(citation.section)}
                                {' · '}{citation.filename ?? citation.title}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      {msg.answer.recommendation && (
                        <details className="group border-t pt-2">
                          <summary className="cursor-pointer select-none text-xs font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                            <Lightbulb className="inline h-3.5 w-3.5 mr-1.5 align-[-2px]" />Why?
                          </summary>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {msg.answer.recommendationBasis && (
                              <Badge variant="outline" className="mb-2 text-[10px]">
                                {msg.answer.recommendationBasis === 'policy-grounded' ? 'Policy-grounded' : 'General suggestion'}
                              </Badge>
                            )}
                            <p>{msg.answer.recommendation}</p>
                          </div>
                        </details>
                      )}

                      {(msg.answer.evidence.length > 0 || (msg.answer.studentRecords?.length ?? 0) > 0) && (
                        <details className="border-t pt-2">
                          <summary className="cursor-pointer select-none text-xs font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                            <Database className="inline h-3.5 w-3.5 mr-1.5 align-[-2px]" />Evidence
                            {msg.answer.studentRecords && <span className="ml-1 font-normal text-muted-foreground">({msg.answer.studentRecords.length} student records)</span>}
                          </summary>
                          <div className="mt-2 space-y-3">
                            {msg.answer.studentRecords && (
                              <div className="space-y-2">
                                {msg.answer.studentRecords.map((student) => (
                                  <div key={student.id} className="rounded-lg border bg-background/70 p-2.5">
                                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                      <span className="text-xs font-semibold text-foreground">{student.name}</span>
                                      <span className="font-mono text-[10px] text-muted-foreground">{student.id}</span>
                                      <span className="text-[10px] text-muted-foreground">Grade {student.grade}</span>
                                    </div>
                                    <ul className="mt-1.5 space-y-1 text-[11px] text-muted-foreground">
                                      {student.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            )}
                            <ul className="space-y-1.5 text-xs text-muted-foreground">
                              {msg.answer.evidence.map((item, index) => <li key={`${index}-${item}`}>• {item}</li>)}
                            </ul>
                          </div>
                        </details>
                      )}

                      {msg.answer.citations && msg.answer.citations.length > 0 && (
                        <details className="border-t pt-2">
                          <summary className="cursor-pointer select-none text-xs font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                            <BookOpen className="inline h-3.5 w-3.5 mr-1.5 align-[-2px]" />Policy source
                          </summary>
                          <div className="mt-2 space-y-3">
                            {msg.answer.citations.map((citation) => (
                              <div key={citation.id} className="rounded-md border bg-background/50 p-2.5 shadow-sm">
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                  <span className="text-xs font-semibold text-foreground">{citation.title}</span>
                                  <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 rounded-sm font-mono bg-background">{citation.sourceKind}</Badge>
                                </div>
                                {citation.filename && <div className="text-[10px] text-muted-foreground mb-1 break-all">{citation.filename}</div>}
                                <div className="text-[10px] text-muted-foreground font-mono mb-1.5">
                                  {citation.section}{citation.policyId ? ` · ${citation.policyId}` : ''} · {citation.sourceId} · v{citation.version}
                                </div>
                                <blockquote className="text-[11px] italic text-muted-foreground border-l-2 pl-2 border-primary/20 whitespace-pre-wrap">"{citation.quote}"</blockquote>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                     {msg.answer.suggestedAction && (
                       <button
                         onClick={() => setStagedActions((actions) =>
                           actions.includes(msg.answer!.suggestedAction!)
                             ? actions
                             : [...actions, msg.answer!.suggestedAction!],
                         )}
                         className="w-full border border-primary/25 bg-primary/5 hover:bg-primary/10 rounded-lg p-2.5 text-left transition-colors"
                       >
                         <div className="flex items-start gap-2">
                           {stagedActions.includes(msg.answer.suggestedAction) ? <Check className="h-4 w-4 text-success mt-0.5" /> : <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />}
                           <div>
                             <div className="text-xs font-semibold">{stagedActions.includes(msg.answer.suggestedAction) ? 'Staged for human review' : msg.answer.suggestedAction}</div>
                             <div className="text-[10px] text-muted-foreground mt-0.5">No external action occurs without approval.</div>
                           </div>
                         </div>
                       </button>
                     )}
                   </div>
                 )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 sm:gap-4">
              <div className="h-8 w-8 shrink-0 rounded-full bg-card border border-border text-foreground flex items-center justify-center mt-0.5 shadow-sm">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-card border border-border shadow-sm rounded-tl-sm flex items-center gap-1.5 h-[46px]">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
        
        <div className="p-3 sm:p-4 md:p-5 bg-background border-t shrink-0">
          {messages.length === 1 && (
            <div className="mb-4 pt-1">
              <div className="flex items-center gap-1.5 mb-3 px-1 text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary/80" />
                <p className="text-[11px] font-semibold uppercase tracking-wider">Suggested Queries</p>
              </div>
              <div className="flex flex-col gap-2">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(suggestion)}
                    className="min-h-11 text-[13px] bg-background hover:bg-accent text-foreground px-3 sm:px-4 py-3 rounded-xl transition-all border shadow-sm text-left flex items-center justify-between group hover:shadow-md"
                  >
                    <span className="font-medium text-foreground/90 pr-4">{suggestion}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 text-primary p-1.5 rounded-md shrink-0">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask about today's operations..."
              className="w-full h-12 rounded-xl border border-input bg-background pl-4 pr-12 text-[14px] shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground"
            />
            <Button 
              size="icon" 
              variant="ghost" 
              className={cn(
                "absolute right-1.5 h-9 w-9 shrink-0 transition-colors rounded-lg",
                input.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground hover:bg-accent"
              )} 
              onClick={() => handleSend(input)} 
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
