import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Button } from '@/components/ui';
import { Info } from 'lucide-react';

export function AboutModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Info className="h-4 w-4 mr-2" />
          About This Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">SchoolOps AI Demo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4 text-foreground/90 leading-relaxed text-sm">
          <p>
            <strong>The Problem:</strong> School principals and administrators begin every morning swimming in fragmented data. Attendance numbers sit in an ancient SIS, parent communications live in a separate portal, and enrollment inquiries are buried in a CRM. Critical issues (like non-compliant health records or sudden attendance drops) are often discovered hours or days too late.
          </p>
          <p>
            <strong>The Solution:</strong> SchoolOps AI acts as a high-trust operations agent. It connects to the school's data silos, runs a comprehensive morning audit before the bell rings, and surfaces a prioritized brief of what actually matters.
          </p>
          <p>
            <strong>How it works (in this demo):</strong>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Visibility:</strong> Consolidates data into clear "Critical", "Attention", and "Healthy" categories.</li>
              <li><strong>Action-Oriented:</strong> Doesn't just report numbers—it recommends specific actions and drafts the communications for human review.</li>
              <li><strong>Human-in-the-Loop:</strong> No external action (SMS, emails, tasks) happens until explicitly approved by an administrator, building trust.</li>
              <li><strong>Conversational Interface:</strong> Allows ad-hoc querying of the data model without needing to build complex custom reports.</li>
            </ul>
          </p>
          <div className="bg-accent/50 p-4 rounded-md mt-4 border border-border/50 text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> This is a portfolio-ready interactive demo. All data is entirely synthetic and simulated. No real school, student, or financial records are used or connected.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
