import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { MessageSquare, Send, Sparkles, User, Bot } from 'lucide-react';
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
    <Card className="flex flex-col h-[400px] shadow-sm border-muted">
      <CardHeader className="py-3 px-4 border-b bg-muted/20">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground/80">
          <Sparkles className="h-4 w-4 text-primary" />
          Ask SchoolOps
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
              <div className={cn("h-8 w-8 shrink-0 rounded-full flex items-center justify-center", 
                msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground")}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={cn("px-3 py-2 rounded-lg text-sm max-w-[85%]", 
                msg.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm")}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="px-4 py-3 rounded-lg bg-muted rounded-tl-sm flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
        
        <div className="p-3 bg-background border-t">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion)}
                  className="text-[11px] bg-accent/50 hover:bg-accent text-foreground/80 px-2.5 py-1 rounded-full transition-colors border text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask about today's operations..."
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => handleSend(input)} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
