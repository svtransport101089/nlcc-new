import React, { useMemo, useState, useEffect } from 'react';
import { Group } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend, AreaChart, Area, ScatterChart, Scatter, ZAxis, ReferenceLine
} from 'recharts';
import { 
  Trophy, AlertTriangle, TrendingUp, Printer, Users, Target, 
  UserCheck, Check, X, Minus, Calendar, BarChart2, FileDown, RotateCcw, 
  ArrowUpRight, Activity, Percent, PieChart as PieChartIcon, Download, CalendarDays,
  FileText, Filter, LayoutGrid
} from 'lucide-react';
import clsx from 'clsx';
import { getAllDates, exportToCSV } from '../services/dataProcessor';

interface ReportsProps {
  groups: Group[];
  onResetData: () => void;
}

const KPICard = ({ title, value, subtext, icon: Icon, trend }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between relative overflow-hidden group">
    <div className="relative z-10">
      <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>}
    </div>
    <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-brand-50 transition-colors">
      <Icon className="h-6 w-6 text-slate-400 group-hover:text-brand-600 transition-colors" />
    </div>
    {trend === 'up' && <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500" />}
    {trend === 'down' && <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500" />}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg text-xs">
        <p className="font-bold text-slate-900 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500 capitalize">{entry.name}:</span>
            <span className="font-bold text-slate-700">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Reports: React.FC<ReportsProps> = ({ groups, onResetData }) => {
  const dates = useMemo(() => getAllDates(groups), [groups]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Date Range Filter State
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });

  // Initialize Date Range
  useEffect(() => {
      if (dates.length > 0 && (!dateRange.start || !dateRange.end)) {
          setDateRange({ start: dates[0], end: dates[dates.length - 1] });
      }
  }, [dates]);

  // Derived Filtered Dates
  const filteredDates = useMemo(() => {
      if (!dateRange.start || !dateRange.end) return [];
      return dates.filter(d => d >= dateRange.start && d <= dateRange.end);
  }, [dates, dateRange]);

  // Sync selectedDate with filtered range
  useEffect(() => {
    if (filteredDates.length > 0) {
        if (!selectedDate || !filteredDates.includes(selectedDate)) {
             setSelectedDate(filteredDates[filteredDates.length - 1]);
        }
    } else {
        setSelectedDate('');
    }
  }, [filteredDates, selectedDate]);

  // Analysis Logic
  const reportData = useMemo(() => {
    // If no dates match filter, return safe defaults
    if (filteredDates.length === 0) {
        return {
            groupMetrics: [],
            memberLeaderboard: [],
            atRiskMembers: [],
            totalMembers: groups.reduce((acc, g) => acc + g.members.length, 0),
            overallRate: 0,
            bestGroup: null,
            sessionStats: { present: 0, absent: 0, unrecorded: 0 },
            groupSessionStats: [],
            trendData: [],
            sessionHistory: []
        };
    }

    const lastDate = filteredDates[filteredDates.length - 1];
    const secondLastDate = filteredDates.length > 1 ? filteredDates[filteredDates.length - 2] : null;
    const targetDate = selectedDate || lastDate;

    // 1. Group Metrics (Overall - WITHIN RANGE)
    const groupMetrics = groups.map(g => {
      let present = 0;
      let total = 0;
      g.members.forEach(m => {
        filteredDates.forEach(date => {
            const status = m.attendance[date];
            if (status === 'P') present++;
            if (status === 'P' || status === 'A') total++;
        });
      });
      const avg = total > 0 ? (present / total) * 100 : 0;
      return {
        name: g.leaderName,
        attendance: Math.round(avg),
        memberCount: g.members.length,
        rawPresent: present,
        rawTotal: total
      };
    }).sort((a, b) => b.attendance - a.attendance);

    // 2. Member Leaderboard (WITHIN RANGE)
    const memberLeaderboard = groups.flatMap(g => 
      g.members.map(m => {
        let present = 0;
        let total = 0;
        filteredDates.forEach(date => {
            const status = m.attendance[date];
            if (status === 'P') present++;
            if (status === 'P' || status === 'A') total++;
        });

        const rate = total > 0 ? (present / total) * 100 : 0;
        return {
          name: m.name,
          group: g.leaderName,
          rate: Math.round(rate),
          totalSessions: total,
          presentSessions: present
        };
      })
    ).filter(m => m.totalSessions >= 1) // Show anyone with activity in this range
     .sort((a, b) => b.rate - a.rate || b.totalSessions - a.totalSessions)
     .slice(0, 5);

    // 3. At Risk Members (Based on END of Range)
    // Only calculated if we have at least 2 dates in the filter or history
    const atRiskMembers = secondLastDate ? groups.flatMap(g => 
      g.members.filter(m => {
        const lastStatus = m.attendance[lastDate];
        const prevStatus = m.attendance[secondLastDate];
        return lastStatus === 'A' && prevStatus === 'A';
      }).map(m => ({
        name: m.name,
        group: g.leaderName,
        phone: m.phone,
        missedStreak: 2
      }))
    ).slice(0, 5) : [];

    // 4. Global Stats (WITHIN RANGE)
    const totalMembers = groups.reduce((acc, g) => acc + g.members.length, 0);
    const overallRate = Math.round(groupMetrics.reduce((acc, m) => acc + m.attendance, 0) / (groupMetrics.length || 1));
    const bestGroup = groupMetrics[0];

    // 5. Selected Session Breakdown
    const sessionStats = { present: 0, absent: 0, unrecorded: 0 };
    const groupSessionStats = groups.map(g => {
        let present = 0;
        let absent = 0;
        let unrecorded = 0;
        g.members.forEach(m => {
             const status = m.attendance[targetDate];
             if (status === 'P') present++;
             else if (status === 'A') absent++;
             else unrecorded++;
        });
        
        sessionStats.present += present;
        sessionStats.absent += absent;
        sessionStats.unrecorded += unrecorded;

        return {
            id: g.id,
            name: g.leaderName,
            present,
            absent,
            unrecorded
        };
    }).sort((a, b) => b.present - a.present);

    // 6. Trends Data (WITHIN RANGE)
    const trendData = filteredDates.map(d => {
        let p = 0;
        let t = 0;
        groups.forEach(g => {
            g.members.forEach(m => {
                if (m.attendance[d] === 'P') p++;
                if (m.attendance[d] === 'P' || m.attendance[d] === 'A') t++;
            });
        });
        return {
            date: d,
            formattedDate: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            rate: t > 0 ? Math.round((p / t) * 100) : 0,
            present: p
        };
    });

    // 7. Session History Report (WITHIN RANGE)
    // Show all sessions in range, reverse chronological
    const sessionHistory = filteredDates.slice().reverse().map(date => {
        let present = 0;
        let absent = 0;
        let total = 0;
        let bestGroup = { name: '-', count: -1 };

        groups.forEach(g => {
            let gPresent = 0;
            g.members.forEach(m => {
                const s = m.attendance[date];
                if (s === 'P') { present++; gPresent++; }
                if (s === 'A') absent++;
                if (s === 'P' || s === 'A') total++;
            });
            if (gPresent > bestGroup.count) {
                bestGroup = { name: g.leaderName, count: gPresent };
            }
        });

        return {
            date,
            present,
            absent,
            rate: total > 0 ? Math.round((present / total) * 100) : 0,
            topGroup: bestGroup.name
        };
    });

    return { 
        groupMetrics, 
        memberLeaderboard, 
        atRiskMembers, 
        totalMembers, 
        overallRate, 
        bestGroup,
        sessionStats,
        groupSessionStats,
        trendData,
        sessionHistory
    };
  }, [groups, filteredDates, selectedDate]);

  const handleExport = () => {
    const csvContent = exportToCSV(groups);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `executive_report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSessionReport = (dateStr: string) => {
    if (!dateStr) return;
    
    const headers = ['Group', 'Member Name', 'Phone', 'Status', 'Date'];
    const rows = [headers.join(',')];
    
    groups.forEach(g => {
        g.members.forEach(m => {
            const status = m.attendance[dateStr];
            const statusLabel = status === 'P' ? 'Present' : status === 'A' ? 'Absent' : 'Unrecorded';
            rows.push([
                `"${g.leaderName}"`,
                `"${m.name}"`,
                `"${m.phone || ''}"`,
                `"${statusLabel}"`,
                `"${dateStr}"`
            ].join(','));
        });
    });
    
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `session_report_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSession = () => {
      downloadSessionReport(selectedDate);
  };

  // Professional Palette
  const CHART_COLORS = ['#0f766e', '#0d9488', '#14b8a6', '#5eead4', '#99f6e4', '#ccfbf1'];
  const PIE_COLORS = ['#10b981', '#ef4444', '#cbd5e1']; // Present, Absent, Pending

  const pieData = [
    { name: 'Present', value: reportData.sessionStats.present },
    { name: 'Absent', value: reportData.sessionStats.absent },
    { name: 'Pending', value: reportData.sessionStats.unrecorded },
  ];
  
  const avgGroupSize = Math.round(reportData.totalMembers / Math.max(1, groups.length));

  return (
    <div className="space-y-8 animate-fade-in pb-12 font-sans">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 print:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Report</h2>
            <p className="text-slate-500 mt-1">Performance analytics and attendance insights.</p>
            </div>
            <div className="flex flex-wrap gap-3 print:hidden">
            <button 
                onClick={onResetData}
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-red-600 hover:border-red-100 transition-all"
            >
                <RotateCcw className="h-4 w-4" />
                Reset
            </button>
            <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
                <Printer className="h-4 w-4" />
                Print
            </button>
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white border border-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
            >
                <FileDown className="h-4 w-4" />
                Export All CSV
            </button>
            </div>
        </div>

        {/* Date Filter Bar */}
        <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 border border-slate-200 shadow-inner">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
                <Filter className="h-4 w-4" />
                <span>Report Period:</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none w-full"
                    />
                </div>
                <span className="text-slate-400 font-medium">to</span>
                <div className="relative flex-1 sm:flex-none">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none w-full"
                    />
                </div>
            </div>
            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-2" />
            <div className="text-xs text-slate-500 font-medium ml-auto">
                Showing data for <span className="text-slate-900 font-bold">{filteredDates.length}</span> sessions
            </div>
        </div>
      </div>

      {/* 2. KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
            title="Overall Efficiency" 
            value={`${reportData.overallRate}%`} 
            subtext="Avg. Attendance Rate (Selected Period)"
            icon={Activity}
            trend={reportData.overallRate > 75 ? 'up' : 'down'}
        />
        <KPICard 
            title="Active Members" 
            value={reportData.totalMembers} 
            subtext="Total Registered Youth"
            icon={Users}
        />
        <KPICard 
            title="Top Performing Group" 
            value={reportData.bestGroup?.attendance + '%'}
            subtext={reportData.bestGroup?.name || 'N/A'}
            icon={Trophy}
            trend="up"
        />
        <KPICard 
            title="Retention Risk" 
            value={reportData.atRiskMembers.length} 
            subtext="Members absent last 2 sessions"
            icon={AlertTriangle}
            trend={reportData.atRiskMembers.length > 0 ? 'down' : 'up'}
        />
      </div>

      {/* 3. Trends Chart (New) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="text-lg font-bold text-slate-900">Attendance Trends</h3>
                <p className="text-xs text-slate-500">Participation rate over selected period</p>
            </div>
            <TrendingUp className="h-5 w-5 text-slate-400" />
        </div>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0f766e" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="formattedDate" 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                    />
                    <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        unit="%"
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
                    <Area 
                        type="monotone" 
                        dataKey="rate" 
                        name="Attendance Rate"
                        stroke="#0f766e" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorRate)" 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 4. Engagement Matrix (Upgrade from simple Bar Chart) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Engagement Matrix</h3>
                    <p className="text-xs text-slate-500">Efficiency (Rate) vs. Scale (Size) Analysis</p>
                </div>
                <LayoutGrid className="h-5 w-5 text-slate-400" />
             </div>
             <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" dataKey="memberCount" name="Group Size" unit=" mbrs" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis type="number" dataKey="attendance" name="Attendance Rate" unit="%" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }} 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs z-50 min-w-[150px]">
                                            <p className="font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">{data.name}</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-slate-500">Efficiency:</span>
                                                    <span className="font-bold text-brand-600">{data.attendance}%</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-slate-500">Size:</span>
                                                    <span className="font-bold text-slate-700">{data.memberCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <ReferenceLine x={avgGroupSize} stroke="#cbd5e1" strokeDasharray="3 3" label={{ value: 'Avg Size', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }} />
                        <ReferenceLine y={reportData.overallRate} stroke="#cbd5e1" strokeDasharray="3 3" label={{ value: 'Avg Rate', position: 'insideRight', fontSize: 10, fill: '#94a3b8' }} />
                        <Scatter name="Groups" data={reportData.groupMetrics} fill="#0f766e" shape="circle">
                             {reportData.groupMetrics.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                             ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* 5. Session Stats (Interactive) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="mb-4">
                   <h3 className="text-lg font-bold text-slate-900">Session Breakdown</h3>
                   <p className="text-xs text-slate-500 mb-3">Select date from range to view specific report</p>
                   
                   {/* Date Selector */}
                   <div className="relative">
                        <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <select 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                            {filteredDates.slice().reverse().map(d => (
                                <option key={d} value={d}>
                                    {new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </option>
                            ))}
                        </select>
                   </div>
              </div>

              {/* Session Pie Chart */}
              <div className="h-40 w-full mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
              </div>
              
              <div className="flex-1 flex flex-col justify-center space-y-3">
                 <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                     <div className="flex items-center gap-3">
                         <div className="p-1.5 bg-green-200 rounded-full text-green-700"><Check className="h-4 w-4" /></div>
                         <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Present</p>
                     </div>
                     <p className="text-xl font-bold text-slate-900">{reportData.sessionStats.present}</p>
                 </div>

                 <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                     <div className="flex items-center gap-3">
                         <div className="p-1.5 bg-red-200 rounded-full text-red-700"><X className="h-4 w-4" /></div>
                         <p className="text-xs font-bold text-red-800 uppercase tracking-wide">Absent</p>
                     </div>
                     <p className="text-xl font-bold text-slate-900">{reportData.sessionStats.absent}</p>
                 </div>

                 {reportData.sessionStats.unrecorded > 0 && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-slate-200 rounded-full text-slate-600"><Minus className="h-4 w-4" /></div>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Pending</p>
                        </div>
                         <p className="text-xl font-bold text-slate-900">{reportData.sessionStats.unrecorded}</p>
                    </div>
                 )}
              </div>
          </div>
      </div>

      {/* 6. Member Insights (Split View) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Top Performers
                  </h3>
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Most Consistent</span>
              </div>
              <div className="divide-y divide-slate-100">
                  {reportData.memberLeaderboard.map((m, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                              <span className={clsx(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                  i === 0 ? "bg-yellow-100 text-yellow-700" : 
                                  i === 1 ? "bg-slate-200 text-slate-600" :
                                  "bg-slate-100 text-slate-400"
                              )}>{i + 1}</span>
                              <div>
                                  <p className="text-sm font-bold text-slate-900">{m.name}</p>
                                  <p className="text-xs text-slate-500">{m.group}</p>
                              </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                              <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                  {m.rate}%
                              </span>
                              <span className="text-[10px] text-slate-400 mt-1 font-medium">
                                {m.presentSessions}/{m.totalSessions} attended
                              </span>
                          </div>
                      </div>
                  ))}
                  {reportData.memberLeaderboard.length === 0 && <p className="p-6 text-center text-sm text-slate-400">No data available.</p>}
              </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-red-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-red-900 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Attention Needed
                  </h3>
                  <span className="text-[10px] font-bold uppercase text-red-400 tracking-wider">Missed Last 2+</span>
              </div>
              <div className="divide-y divide-slate-100">
                  {reportData.atRiskMembers.map((m, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div>
                              <p className="text-sm font-bold text-slate-900">{m.name}</p>
                              <p className="text-xs text-slate-500">{m.group}</p>
                          </div>
                          <div className="text-right">
                              {m.phone ? (
                                  <a href={`tel:${m.phone}`} className="text-xs font-medium text-brand-600 hover:underline">
                                      {m.phone}
                                  </a>
                              ) : (
                                  <span className="text-xs text-slate-400 italic">No phone</span>
                              )}
                          </div>
                      </div>
                  ))}
                  {reportData.atRiskMembers.length === 0 && (
                      <div className="p-8 text-center">
                          <Check className="h-8 w-8 text-green-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-slate-600">All clear!</p>
                          <p className="text-xs text-slate-400">No members currently flagged at risk.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>

       {/* 7. New Section: Recent Session History (Last 10) */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-teal-50/50 flex items-center gap-3">
              <div className="bg-teal-100 p-2 rounded-lg text-teal-700">
                  <FileText className="h-5 w-5" />
              </div>
              <div>
                  <h3 className="text-lg font-bold text-slate-900">Session Reports</h3>
                  <p className="text-xs text-slate-500">Breakdown of sessions within selected period</p>
              </div>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10">
                      <tr>
                          <th className="px-6 py-4 bg-slate-50">Date</th>
                          <th className="px-6 py-4 text-center bg-slate-50">Status</th>
                          <th className="px-6 py-4 text-center bg-slate-50">Attendance</th>
                          <th className="px-6 py-4 text-center bg-slate-50">Rate</th>
                          <th className="px-6 py-4 bg-slate-50">Leading Group</th>
                          <th className="px-6 py-4 text-right bg-slate-50">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {reportData.sessionHistory.map((session, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                                  {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-6 py-4 text-center">
                                  <span className={clsx(
                                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                      session.rate >= 80 ? "bg-green-100 text-green-800" : 
                                      session.rate >= 60 ? "bg-blue-100 text-blue-800" : 
                                      "bg-orange-100 text-orange-800"
                                  )}>
                                      {session.rate >= 80 ? 'High' : session.rate >= 60 ? 'Avg' : 'Low'}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-center text-slate-600">
                                  <span className="font-bold text-slate-900">{session.present}</span>
                                  <span className="text-xs text-slate-400 mx-1">/</span>
                                  <span className="text-xs">{session.present + session.absent}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                  <span className={clsx("font-bold", session.rate >= 80 ? "text-green-600" : "text-slate-600")}>
                                      {session.rate}%
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600 text-xs">
                                  {session.topGroup}
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button 
                                      onClick={() => downloadSessionReport(session.date)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 shadow-sm rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                                  >
                                      <Download className="h-3.5 w-3.5" />
                                      Download
                                  </button>
                              </td>
                          </tr>
                      ))}
                      {reportData.sessionHistory.length === 0 && (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400">No session history available for this period.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
       </div>

      {/* 8. Detailed Session Report Table (Specific Date Breakdown) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-indigo-50/50 flex justify-between items-center">
               <div className="flex items-center gap-3">
                   <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
                        <PieChartIcon className="h-5 w-5" />
                   </div>
                   <div>
                        <h3 className="text-lg font-bold text-slate-900">Session Breakdown Detail</h3>
                        <p className="text-xs text-slate-500">
                            {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Select a date from list'}
                        </p>
                   </div>
               </div>
               <button 
                  onClick={handleExportSession}
                  disabled={!selectedDate}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
               >
                   <Download className="h-3.5 w-3.5" />
                   Export Report
               </button>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                          <th className="px-6 py-4">Group</th>
                          <th className="px-6 py-4 text-center">Present</th>
                          <th className="px-6 py-4 text-center">Absent</th>
                          <th className="px-6 py-4 text-center">Unrecorded</th>
                          <th className="px-6 py-4 text-right">Completion</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {reportData.groupSessionStats.map((g) => {
                         const total = g.present + g.absent + g.unrecorded;
                         const completion = total > 0 ? ((g.present + g.absent) / total) * 100 : 0;
                         return (
                            <tr key={g.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-900">{g.name}</td>
                                <td className="px-6 py-4 text-center text-green-600 font-bold bg-green-50/30">{g.present}</td>
                                <td className="px-6 py-4 text-center text-red-600 font-bold bg-red-50/30">{g.absent}</td>
                                <td className="px-6 py-4 text-center text-slate-400">{g.unrecorded}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className={clsx("px-2 py-1 rounded-full text-xs font-bold", completion === 100 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                                        {Math.round(completion)}%
                                    </span>
                                </td>
                            </tr>
                         );
                    })}
                  </tbody>
              </table>
          </div>
      </div>

      {/* 9. Overall Performance Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Overall Performance Matrix</h3>
              <p className="text-xs text-slate-500">Historical average by group (Selected Period)</p>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                          <th className="px-6 py-4">Group Leader</th>
                          <th className="px-6 py-4 text-center">Efficiency</th>
                          <th className="px-6 py-4 text-center">Members</th>
                          <th className="px-6 py-4 text-center">Attendance (Avg)</th>
                          <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {reportData.groupMetrics.map((g, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                  <span className="font-bold text-slate-900 block">{g.name}</span>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center justify-center gap-3">
                                      <div className="flex-1 max-w-[80px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className={clsx("h-full rounded-full", g.attendance >= 80 ? "bg-green-500" : g.attendance >= 60 ? "bg-brand-500" : "bg-orange-400")} 
                                            style={{ width: `${g.attendance}%` }} 
                                          />
                                      </div>
                                      <span className="text-xs font-bold text-slate-700 w-8">{g.attendance}%</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-center text-slate-600 font-medium">
                                  {g.memberCount}
                              </td>
                              <td className="px-6 py-4 text-center text-slate-600">
                                  {Math.round(g.rawPresent / Math.max(1, filteredDates.length))}
                              </td>
                              <td className="px-6 py-4 text-right">
                                  {g.attendance >= 80 ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                                          Excellent
                                      </span>
                                  ) : g.attendance >= 60 ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-50 text-brand-700">
                                          Good
                                      </span>
                                  ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800">
                                          Needs Focus
                                      </span>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default Reports;