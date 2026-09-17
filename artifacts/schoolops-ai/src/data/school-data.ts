export interface StudentRecord {
  id: string;
  name: string;
  grade: number;
  attendanceRate: number;
  attendanceRisk: 'high' | 'medium' | 'low';
  missingDocuments: string[];
  enrollmentStatus: 'active' | 'pending' | 'withdrawn';
  tuitionStatus: 'current' | 'past_due' | 'payment_plan';
}

export interface InquiryRecord {
  id: string;
  family: string;
  student: string;
  grade: number;
  submittedDaysAgo: number;
  lastFollowUpDaysAgo: number | null;
  stage: 'new' | 'contacted' | 'tour_scheduled';
}

export const SYNTHETIC_STUDENTS: StudentRecord[] = [
  { id: 'STU-1001', name: 'Alexander Chen', grade: 9, attendanceRate: 97, attendanceRisk: 'low', missingDocuments: [], enrollmentStatus: 'active', tuitionStatus: 'current' },
  { id: 'STU-1002', name: 'Maya Johnson', grade: 11, attendanceRate: 79, attendanceRisk: 'high', missingDocuments: ['Tdap Booster'], enrollmentStatus: 'active', tuitionStatus: 'past_due' },
  { id: 'STU-1003', name: 'Elijah Smith', grade: 10, attendanceRate: 89, attendanceRisk: 'medium', missingDocuments: [], enrollmentStatus: 'active', tuitionStatus: 'current' },
  { id: 'STU-1004', name: 'Sophia Martinez', grade: 9, attendanceRate: 96, attendanceRisk: 'low', missingDocuments: ['Physical Form'], enrollmentStatus: 'pending', tuitionStatus: 'current' },
  { id: 'STU-1005', name: 'Liam Garcia', grade: 12, attendanceRate: 98, attendanceRisk: 'low', missingDocuments: [], enrollmentStatus: 'active', tuitionStatus: 'current' },
  { id: 'STU-1006', name: 'Olivia Williams', grade: 8, attendanceRate: 88, attendanceRisk: 'medium', missingDocuments: ['Emergency Contact', 'Tdap Booster'], enrollmentStatus: 'active', tuitionStatus: 'past_due' },
  { id: 'STU-1007', name: 'Noah Brown', grade: 11, attendanceRate: 77, attendanceRisk: 'high', missingDocuments: [], enrollmentStatus: 'active', tuitionStatus: 'payment_plan' },
  { id: 'STU-1008', name: 'Avery Davis', grade: 7, attendanceRate: 94, attendanceRisk: 'low', missingDocuments: ['Tdap Booster'], enrollmentStatus: 'active', tuitionStatus: 'current' },
  { id: 'STU-1009', name: 'Jordan Wilson', grade: 7, attendanceRate: 86, attendanceRisk: 'medium', missingDocuments: ['Annual Physical'], enrollmentStatus: 'active', tuitionStatus: 'current' },
  { id: 'STU-1010', name: 'Riley Thompson', grade: 7, attendanceRate: 98, attendanceRisk: 'low', missingDocuments: [], enrollmentStatus: 'active', tuitionStatus: 'current' },
];

export const SYNTHETIC_INQUIRIES: InquiryRecord[] = [
  { id: 'INQ-301', family: 'Smith Family', student: 'Emma Smith', grade: 9, submittedDaysAgo: 4, lastFollowUpDaysAgo: null, stage: 'new' },
  { id: 'INQ-302', family: 'Rodriguez Family', student: 'Lucas Rodriguez', grade: 9, submittedDaysAgo: 3, lastFollowUpDaysAgo: null, stage: 'new' },
  { id: 'INQ-303', family: 'Patel Family', student: 'Anika Patel', grade: 7, submittedDaysAgo: 5, lastFollowUpDaysAgo: 4, stage: 'contacted' },
  { id: 'INQ-304', family: 'Nguyen Family', student: 'Theo Nguyen', grade: 6, submittedDaysAgo: 1, lastFollowUpDaysAgo: null, stage: 'new' },
  { id: 'INQ-305', family: 'Jackson Family', student: 'Amara Jackson', grade: 8, submittedDaysAgo: 7, lastFollowUpDaysAgo: 1, stage: 'tour_scheduled' },
];

export const DAILY_ATTENDANCE = {
  overallRate: 91.2,
  historicalRate: 94.5,
  grade11Rate: 81,
  grade11Absent: 23,
};

export const TUITION_SUMMARY = {
  collectionRate: 94,
  currentAccounts: 1166,
  pastDueAccounts: 48,
  paymentPlanAccounts: 26,
};