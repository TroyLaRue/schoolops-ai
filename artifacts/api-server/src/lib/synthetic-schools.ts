import { eq } from "drizzle-orm";
import { db, schoolsTable, type School } from "@workspace/db";

export interface StudentRecord {
  id: string;
  name: string;
  grade: number;
  attendanceRate: number;
  attendanceRisk: "high" | "medium" | "low";
  missingDocuments: string[];
  enrollmentStatus: "active" | "pending" | "withdrawn";
  tuitionStatus: "current" | "past_due" | "payment_plan";
}

export interface InquiryRecord {
  id: string;
  family: string;
  student: string;
  grade: number;
  submittedDaysAgo: number;
  lastFollowUpDaysAgo: number | null;
  stage: "new" | "contacted" | "tour_scheduled";
}

export interface SchoolOperations {
  students: StudentRecord[];
  inquiries: InquiryRecord[];
  attendance: {
    overallRate: number;
    historicalRate: number;
    grade11Rate: number;
    grade11Absent: number;
  };
  tuition: {
    collectionRate: number;
    currentAccounts: number;
    pastDueAccounts: number;
    paymentPlanAccounts: number;
  };
  source: {
    kind: "synthetic";
    label: string;
    generatedAt: string;
  };
}

export const DEMO_SCHOOL_SLUGS = ["oakridge-middle", "pinecrest-academy"] as const;
export type DemoSchoolSlug = (typeof DEMO_SCHOOL_SLUGS)[number];

const schoolAOperations: SchoolOperations = {
  students: [
    { id: "STU-1001", name: "Alexander Chen", grade: 9, attendanceRate: 97, attendanceRisk: "low", missingDocuments: [], enrollmentStatus: "active", tuitionStatus: "current" },
    { id: "STU-1002", name: "Maya Johnson", grade: 11, attendanceRate: 79, attendanceRisk: "high", missingDocuments: ["Tdap Booster"], enrollmentStatus: "active", tuitionStatus: "past_due" },
    { id: "STU-1003", name: "Elijah Smith", grade: 10, attendanceRate: 89, attendanceRisk: "medium", missingDocuments: [], enrollmentStatus: "active", tuitionStatus: "current" },
    { id: "STU-1004", name: "Sophia Martinez", grade: 9, attendanceRate: 96, attendanceRisk: "low", missingDocuments: ["Physical Form"], enrollmentStatus: "pending", tuitionStatus: "current" },
    { id: "STU-1005", name: "Liam Garcia", grade: 12, attendanceRate: 98, attendanceRisk: "low", missingDocuments: [], enrollmentStatus: "active", tuitionStatus: "current" },
    { id: "STU-1006", name: "Olivia Williams", grade: 8, attendanceRate: 88, attendanceRisk: "medium", missingDocuments: ["Emergency Contact", "Tdap Booster"], enrollmentStatus: "active", tuitionStatus: "past_due" },
    { id: "STU-1007", name: "Noah Brown", grade: 11, attendanceRate: 77, attendanceRisk: "high", missingDocuments: [], enrollmentStatus: "active", tuitionStatus: "payment_plan" },
    { id: "STU-1008", name: "Avery Davis", grade: 7, attendanceRate: 94, attendanceRisk: "low", missingDocuments: ["Tdap Booster"], enrollmentStatus: "active", tuitionStatus: "current" },
    { id: "STU-1009", name: "Jordan Wilson", grade: 7, attendanceRate: 86, attendanceRisk: "medium", missingDocuments: ["Annual Physical"], enrollmentStatus: "active", tuitionStatus: "current" },
    { id: "STU-1010", name: "Riley Thompson", grade: 7, attendanceRate: 98, attendanceRisk: "low", missingDocuments: [], enrollmentStatus: "active", tuitionStatus: "current" },
  ],
  inquiries: [
    { id: "INQ-301", family: "Smith Family", student: "Emma Smith", grade: 9, submittedDaysAgo: 4, lastFollowUpDaysAgo: null, stage: "new" },
    { id: "INQ-302", family: "Rodriguez Family", student: "Lucas Rodriguez", grade: 9, submittedDaysAgo: 3, lastFollowUpDaysAgo: null, stage: "new" },
    { id: "INQ-303", family: "Patel Family", student: "Anika Patel", grade: 7, submittedDaysAgo: 5, lastFollowUpDaysAgo: 4, stage: "contacted" },
    { id: "INQ-304", family: "Nguyen Family", student: "Theo Nguyen", grade: 6, submittedDaysAgo: 1, lastFollowUpDaysAgo: null, stage: "new" },
    { id: "INQ-305", family: "Jackson Family", student: "Amara Jackson", grade: 8, submittedDaysAgo: 7, lastFollowUpDaysAgo: 1, stage: "tour_scheduled" },
  ],
  attendance: { overallRate: 91.2, historicalRate: 94.5, grade11Rate: 81, grade11Absent: 23 },
  tuition: { collectionRate: 94, currentAccounts: 1166, pastDueAccounts: 48, paymentPlanAccounts: 26 },
  source: { kind: "synthetic", label: "Synthetic demo SIS", generatedAt: new Date(0).toISOString() },
};

