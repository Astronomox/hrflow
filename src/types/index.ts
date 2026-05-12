import {
  Role,
  EmploymentStatus,
  LeaveType,
  LeaveStatus,
  ConversationType,
} from "@prisma/client";

// ─── API Response Types ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── User & Auth ───────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  employeeId?: string;
}

// ─── Employee ──────────────────────────────────────────────────────────────

export interface EmployeeWithUser {
  id: string;
  userId: string;
  phone: string | null;
  position: string;
  status: EmploymentStatus;
  dateJoined: Date;
  profileImage: string | null;
  departmentId: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  department: {
    id: string;
    name: string;
  } | null;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  position: string;
  status: EmploymentStatus;
  dateJoined: string;
  departmentId?: string;
  profileImage?: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  status?: EmploymentStatus;
  departmentId?: string;
  profileImage?: string;
  role?: Role;
}

// ─── Department ────────────────────────────────────────────────────────────

export interface DepartmentWithHead {
  id: string;
  name: string;
  description: string | null;
  headId: string | null;
  head: {
    id: string;
    user: { name: string };
  } | null;
  _count: {
    employees: number;
  };
}

export interface CreateDepartmentInput {
  name: string;
  description?: string;
  headId?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string;
  headId?: string;
}

// ─── Attendance ────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  clockIn: Date;
  clockOut: Date | null;
  date: Date;
  employee?: {
    id: string;
    user: { name: string };
    department: { name: string } | null;
  };
}

export interface AttendanceStats {
  totalDaysThisMonth: number;
  averageHours: string;
  presentToday: boolean;
  todayRecord: AttendanceRecord | null;
}

// ─── Leave ─────────────────────────────────────────────────────────────────

export interface LeaveRequestWithEmployee {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: LeaveStatus;
  reviewerId: string | null;
  reviewNote: string | null;
  createdAt: Date;
  employee: {
    id: string;
    position: string;
    user: { name: string; email: string };
    department: { name: string } | null;
  };
  reviewer: { name: string } | null;
}

export interface CreateLeaveInput {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface ReviewLeaveInput {
  status: "APPROVED" | "REJECTED";
  reviewNote?: string;
}

// ─── Messaging ─────────────────────────────────────────────────────────────

export interface ConversationWithDetails {
  id: string;
  type: ConversationType;
  createdAt: Date;
  updatedAt: Date;
  participants: ParticipantDetail[];
  messages: MessageWithSender[];
  lastMessage?: MessageWithSender;
}

export interface ParticipantDetail {
  id: string;
  employeeId: string | null;
  departmentId: string | null;
  employee?: {
    id: string;
    user: { name: string; email: string };
    profileImage: string | null;
  } | null;
  department?: {
    id: string;
    name: string;
  } | null;
}

export interface MessageWithSender {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  sender: {
    id: string;
    user: { name: string };
    profileImage: string | null;
  };
  files: FileRecord[];
}

export interface CreateConversationInput {
  type: ConversationType;
  recipientEmployeeId?: string;
  recipientDepartmentId?: string;
  initialMessage: string;
}

export interface SendMessageInput {
  content: string;
  fileIds?: string[];
}

// ─── Files ─────────────────────────────────────────────────────────────────

export interface FileRecord {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploaderId: string;
  messageId: string | null;
  departmentId: string | null;
  createdAt: Date;
  uploader?: {
    id: string;
    user: { name: string };
  };
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  pendingLeaveRequests: number;
  totalDepartments: number;
  attendanceTrend: { date: string; count: number }[];
  leaveByType: { type: string; count: number }[];
  employeesByDepartment: { department: string; count: number }[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type:
    | "employee_created"
    | "leave_approved"
    | "leave_rejected"
    | "message_sent"
    | "file_uploaded"
    | "clock_in"
    | "clock_out";
  description: string;
  timestamp: Date;
  actorName: string;
}

// ─── UI State ──────────────────────────────────────────────────────────────

export interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

// ─── Filter/Query Params ───────────────────────────────────────────────────

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  status?: EmploymentStatus;
  page?: number;
  pageSize?: number;
}

export interface AttendanceFilters {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
}

export interface LeaveFilters {
  status?: LeaveStatus;
  leaveType?: LeaveType;
  page?: number;
}
