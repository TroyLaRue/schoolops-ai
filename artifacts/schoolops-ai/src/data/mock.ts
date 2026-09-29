export type IssueSeverity = 'critical' | 'attention' | 'healthy';
export type ActionStatus = 'pending' | 'approved' | 'dismissed' | 'completed';
export type IssueStatus = 'open' | 'resolved';

export interface RecommendedAction {
  id: string;
  type: 'communication' | 'task';
  title: string;
  description: string;
  status: ActionStatus;
  content?: string; 
}

export interface Issue {
  id: string;
  title: string;
  category: string;
  severity: IssueSeverity;
  evidence: string;
  impact: string;
  policyBasis?: string;
  actions: RecommendedAction[];
}

export const MOCK_ISSUES: Issue[] = [
  {
    id: 'iss-001',
    title: '37 Students Missing Immunization Records',
    category: 'Required Documents',
    severity: 'critical',
    evidence: '37 students in Grade 6-8 have not submitted updated Tdap booster records. State reporting deadline is 5:00 PM today.',
    impact: 'Non-compliance results in automatic state funding deductions and students must be excluded from campus starting tomorrow.',
    policyBasis: 'Enrollment & Required Documents Guide, Section 2. Immunization review, POL-ENR-2026',
    actions: [
      {
        id: 'act-001a',
        type: 'communication',
        title: 'Draft Urgent SMS to Parents',
        description: 'Send a final warning SMS to the 37 unverified families.',
        status: 'pending',
        content: "URGENT from Oakridge Middle: Your child is missing required Tdap records. By state law, they cannot attend school tomorrow without proof of vaccination. Please upload to the parent portal immediately."
      },
      {
        id: 'act-001b',
        type: 'task',
        title: 'Create Task for Nurse Jenkins',
        description: 'Instruct school nurse to process incoming forms immediately.',
        status: 'pending',
        content: 'Task: Review and approve pending Tdap uploads in SIS. Priority: HIGH.'
      }
    ]
  },
  {
    id: 'iss-002',
    title: 'Unusual Attendance Drop in Grade 11',
    category: 'Attendance',
    severity: 'critical',
    evidence: 'Grade 11 attendance dropped to 81% today (historical average 94%). 23 students absent.',
    impact: 'Sudden drops often indicate a spreading illness or an unapproved senior skip day. Needs immediate investigation.',
    policyBasis: 'Attendance & Student Support Policy, Section 4. Urgent patterns, POL-ATT-2026',
    actions: [
      {
        id: 'act-002a',
        type: 'communication',
        title: 'Email 11th Grade Advisors',
        description: 'Ask advisors to check in with absent students.',
        status: 'pending',
        content: 'Subject: URGENT: Grade 11 Attendance Drop\n\nHi team, we are seeing an 81% attendance rate for Grade 11 today. Please reach out to your advisees who are absent to determine if this is illness-related or other coordinated absences.'
      }
    ]
  },
  {
    id: 'iss-003',
    title: '12 Inquiries pending follow-up > 48 hours',
    category: 'Enrollment',
    severity: 'attention',
    evidence: '12 prospective families for Grade 9 have not been contacted since submitting inquiry forms on Tuesday.',
    impact: 'Lead conversion drops by 40% when response time exceeds 24 hours.',
    actions: [
      {
        id: 'act-003a',
        type: 'task',
        title: 'Assign to Admissions Team',
        description: 'Create a high-priority task in CRM for admissions.',
        status: 'pending',
        content: 'Task: Follow up with 12 aging inquiries for Grade 9. Goal: Schedule campus tours.'
      }
    ]
  },
  {
    id: 'iss-004',
    title: 'Tuition Collection on Track',
    category: 'Tuition/Payment',
    severity: 'healthy',
    evidence: '94% of October installments collected successfully.',
    impact: 'Ensures operational cash flow for payroll next week.',
    policyBasis: 'Tuition Account Review Policy, Section 2. Account flags, POL-TUI-2026',
    actions: []
  }
];

export const MOCK_ACTIVITY_LOG = [
  "Initializing Morning Audit...",
  "Connecting to SIS (Student Information System)...",
  "Analyzing attendance patterns across 1,240 active students...",
  "Flagging anomaly: Grade 11 attendance variance > 10%...",
  "Checking state compliance document statuses...",
  "Identified 37 critical missing health records (Tdap)...",
  "Reviewing admissions CRM for untouched inquiries...",
  "Auditing payment gateway for October tuition installments...",
  "Synthesizing Today's Operations Brief...",
  "Audit Complete. 2 Critical, 1 Attention, 1 Healthy."
];

export const MOCK_QA_RESPONSES: Record<string, string> = {
  "How many 7th graders are missing documents?": "There are currently 14 7th graders missing required documents. 12 are missing the Tdap booster record, and 2 are missing the annual physical form.",
  "Which inquiries have not received follow-up?": "There are 12 inquiries for Grade 9 that have not been contacted. They were submitted on Tuesday by the following families: Smith, Johnson, Williams, Brown, Jones, Garcia, Miller, Davis, Rodriguez, Martinez, Hernandez, and Lopez.",
  "What is the overall attendance rate today?": "The overall school attendance rate today is 91.2%. This is driven down primarily by an 81% attendance rate in Grade 11. Other grades are averaging 94.5%."
};
