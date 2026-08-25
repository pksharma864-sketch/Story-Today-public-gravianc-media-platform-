export type PostType = 'news' | 'grievance';
export type Language = 'hi' | 'en';

export type GrievanceStatus = 'submitted' | 'under_review' | 'in_progress' | 'resolved';
export type GrievancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'reporter' | 'citizen' | 'moderator';

export interface LocationInfo {
  city: string;
  area?: string;
  ward?: string;
  landmark?: string;
}

export interface StatusHistoryItem {
  status: GrievanceStatus;
  note: string;
  timestamp: string;
  updatedBy: string;
}

export interface OfficialResponse {
  department: string;
  message: string;
  timestamp: string;
  officerName?: string;
}

export interface PostComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  isOfficial?: boolean;
}

export interface PostItem {
  id: string;
  type: PostType;
  title: string;
  titleHi?: string;
  content: string;
  contentHi?: string;
  summary?: string;
  category: string;
  location: LocationInfo;
  authorName: string;
  authorPhone?: string;
  authorRole?: string; // e.g. "Citizen", "Local Reporter", "Ward Resident"
  authorId?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  views: number;
  upvotes: number;
  isBreaking?: boolean;
  isPinned?: boolean;
  
  // Editorial Approval System
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;

  // Grievance specific
  status?: GrievanceStatus;
  priority?: GrievancePriority;
  referenceNumber?: string; // e.g., ST-GR-2401
  statusHistory?: StatusHistoryItem[];
  officialResponse?: OfficialResponse;
  comments?: PostComment[];
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  password?: string;
  createdAt: string;
  status: 'active' | 'suspended';
  email?: string;
}

export interface AppStats {
  totalPosts: number;
  totalNews: number;
  totalGrievances: number;
  resolvedGrievances: number;
  inProgressGrievances: number;
  pendingApproval?: number;
}
