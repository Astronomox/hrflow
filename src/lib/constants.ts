import {
  Role,
  EmploymentStatus,
  LeaveType,
  LeaveStatus,
  ConversationType,
} from "@prisma/client";

export const ROLES = {
  [Role.ADMIN]: "Admin",
  [Role.HR_MANAGER]: "HR Manager",
  [Role.EMPLOYEE]: "Employee",
} as const;

export const EMPLOYMENT_STATUSES = {
  [EmploymentStatus.ACTIVE]: "Active",
  [EmploymentStatus.INACTIVE]: "Inactive",
  [EmploymentStatus.ON_LEAVE]: "On Leave",
  [EmploymentStatus.TERMINATED]: "Terminated",
} as const;

export const EMPLOYMENT_STATUS_COLORS = {
  [EmploymentStatus.ACTIVE]: "bg-green-100 text-green-800",
  [EmploymentStatus.INACTIVE]: "bg-gray-100 text-gray-800",
  [EmploymentStatus.ON_LEAVE]: "bg-yellow-100 text-yellow-800",
  [EmploymentStatus.TERMINATED]: "bg-red-100 text-red-800",
} as const;

export const LEAVE_TYPES = {
  [LeaveType.ANNUAL]: "Annual Leave",
  [LeaveType.SICK]: "Sick Leave",
  [LeaveType.PERSONAL]: "Personal Leave",
  [LeaveType.MATERNITY]: "Maternity Leave",
  [LeaveType.PATERNITY]: "Paternity Leave",
  [LeaveType.UNPAID]: "Unpaid Leave",
} as const;

export const LEAVE_STATUS_COLORS = {
  [LeaveStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [LeaveStatus.APPROVED]: "bg-green-100 text-green-800",
  [LeaveStatus.REJECTED]: "bg-red-100 text-red-800",
} as const;

export const CONVERSATION_TYPE_LABELS = {
  [ConversationType.DIRECT]: "Direct Message",
  [ConversationType.EMPLOYEE_TO_DEPT]: "Employee → Department",
  [ConversationType.DEPT_TO_DEPT]: "Department → Department",
  [ConversationType.DEPT_TO_EMPLOYEE]: "Department → Employee",
} as const;

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const FILE_TYPE_ICONS: Record<string, string> = {
  "application/pdf": "📄",
  "image/png": "🖼️",
  "image/jpeg": "🖼️",
  "image/gif": "🖼️",
  "image/webp": "🖼️",
  "application/msword": "📝",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "📝",
  "application/vnd.ms-excel": "📊",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
  "text/csv": "📊",
  "text/plain": "📃",
};

export const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/",
    icon: "LayoutDashboard",
    roles: [Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE],
  },
  {
    title: "Employees",
    href: "/employees",
    icon: "Users",
    roles: [Role.ADMIN, Role.HR_MANAGER],
  },
  {
    title: "Departments",
    href: "/departments",
    icon: "Building2",
    roles: [Role.ADMIN, Role.HR_MANAGER],
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: "Clock",
    roles: [Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE],
  },
  {
    title: "Leave",
    href: "/leave",
    icon: "CalendarOff",
    roles: [Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE],
  },
  {
    title: "Leave Management",
    href: "/leave/manage",
    icon: "ClipboardList",
    roles: [Role.ADMIN, Role.HR_MANAGER],
  },
  {
    title: "Messages",
    href: "/messages",
    icon: "MessageSquare",
    roles: [Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE],
  },
  {
    title: "Files",
    href: "/files",
    icon: "FolderOpen",
    roles: [Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE],
  },
] as const;

export const PAGINATION_PAGE_SIZE = 10;
