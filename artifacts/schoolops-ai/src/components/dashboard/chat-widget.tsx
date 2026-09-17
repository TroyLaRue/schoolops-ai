import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { MessageSquare, Send, Sparkles, User, Bot, ArrowRight } from 'lucide-react';
import { MOCK_QA_RESPONSES } from '@/data/mock';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

export function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'agent', content: 'I have analyzed today\'s data. How can I help you dig deeper into the operations brief?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "How many 7th graders are missing documents?",
    "Which inquiries have not received follow-up?",
    "What is the overall attendance rate today?"
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const responseText = MOCK_QA_RESPONSES[text] || "I don't have a pre-configured answer for that specific question in this demo, but I am analyzing the simulated data sources to find the answer.";
      const agentMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', content: responseText };
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
    <Card className="flex flex-col h-full shadow-sm border-muted flex-1 min-h-[400px] overflow-hidden">
      <CardHeader className="py-3 px-5 border-b bg-muted/20 shrink-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground/90">
          <Sparkles className="h-4 w-4 text-primary" />
          Ask SchoolOps
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-muted/10">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3 sm:gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}>
              <div className={cn("h-8 w-8 shrink-0 rounded-full flex items-center justify-center mt-0.5 shadow-sm border", 
                msg.role === 'user' ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border")}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
              </div>
              <div className={cn("px-4 py-3 rounded-2xl text-[14px] leading-relaxed max-w-[85%] shadow-sm", 
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-sm border border-primary" 
                  : "bg-card text-foreground rounded-tl-sm border border-border")}>
                {msg.content}
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
        
        <div className="p-4 md:p-5 bg-background border-t shrink-0">
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
                    className="text-[13px] bg-background hover:bg-accent text-foreground px-4 py-3 rounded-xl transition-all border shadow-sm text-left flex items-center justify-between group hover:shadow-md"
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
