import React, { useMemo } from 'react';
import { Group } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Trophy, AlertTriangle, TrendingUp, Printer, Users, Target, 
  UserCheck, Check, X, Minus, Calendar, BarChart2, FileDown, RotateCcw, 
  ArrowUpRight, Activity, Percent, PieChart as PieChartIcon
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

const Reports: React.FC<ReportsProps> = ({ groups, onResetData }) => {
  const dates = useMemo(() => getAllDates(groups), [groups]);
  const lastDate = dates[dates.length - 1];
  const secondLastDate = dates[dates.length - 2];

  // Analysis Logic
  const reportData = useMemo(() => {
    // 1. Group Metrics
    const groupMetrics = groups.map(g => {
      let present = 0;
      let total = 0;
      g.members.forEach(m => {
        Object.values(m.attendance).forEach(status => {
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

    // 2. Member Leaderboard
    const memberLeaderboard = groups.flatMap(g => 
      g.members.map(m => {
        const history = Object.values(m.attendance);
        const present = history.filter(s => s === 'P').length;
        const total = history.filter(s => s === 'P' || s === 'A').length;
        const rate = total > 0 ? (present / total) * 100 : 0;
        return {
          name: m.name,
          group: g.leaderName,
          rate: Math.round(rate),
          totalSessions: total,
          presentSessions: present
        };
      })
    ).filter(m => m.totalSessions >= 3) // Minimum sessions to be considered
     .sort((a, b) => b.rate - a.rate || b.totalSessions - a.totalSessions)
     .slice(0, 5);

    // 3. At Risk Members (Missed last 2 sessions)
    const atRiskMembers = groups.flatMap(g => 
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
    ).slice(0, 5);

    // 4. Global Stats
    const totalMembers = groups.reduce((acc, g) => acc + g.members.length, 0);
    const overallRate = Math.round(groupMetrics.reduce((acc, m) => acc + m.attendance, 0) / (groupMetrics.length || 1));
    const bestGroup = groupMetrics[0];

    // 5. Latest Session Breakdown
    const latestStats = { present: 0, absent: 0, unrecorded: 0 };
    const groupLatestStats = groups.map(g => {
        let present = 0;
        let absent = 0;
        let unrecorded = 0;
        g.members.forEach(m => {
             const status = m.attendance[lastDate];
             if (status === 'P') present++;
             else if (status === 'A') absent++;
             else unrecorded++;
        });
        
        // Update global
        latestStats.present += present;
        latestStats.absent += absent;
        latestStats.unrecorded += unrecorded;

        return {
            id: g.id,
            name: g.leaderName,
            present,
            absent,
            unrecorded
        };
    }).sort((a, b) => b.present - a.present);

    return { 
        groupMetrics, 
        memberLeaderboard, 
        atRiskMembers, 
        totalMembers, 
        overallRate, 
        bestGroup,
        latestStats,
        groupLatestStats
    };
  }, [groups, lastDate, secondLastDate]);

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

  // Professional Teal/Slate Palette
  const CHART_COLORS = ['#0f766e', '#0d9488', '#14b8a6', '#5eead4', '#99f6e4', '#ccfbf1'];
  const PIE_COLORS = ['#10b981', '#ef4444', '#cbd5e1']; // Present (Green), Absent (Red), Unrecorded (Slate)

  // Data for Pie Chart
  const pieData = [
    { name: 'Present', value: reportData.latestStats.present },
    { name: 'Absent', value: reportData.latestStats.absent },
    { name: 'Pending', value: reportData.latestStats.unrecorded },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12 font-sans">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 pb-6 print:mb-8">
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
            Export CSV
          </button>
        </div>
      </div>

      {/* 2. KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
            title="Overall Efficiency" 
            value={`${reportData.overallRate}%`} 
            subtext="Avg. Attendance Rate"
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

      {/* 3. Group Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Group Performance Matrix</h3>
                    <p className="text-xs text-slate-500">Attendance rate by group leader</p>
                </div>
                <BarChart2 className="h-5 w-5 text-slate-400" />
             </div>
             <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.groupMetrics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
                         <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                         <XAxis type="number" domain={[0, 100]} hide />
                         <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={120} 
                            tick={{fontSize: 12, fill: '#64748b'}} 
                            axisLine={false} 
                            tickLine={false}
                         />
                         <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                return (
                                    <div className="bg-slate-900 text-white text-xs p-2 rounded shadow-xl">
                                        <p className="font-bold">{payload[0].payload.name}</p>
                                        <p>{payload[0].value}% Attendance</p>
                                        <p className="opacity-70">{payload[0].payload.memberCount} Members</p>
                                    </div>
                                );
                                }
                                return null;
                            }}
                         />
                         <Bar dataKey="attendance" radius={[0, 4, 4, 0]} barSize={20}>
                             {reportData.groupMetrics.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                             ))}
                         </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* 4. Latest Session Stats */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="mb-4">
                   <h3 className="text-lg font-bold text-slate-900">Latest Session</h3>
                   <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {lastDate ? new Date(lastDate).toLocaleDateString() : 'No Data'}
                   </p>
              </div>

              {/* Latest Session Pie Chart */}
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
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
              </div>
              
              <div className="flex-1 flex flex-col justify-center space-y-3">
                 {/* Present */}
                 <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                     <div className="flex items-center gap-3">
                         <div className="p-1.5 bg-green-200 rounded-full text-green-700"><Check className="h-4 w-4" /></div>
                         <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Present</p>
                     </div>
                     <p className="text-xl font-bold text-slate-900">{reportData.latestStats.present}</p>
                 </div>

                 {/* Absent */}
                 <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                     <div className="flex items-center gap-3">
                         <div className="p-1.5 bg-red-200 rounded-full text-red-700"><X className="h-4 w-4" /></div>
                         <p className="text-xs font-bold text-red-800 uppercase tracking-wide">Absent</p>
                     </div>
                     <p className="text-xl font-bold text-slate-900">{reportData.latestStats.absent}</p>
                 </div>

                 {/* Unrecorded */}
                 {reportData.latestStats.unrecorded > 0 && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-slate-200 rounded-full text-slate-600"><Minus className="h-4 w-4" /></div>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Pending</p>
                        </div>
                         <p className="text-xl font-bold text-slate-900">{reportData.latestStats.unrecorded}</p>
                    </div>
                 )}
              </div>
          </div>
      </div>

      {/* 5. Member Insights (Split View) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Consistency Leaders */}
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
                          <div className="text-right">
                              <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                  {m.rate}%
                              </span>
                          </div>
                      </div>
                  ))}
                  {reportData.memberLeaderboard.length === 0 && <p className="p-6 text-center text-sm text-slate-400">No data available.</p>}
              </div>
          </div>

          {/* Retention Alert */}
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

      {/* 6. Latest Session Breakdown by Group */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-indigo-50/50 flex justify-between items-center">
               <div className="flex items-center gap-3">
                   <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
                        <PieChartIcon className="h-5 w-5" />
                   </div>
                   <div>
                        <h3 className="text-lg font-bold text-slate-900">Latest Session Detail</h3>
                        <p className="text-xs text-slate-500">
                            Breakdown for {lastDate ? new Date(lastDate).toLocaleDateString() : 'N/A'}
                        </p>
                   </div>
               </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                          <th className="px-6 py-4">Group</th>
                          <th className="px-6 py-4 text-center">Present</th>
                          <th className="px-6 py-4 text-center">Absent</th>
                          <th className="px-6 py-4 text-center">Unrecorded</th>
                          <th className="px-6 py-4 text-right">Data Submitted</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {reportData.groupLatestStats.map((g) => {
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

      {/* 7. Detailed Data Table (Overall) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Overall Performance Matrix</h3>
              <p className="text-xs text-slate-500">Historical average by group</p>
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
                                  {Math.round(g.rawPresent / dates.length)}
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