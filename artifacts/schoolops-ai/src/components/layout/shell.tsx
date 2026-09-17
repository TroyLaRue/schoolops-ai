import React from 'react';
import { LayoutDashboard, Users, MessageSquare, Settings, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Users, label: 'Students' },
    { icon: MessageSquare, label: 'Communications' },
    { icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="w-64 border-r bg-card flex flex-col h-screen fixed left-0 top-0 hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-sm tracking-tighter">SO</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">SchoolOps AI</span>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground mb-4 px-2 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item, i) => (
          <button
            key={i}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              item.active 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>
      
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-foreground">JD</span>
          </div>
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-sm font-medium truncate">Jane Doe</span>
            <span className="text-xs text-muted-foreground truncate">Principal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TopHeader({ onRunAudit, isRunning }: { onRunAudit: () => void, isRunning: boolean }) {
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        {/* Mobile menu button would go here */}
        <h1 className="text-xl font-semibold tracking-tight">Command Center</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent hidden sm:block">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-card" />
        </button>
        <div className="h-6 w-px bg-border hidden sm:block" />
        <button 
          onClick={onRunAudit}
          disabled={isRunning}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all shadow-sm",
            isRunning 
              ? "bg-muted text-muted-foreground cursor-not-allowed" 
              : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow"
          )}
        >
          {isRunning ? (
            <>
              <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              Running Audit...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 22h14" />
                <path d="M5 2h14" />
                <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
              </svg>
              Run Morning Audit
            </>
          )}
        </button>
      </div>
    </header>
  );
}
