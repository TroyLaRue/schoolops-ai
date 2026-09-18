import {
  DAILY_ATTENDANCE,
  SYNTHETIC_INQUIRIES,
  SYNTHETIC_STUDENTS,
  TUITION_SUMMARY,
  type InquiryRecord,
  type StudentRecord,
} from '@/data/school-data';

export const SMARTCARE_DEMO_CONNECTOR = {
  id: 'smartcare-demo',
  name: 'Smartcare Demo Connector',
  status: 'demo' as const,
  dataPolicy: 'Synthetic data only',
  liveAccess: false,
};

export const SMARTCARE_DEMO_FEED = {
  students: SYNTHETIC_STUDENTS.map((student) => ({
    sourceRecordId: student.id,
    name: student.name,
    grade: student.grade,
  })),
  enrollments: SYNTHETIC_STUDENTS.map((student) => ({
    sourceRecordId: student.id,
    enrollmentStatus: student.enrollmentStatus,
    tuitionStatus: student.tuitionStatus,
  })),
  attendance: SYNTHETIC_STUDENTS.map((student) => ({
    sourceRecordId: student.id,
    attendanceRate: student.attendanceRate,
    attendanceRisk: student.attendanceRisk,
  })),
  documents: SYNTHETIC_STUDENTS.flatMap((student) =>
    student.missingDocuments.map((document) => ({
      sourceRecordId: student.id,
      document,
      status: 'missing' as const,
    })),
  ),
};

export interface NormalizedStudentRecord extends StudentRecord {
  sourceSystem: typeof SMARTCARE_DEMO_CONNECTOR.id;
  sourceRecordId: string;
}

export interface NormalizedSchoolOpsData {
  students: NormalizedStudentRecord[];
  inquiries: InquiryRecord[];
  attendance: typeof DAILY_ATTENDANCE;
  tuition: typeof TUITION_SUMMARY;
  provenance: {
    connectorId: string;
    connectorLabel: string;
    policy: string;
    normalizedAt: string;
  };
}

function normalizeSmartcareFeed(): NormalizedSchoolOpsData {
  const students = SMARTCARE_DEMO_FEED.students.map((student) => {
    const enrollment = SMARTCARE_DEMO_FEED.enrollments.find((item) => item.sourceRecordId === student.sourceRecordId);
    const attendance = SMARTCARE_DEMO_FEED.attendance.find((item) => item.sourceRecordId === student.sourceRecordId);
    const documents = SMARTCARE_DEMO_FEED.documents
      .filter((item) => item.sourceRecordId === student.sourceRecordId)
      .map((item) => item.document);

    return {
      id: student.sourceRecordId,
      sourceRecordId: student.sourceRecordId,
      sourceSystem: SMARTCARE_DEMO_CONNECTOR.id,
      name: student.name,
      grade: student.grade,
      attendanceRate: attendance?.attendanceRate ?? 0,
      attendanceRisk: attendance?.attendanceRisk ?? 'low',
      missingDocuments: documents,
      enrollmentStatus: enrollment?.enrollmentStatus ?? 'active',
      tuitionStatus: enrollment?.tuitionStatus ?? 'current',
    };
  });

  return {
    students,
    inquiries: SYNTHETIC_INQUIRIES,
    attendance: DAILY_ATTENDANCE,
    tuition: TUITION_SUMMARY,
    provenance: {
      connectorId: SMARTCARE_DEMO_CONNECTOR.id,
      connectorLabel: SMARTCARE_DEMO_CONNECTOR.name,
      policy: SMARTCARE_DEMO_CONNECTOR.dataPolicy,
      normalizedAt: '2026-09-18T00:00:00.000Z',
    },
  };
}

export const NORMALIZED_SCHOOL_DATA = normalizeSmartcareFeed();
export const SCHOOL_OPS_DATA_SOURCE = {
  label: 'Smartcare Demo Connector',
  detail: 'Synthetic records normalized into SchoolOps',
};