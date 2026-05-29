export interface User {
  userId: number;
  email: string;
  passwordHash: string;
  role: UserRole;
  fullName: string;
  createdAt: Date;
  phoneNo: string;
  address: string;
  nationalId?: string;
  profileImage?: string;
  isActive: boolean;
  lastLogin?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

export enum UserRole {
  DIRECTOR = 'director',
  REGISTRAR = 'registrar',
  TEACHER = 'teacher',
  HOMEROOM_TEACHER = 'homeroom_teacher',
  GUARDIAN = 'guardian'
}

export interface GuardianRegistration {
  registrationId: number;
  fullName: string;
  email: string;
  phoneNo: string;
  passwordHash: string;
  nationalId: string;
  studentId?: number | null;
  studentName: string;
  relationshipType: 'parent' | 'legal_guardian';
  certificateDocumentPath: string;
  idFrontPath: string;
  idBackPath: string;
  status: 'pending' | 'approved' | 'rejected' | 'correction_required' | 'locked';
  rejectionReason?: string;
  correctionAttempts: number;
  reviewedBy?: number;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface Student {
  studentId: number;
  guardianId?: number | null;
  classId: number;
  fullName: string;
  dob: Date;
  emergencyContact: string;
  createdAt: Date;
}

export interface Classroom {
  classId: number;
  teacherId: number;
  classLevel: string;
  homeroomTeacherId: number;
  academicYear: string;
  subject?: string;
  createdAt: Date;
}

export interface Homework {
  homeworkId: number;
  title: string;
  description: string;
  subject: string;
  className: string;
  teacherId: number;
  dueDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  messageId: number;
  senderId: number;
  receiverId: number;
  content: string;
  sentAt: Date;
  isRead: boolean;
  readAt?: Date;
  messageType: 'homework' | 'general' | 'report_card' | 'pickup';
}

export interface Notification {
  notificationId: number;
  title: string;
  content: string;
  priority: 'normal' | 'emergency';
  senderId: number;
  recipientGroup: 'all_guardians' | 'all_teachers' | 'specific_class' | 'specific_users' | 'all';
  status?: 'pending' | 'sent' | 'failed';
  createdAt: Date;
  scheduledFor?: Date;
  sentAt?: Date;
  deliveryStatus: 'pending' | 'sent' | 'failed';
}

export interface Event {
  eventId: number;
  title: string;
  description: string;
  eventDate: Date;
  eventType: 'exam' | 'meeting' | 'holiday' | 'activity' | 'other';
  location?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  targetAudience: 'all' | 'guardians_only' | 'teachers_only' | 'specific_class';
}

export interface HomeworkTracking {
  trackingId: number;
  homeworkId: number;
  guardianId: number;
  viewedAt?: Date;
  feedback?: string;
  feedbackGivenAt?: Date;
  status: 'assigned' | 'viewed' | 'completed';
}

export interface ReportCard {
  reportcardId: number;
  studentId: number;
  term: string;
  academicYear: string;
  filledBy: number;
  filledAt: Date;
  status: 'pending' | 'approved' | 'unlocked';
  approvedBy?: number;
  approvedAt?: Date;
  editTimestamp?: Date;
  subjectsGrades: Record<string, string>;
  teacherComments?: string;
  principalComments?: string;
  attendanceRecord?: Record<string, any>;
  conductGrade?: string;
  overallGrade?: string;
}

export interface PickupRequest {
  requestId: number;
  studentId: number;
  guardianId: number;
  authorizedPersonName: string;
  authorizedPersonRelationship: string;
  authorizedPersonPhone: string;
  authorizedPersonNationalId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: Date;
  pickupDate: Date;
  pickupTimeStart?: string;
  pickupTimeEnd?: string;
  createdAt: Date;
  processedBy?: number;
  processedAt?: Date;
  notes?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  timestamp: string;
}

export interface AuthUser {
  userId: number;
  email: string;
  role: UserRole;
  fullName: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
}