const schoolBOperations: SchoolOperations = {
  students: [
    { id: "STU-2001", name: "Zoe Park", grade: 6, attendanceRate: 98, attendanceRisk: "low", missingDocuments: [], enrollmentStatus: "active", tuitionStatus: "current" },
    { id: "STU-2002", name: "Mateo Rivera", grade: 8, attendanceRate: 84, attendanceRisk: "medium", missingDocuments: ["Annual Physical"], enrollmentStatus: "active", tuitionStatus: "current" },
    { id: "STU-2003", name: "Harper Lee", grade: 10, attendanceRate: 72, attendanceRisk: "high", missingDocuments: ["Emergency Contact"], enrollmentStatus: "active", tuitionStatus: "payment_plan" },
    { id: "STU-2004", name: "Amir Hassan", grade: 5, attendanceRate: 96, attendanceRisk: "low", missingDocuments: [], enrollmentStatus: "pending", tuitionStatus: "current" },
    { id: "STU-2005", name: "Isabella Turner", grade: 8, attendanceRate: 91, attendanceRisk: "low", missingDocuments: ["Tdap Booster"], enrollmentStatus: "active", tuitionStatus: "past_due" },
  ],
  inquiries: [
    { id: "INQ-401", family: "Park Family", student: "Ethan Park", grade: 6, submittedDaysAgo: 2, lastFollowUpDaysAgo: 1, stage: "contacted" },
    { id: "INQ-402", family: "Hassan Family", student: "Lina Hassan", grade: 5, submittedDaysAgo: 1, lastFollowUpDaysAgo: null, stage: "new" },
    { id: "INQ-403", family: "Turner Family", student: "Caleb Turner", grade: 8, submittedDaysAgo: 6, lastFollowUpDaysAgo: null, stage: "new" },
  ],
  attendance: { overallRate: 94.8, historicalRate: 95.1, grade11Rate: 93, grade11Absent: 4 },
  tuition: { collectionRate: 97, currentAccounts: 782, pastDueAccounts: 17, paymentPlanAccounts: 9 },
  source: { kind: "synthetic", label: "Synthetic demo SIS", generatedAt: new Date(0).toISOString() },
};

const DEMO_SCHOOLS: Record<DemoSchoolSlug, { name: string; operations: SchoolOperations }> = {
  "oakridge-middle": { name: "Oakridge Middle", operations: schoolAOperations },
  "pinecrest-academy": { name: "Pinecrest Academy", operations: schoolBOperations },
};

export function isDemoSchoolSlug(value: string): value is DemoSchoolSlug {
  return (DEMO_SCHOOL_SLUGS as readonly string[]).includes(value);
}

export function getDemoSchool(slug: DemoSchoolSlug) {
  return DEMO_SCHOOLS[slug];
}

export async function ensureDemoSchools(): Promise<Map<DemoSchoolSlug, School>> {
  const result = new Map<DemoSchoolSlug, School>();
  for (const slug of DEMO_SCHOOL_SLUGS) {
    const demo = DEMO_SCHOOLS[slug];
    await db.insert(schoolsTable).values({
      slug,
      name: demo.name,
      operationsData: demo.operations as unknown as Record<string, unknown>,
      settings: {},
      syntheticOnly: true,
      isDemo: true,
      isClaimed: false,
    }).onConflictDoNothing({ target: schoolsTable.slug });

    let [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.slug, slug)).limit(1);
    if (school && Object.keys(school.operationsData).length === 0 && !school.isClaimed) {
      [school] = await db.update(schoolsTable)
        .set({ operationsData: demo.operations as unknown as Record<string, unknown> })
        .where(eq(schoolsTable.id, school.id))
        .returning();
    }
    if (school) result.set(slug, school);
  }
  return result;
}

export function syntheticOperationsForNewSchool(name: string): SchoolOperations {
  const operations = structuredClone(schoolBOperations);
  operations.source = { ...operations.source, label: `Synthetic demo data for ${name}` };
  return operations;
}