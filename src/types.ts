export type UserRole = 'employee' | 'manager' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  title?: string;
  teamId?: string;
  photoURL?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived';
}

export type SubmissionStatus = 'draft' | 'submitted' | 'needs_revision' | 'approved';

export interface Allocation {
  projectId: string;
  projectName: string;
  role: string;
  targetPercent: number;
  plannedPercent: number;
}

export interface EffortSubmission {
  id: string;
  userId: string;
  userName?: string;
  userRole?: UserRole;
  month: string; // YYYY-MM
  status: SubmissionStatus;
  allocations: Allocation[];
  totalHours: number;
  managerId?: string;
  updatedAt: any; // ISO String in session mode
  createdAt: any;
  messages?: Message[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: any;
}
