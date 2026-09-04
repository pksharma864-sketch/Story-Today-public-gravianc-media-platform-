export type PostType = 'news' | 'grievance';
export type Language = 'hi' | 'en';

export type GrievanceStatus = 'submitted' | 'under_review' | 'in_progress' | 'resolved';
export type GrievancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'reporter' | 'citizen' | 'moderator';

export interface LocationInfo {
  city: string;
  country?: string;
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
  authorAvatar?: string;
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
  authorAvatar?: string;
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

  // Imported Content Source Info (e.g. Blogger / story-today.in)
  bloggerId?: string;
  sourceUrl?: string;
}

export type IdCardStatus = 'not_applied' | 'pending' | 'approved' | 'rejected';
export type ReporterDesignation =
  | 'News Reporter'
  | 'Staff Reporter'
  | 'Blogger'
  | 'Correspondent'
  | 'Senior Correspondent'
  | 'Bureau Chief'
  | 'Citizen Journalist'
  | 'Photojournalist';

export interface ReporterIdCard {
  id: string;
  userId: string;
  fullName: string;
  designation: ReporterDesignation | string;
  address: string;
  mobileNumber: string;
  idProofType: 'aadhaar' | 'passport' | 'voter_id' | 'other';
  idProofNumber: string;
  photoUrl: string;
  status: IdCardStatus;
  appliedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  cardNumber?: string; // e.g., "ST-PRESS-2026-0842"
  validUntil?: string;
}

export type UserStatus = 'active' | 'pending' | 'rejected' | 'suspended';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  avatar?: string;
  password?: string;
  createdAt: string;
  status: UserStatus;
  email?: string;
  phone?: string;
  bio?: string;
  idCard?: ReporterIdCard;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface AppStats {
  totalPosts: number;
  totalNews: number;
  totalGrievances: number;
  resolvedGrievances: number;
  inProgressGrievances: number;
  pendingApproval?: number;
}

export interface AppCategoryItem {
  id: string;
  en: string;
  hi: string;
}

export const APP_TOP_CATEGORIES: AppCategoryItem[] = [
  { id: 'all', en: 'All Stories', hi: 'सभी खबरें (All Stories)' },
  { id: 'press_release', en: 'Press Release', hi: 'प्रेस विज्ञप्ति (Press Release)' },
  { id: 'press_release_health', en: 'Press Release (Health)', hi: 'प्रेस विज्ञप्ति - स्वास्थ्य (Press Release Health)' },
  { id: 'education_career', en: 'Education & Career', hi: 'शिक्षा एवं करियर (Education & Career)' },
  { id: 'geo_politics', en: 'Geo-Politics', hi: 'भू-राजनीति (Geo-Politics)' },
  { id: 'mental_health', en: 'Mental Health', hi: 'मानसिक स्वास्थ्य (Mental Health)' },
  { id: 'politics', en: 'Politics', hi: 'राजनीति (Politics)' },
  { id: 'social', en: 'Social', hi: 'सामाजिक (Social)' },
  { id: 'art_culture', en: 'Art & Culture', hi: 'कला एवं संस्कृति (Art & Culture)' },
  { id: 'product_review', en: 'Product Review', hi: 'उत्पाद समीक्षा (Product Review)' },
  { id: 'science_invention', en: 'Science & Invention', hi: 'विज्ञान एवं आविष्कार (Science & Invention)' },
  { id: 'technology', en: 'Technology', hi: 'तकनीकी (Technology)' },
  { id: 'sports', en: 'Sports', hi: 'खेलकूद (Sports)' },
  { id: 'agriculture', en: 'Agriculture', hi: 'कृषि एवं किसानी (Agriculture)' },
  { id: 'market_economics', en: 'Market & Economics', hi: 'बाजार एवं अर्थशास्त्र (Market & Economics)' },
];
