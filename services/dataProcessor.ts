import { Group, Member, AttendanceStatus, DashboardStats } from '../types';
import { CSV_DATA } from '../constants';

// Helper to manually parse CSV line respecting quotes
const parseCSVLine = (text: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

export const parseData = (): Group[] => {
  const lines = CSV_DATA.trim().split('\n');
  const header = parseCSVLine(lines[0]);
  
  // Find date columns (format YYYY-MM-DD)
  const dateIndices: number[] = [];
  const dateKeys: string[] = [];
  
  header.forEach((col, index) => {
    if (/\d{4}-\d{2}-\d{2}/.test(col)) {
      dateIndices.push(index);
      dateKeys.push(col);
    }
  });

  const groupMap = new Map<string, Group>();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < 5) continue; // Skip empty rows

    const groupId = row[1];
    const leaderName = row[2];
    const coLeaderName = row[3];
    const monthRange = row[4];
    const memberName = row[5]?.replace(/^"|"$/g, '').trim(); // Remove manual extra quotes if any
    const phone = row[6]?.replace(/^"|"$/g, '').trim();

    if (!groupId || !memberName) continue;

    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, {
        id: groupId,
        leaderName,
        coLeaderName,
        monthRange,
        members: []
      });
    }

    const attendance: Record<string, AttendanceStatus> = {};
    dateIndices.forEach((colIndex, idx) => {
      const dateKey = dateKeys[idx];
      const statusRaw = row[colIndex]?.trim().toUpperCase();
      let status: AttendanceStatus = '';
      if (statusRaw === 'P') status = 'P';
      if (statusRaw === 'A') status = 'A';
      attendance[dateKey] = status;
    });

    const member: Member = {
      id: `${groupId}-${memberName}-${i}`, // Unique ID
      name: memberName,
      phone,
      attendance
    };

    groupMap.get(groupId)?.members.push(member);
  }

  return Array.from(groupMap.values());
};

export const calculateStats = (groups: Group[]): DashboardStats => {
  let totalMembers = 0;
  let totalPresent = 0;
  let totalOpportunities = 0;
  const dateStatsMap = new Map<string, { present: number; absent: number }>();

  groups.forEach(group => {
    group.members.forEach(member => {
      totalMembers++;
      Object.entries(member.attendance).forEach(([date, status]) => {
        if (!dateStatsMap.has(date)) {
          dateStatsMap.set(date, { present: 0, absent: 0 });
        }
        
        const stats = dateStatsMap.get(date)!;
        if (status === 'P') {
          totalPresent++;
          totalOpportunities++;
          stats.present++;
        } else if (status === 'A') {
          totalOpportunities++;
          stats.absent++;
        }
        // Empty status doesn't count towards opportunities yet in this simple logic
      });
    });
  });

  const attendanceTrend = Array.from(dateStatsMap.entries())
    .map(([date, stats]) => ({
      date,
      presentCount: stats.present,
      absentCount: stats.absent
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalGroups: groups.length,
    totalMembers,
    avgAttendance: totalOpportunities > 0 ? (totalPresent / totalOpportunities) * 100 : 0,
    attendanceTrend
  };
};

export const getAllDates = (groups: Group[]): string[] => {
    if (groups.length === 0) return [];
    // Assuming all members have same date keys structure derived from CSV header
    return Object.keys(groups[0].members[0]?.attendance || {}).sort();
}

export const exportToCSV = (groups: Group[]): string => {
  if (groups.length === 0) return '';

  const dates = getAllDates(groups);
  
  // Headers
  const headers = [
    'Group_Id',
    'Leader',
    'Co_Leader',
    'Month_Range',
    'Member Name',
    'PHONE NUMBER',
    ...dates
  ];

  const rows = [headers.join(',')];

  groups.forEach(group => {
    group.members.forEach(member => {
      const row = [
        group.id,
        `"${group.leaderName}"`,
        `"${group.coLeaderName || ''}"`,
        `"${group.monthRange}"`,
        `"${member.name}"`,
        `"${member.phone || ''}"`,
        ...dates.map(date => member.attendance[date] || '')
      ];
      rows.push(row.join(','));
    });
  });

  return rows.join('\n');
};