export type AttendanceStatus = 'P' | 'A' | '' | undefined;

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  attendance: Record<string, AttendanceStatus>; // Map Date -> Status
}

export interface Group {
  id: string;
  leaderName: string;
  coLeaderName?: string;
  monthRange: string;
  members: Member[];
}

export interface DashboardStats {
  totalMembers: number;
  avgAttendance: number;
  totalGroups: number;
  attendanceTrend: { date: string; presentCount: number; absentCount: number }[];
}
