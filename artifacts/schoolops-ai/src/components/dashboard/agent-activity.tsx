import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import { CardContent } from '@/components/ui/card';
import { Terminal, RefreshCw, CheckCircle2 } from 'lucide-react';
import { MOCK_ACTIVITY_LOG } from '@/data/mock';
import { cn } from '@/lib/utils';

interface AgentActivityProps {
  isRunning: boolean;
  onComplete?: () => void;
  hasRunBefore: boolean;
}

export function AgentActivity({ isRunning, onComplete, hasRunBefore }: AgentActivityProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const safeLogs = useMemo(
    () => logs.filter((log): log is string => typeof log === 'string'),
    [logs],
  );
  
  useEffect(() => {
    if (!isRunning && hasRunBefore) {
      setLogs(MOCK_ACTIVITY_LOG);
      return;
    }
    
    if (!isRunning && !hasRunBefore) {
      setLogs(["Agent standing by. Ready to run morning audit."]);
      return;
    }

    // Is running
    setLogs([]);
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < MOCK_ACTIVITY_LOG.length) {
        // Capture the entry before incrementing. React may evaluate the state
        // updater after this callback returns, when currentIndex has already
        // advanced (and can point past the end of the array).
        const nextLog = MOCK_ACTIVITY_LOG[currentIndex];
        if (nextLog !== undefined) {
          setLogs(prev => [...prev, nextLog]);
        }
        currentIndex++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 600); // Fast enough to be demo-able (600ms * 10 = ~6 seconds)

    return () => clearInterval(interval);
  }, [isRunning, hasRunBefore, onComplete]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card className="flex flex-col h-[280px] shadow-sm border-muted shrink-0 overflow-hidden">
      <CardHeader className="py-3 px-4 border-b bg-muted/20 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground/90">
            <Terminal className="h-4 w-4 text-primary" />
            Agent Activity Log
          </CardTitle>
          {isRunning ? (
            <span className="flex items-center text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-sm animate-pulse">
              <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> Running
            </span>
          ) : hasRunBefore ? (
            <span className="flex items-center text-xs text-success font-medium bg-success/10 px-2 py-0.5 rounded-sm">
              <CheckCircle2 className="h-3 w-3 mr-1.5" /> Completed
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a] text-green-400 font-mono text-[13px] leading-relaxed scroll-smooth"
      >
        <div className="space-y-1.5">
          {safeLogs.map((log, i) => (
            <div 
              key={i} 
              className={cn(
                "opacity-0 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-forwards",
                log.includes('Critical') || log.includes('anomaly') ? 'text-yellow-300' : '',
                log.includes('Complete') ? 'text-white font-semibold' : ''
              )}
              style={{ animationDelay: `${i === safeLogs.length - 1 && isRunning ? '0ms' : '0ms'}` }}
            >
              <span className="text-white/40 mr-3">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]</span>
              {log}
            </div>
          ))}
          {isRunning && (
            <div className="flex items-center text-white/50 mt-2">
              <span className="w-1.5 h-4 bg-green-500 animate-pulse mr-2"></span> Processing...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
