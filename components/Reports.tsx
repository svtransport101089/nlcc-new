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
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between relative overflow-hidden group hover:border-brand-200 transition-all duration-300">
    <div className="relative z-10">
      <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
      {subtext && <p className="text-xs text-slate-500 mt-2 font-medium">{subtext}</p>}
    </div>
    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-brand-50 transition-colors">
      <Icon className="h-6 w-6 text-slate-400 group-hover:text-brand-600 transition-colors" />
    </div>
    {trend === 'up' && <div className="absolute bottom-0 left-0 w-full h-1.5 bg-green-500" />}
    {trend === 'down' && <div className="absolute bottom-0 left-0 w-full h-1.5 bg-red-500" />}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // For ScatterChart, payload[0] contains the data point
    const value = payload[0].value;
    const name = payload[0].name;

    let quadrantStatus = '';
    if (payload[0].dataKey === 'attendance') { // For scatter chart groups
        const avgGroupSize = payload[0].owner.props.children.find((child:any) => child.props.x !== undefined)?.props.x;
        const avgEngagementRate = payload[0].owner.props.children.find((child:any) => child.props.y !== undefined)?.props.y;
        
        if (data.memberCount >= avgGroupSize && data.attendance >= avgEngagementRate) {
            quadrantStatus = 'High-Impact Group';
        } else if (data.memberCount < avgGroupSize && data.attendance >= avgEngagementRate) {
            quadrantStatus = 'Growth Potential';
        } else if (data.memberCount >= avgGroupSize && data.attendance < avgEngagementRate) {
            quadrantStatus = 'Priority Attention';
        } else {
            quadrantStatus = 'Developing';
        }
    }

    return (
      <div className="bg-white p-4 border-none shadow-2xl rounded-2xl text-xs min-w-[140px]">
        <p className="font-black text-slate-900 mb-2 border-b border-slate-100 pb-1">{data.name || label}</p>
        {quadrantStatus && <p className="text-brand-600 font-bold mb-2">{quadrantStatus}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-500 font-bold capitalize">{entry.name}:</span>
            </div>
            <span className="font-black text-slate-900">{entry.value}{entry.unit}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Reports: React.FC<ReportsProps> = ({ groups, onResetData }) => {
  const dates = useMemo(() => getAllDates(groups), [groups]); // Now guaranteed to be Sunday dates
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });

  // Initialize date range to cover all available Sundays
  useEffect(() => {
      if (dates.length > 0 && (!dateRange.start || !dateRange.end)) {
          setDateRange({ start: dates[0], end: dates[dates.length - 1] });
      }
  }, [dates]);

  // Filter dates to only include Sundays within the selected range
  const filteredDates = useMemo(() => {
      if (!dateRange.start || !dateRange.end) return [];
      return dates.filter(d => d >= dateRange.start && d <= dateRange.end);
  }, [dates, dateRange]);

  // Sync selectedDate with the latest filtered Sunday
  useEffect(() => {
    if (filteredDates.length > 0) {
        if (!selectedDate || !filteredDates.includes(selectedDate)) {
             setSelectedDate(filteredDates[filteredDates.length - 1]);
        }
    } else {
        setSelectedDate('');
    }
  }, [filteredDates, selectedDate]);

  const reportData = useMemo(() => {
    if (filteredDates.length === 0) {
        return {
            groupMetrics: [],
            memberLeaderboard: [],
            atRiskMembers: [],
            totalMembers: groups.reduce((acc, g) => acc + g.members.length, 0),
            overallRate: 0,
            bestGroup: null,
            sundayServiceStats: { present: 0, absent: 0, unrecorded: 0 }, // Renamed
            groupSundayStats: [], // Renamed
            trendData: [],
            sundayHistory: [], // Renamed
            overallSummary: { totalPresent: 0, totalAbsent: 0, overallRate: 0 }
        };
    }

    const lastDate = filteredDates[filteredDates.length - 1];
    const secondLastDate = filteredDates.length > 1 ? filteredDates[filteredDates.length - 2] : null;
    const targetDate = selectedDate || lastDate;

    // Group Metrics (Overall Sunday Engagement within Range)
    const groupMetrics = groups.map(g => {
      let present = 0;
      let total = 0; // Opportunities for a group in the filtered dates
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
        attendance: Math.round(avg), // This is the Sunday Attendance Rate
        memberCount: g.members.length,
        rawPresent: present,
        rawTotal: total
      };
    }).sort((a, b) => b.attendance - a.attendance);

    // Member Leaderboard (Sunday Faithfulness within Range)
    const memberLeaderboard = groups.flatMap(g => 
      g.members.map(m => {
        let present = 0;
        let total = 0; // Opportunities for a member in the filtered dates
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
          totalSundays: total, // Renamed
          presentSundays: present // Renamed
        };
      })
    ).filter(m => m.totalSundays >= 1)
     .sort((a, b) => b.rate - a.rate || b.totalSundays - a.totalSundays)
     .slice(0, 5);

    // At Risk Members (Based on consecutive Sunday Absences)
    const atRiskMembers = secondLastDate ? groups.flatMap(g => 
      g.members.filter(m => {
        const lastStatus = m.attendance[lastDate];
        const prevStatus = m.attendance[secondLastDate];
        return lastStatus === 'A' && prevStatus === 'A'; // Missed last two Sundays
      }).map(m => ({
        name: m.name,
        group: g.leaderName,
        phone: m.phone,
        missedStreak: 2
      }))
    ).slice(0, 10) : [];

    // Global Stats (Sunday Averages within Range)
    const totalMembers = groups.reduce((acc, g) => acc + g.members.length, 0);
    // Overall rate needs to be calculated from total opportunities across all groups/members for filtered dates
    let overallTotalPresent = 0;
    let overallTotalOpportunities = 0;
    groups.forEach(g => {
        g.members.forEach(m => {
            filteredDates.forEach(date => {
                const status = m.attendance[date];
                if (status === 'P') overallTotalPresent++;
                if (status === 'P' || status === 'A') overallTotalOpportunities++;
            });
        });
    });
    const overallRate = overallTotalOpportunities > 0 ? Math.round((overallTotalPresent / overallTotalOpportunities) * 100) : 0;

    const bestGroup = groupMetrics[0];

    // Selected Sunday Service Breakdown
    const sundayServiceStats = { present: 0, absent: 0, unrecorded: 0 }; // Renamed
    const groupSundayStats = groups.map(g => { // Renamed
        let present = 0;
        let absent = 0;
        let unrecorded = 0;
        g.members.forEach(m => {
             const status = m.attendance[targetDate];
             if (status === 'P') present++;
             else if (status === 'A') absent++;
             else unrecorded++;
        });
        
        sundayServiceStats.present += present;
        sundayServiceStats.absent += absent;
        sundayServiceStats.unrecorded += unrecorded;

        return {
            id: g.id,
            name: g.leaderName,
            present,
            absent,
            unrecorded
        };
    }).sort((a, b) => b.present - a.present);

    // Trends Data (Sunday-by-Sunday within Range)
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

    // Sunday History Report (All Sundays in Range)
    const sundayHistory = filteredDates.slice().reverse().map(date => { // Renamed
        let present = 0;
        let absent = 0;
        let totalRecorded = 0; // Only count P or A for total
        let topG = { name: '-', count: -1 };

        groups.forEach(g => {
            let gPresent = 0;
            g.members.forEach(m => {
                const s = m.attendance[date];
                if (s === 'P') { present++; gPresent++; }
                if (s === 'A') absent++;
                if (s === 'P' || s === 'A') totalRecorded++;
            });
            if (gPresent > topG.count) {
                topG = { name: g.leaderName, count: gPresent };
            }
        });

        return {
            date,
            present,
            absent,
            rate: totalRecorded > 0 ? Math.round((present / totalRecorded) * 100) : 0,
            topGroup: topG.name,
            totalRecorded
        };
    });

    // Overall Summary for Historical Sunday Performance
    const overallSummary = sundayHistory.reduce((acc, current) => {
        acc.totalPresent += current.present;
        acc.totalAbsent += current.absent;
        acc.totalRecorded += current.totalRecorded;
        return acc;
    }, { totalPresent: 0, totalAbsent: 0, totalRecorded: 0 });
    overallSummary.overallRate = overallSummary.totalRecorded > 0 ? Math.round((overallSummary.totalPresent / overallSummary.totalRecorded) * 100) : 0;


    return { 
        groupMetrics, 
        memberLeaderboard, 
        atRiskMembers, 
        totalMembers, 
        overallRate, 
        bestGroup,
        sundayServiceStats, // Renamed
        groupSundayStats, // Renamed
        trendData,
        sundayHistory, // Renamed
        overallSummary
    };
  }, [groups, filteredDates, selectedDate]);

  const handleExport = () => {
    const csvContent = exportToCSV(groups);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `church_sunday_report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSessionReport = (dateStr: string) => {
    if (!dateStr) return;
    const headers = ['Group', 'Member Name', 'Phone', 'Status', 'Service Date'];
    const rows = [headers.join(',')];
    groups.forEach(g => {
        g.members.forEach(m => {
            const status = m.attendance[dateStr];
            const statusLabel = status === 'P' ? 'Present' : status === 'A' ? 'Absent' : 'Unrecorded';
            rows.push([`"${g.leaderName}"`,`"${m.name}"`,`"${m.phone || ''}"`,`"${statusLabel}"`,`"${dateStr}"`].join(','));
        });
    });
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sunday_service_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CHART_COLORS = ['#0f766e', '#0d9488', '#14b8a6', '#5eead4', '#99f6e4', '#ccfbf1'];
  const PIE_COLORS = ['#10b981', '#ef4444', '#cbd5e1']; 

  const pieData = [
    { name: 'Present', value: reportData.sundayServiceStats.present, color: PIE_COLORS[0] },
    { name: 'Absent', value: reportData.sundayServiceStats.absent, color: PIE_COLORS[1] },
    { name: 'Unrecorded', value: reportData.sundayServiceStats.unrecorded, color: PIE_COLORS[2] },
  ];
  
  const avgGroupSize = Math.round(reportData.totalMembers / Math.max(1, groups.length));

  return (
    <div className="space-y-8 animate-fade-in pb-12 font-sans">
      {/* Executive Header */}
      <div className="flex flex-col gap-6 border-b border-slate-200 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Executive Sunday Report</h2>
                <p className="text-slate-500 mt-2 font-medium">Strategic overview of youth engagement and Sunday service growth.</p>
            </div>
            <div className="flex flex-wrap gap-3 print:hidden">
                <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all uppercase tracking-widest">
                    <FileDown className="h-4 w-4" />
                    Export Full Log
                </button>
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 text-xs font-black uppercase tracking-widest">
                <Filter className="h-4 w-4 text-brand-600" />
                <span>Report Period:</span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none w-full sm:w-auto" />
                <span className="text-slate-400 font-bold">to</span>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none w-full sm:w-auto" />
            </div>
            <div className="hidden sm:block h-8 w-px bg-slate-100 mx-2" />
            <div className="text-xs text-slate-400 font-bold uppercase tracking-tight ml-auto">
                Analyzing <span className="text-slate-900">{filteredDates.length}</span> Service Sundays
            </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Retention Efficiency" value={`${reportData.overallRate}%`} subtext="Selected range average" icon={Activity} trend={reportData.overallRate > 75 ? 'up' : 'down'} />
        <KPICard title="Total Congregation" value={reportData.totalMembers} subtext="Registered youth" icon={Users} />
        <KPICard title="Primary Group" value={reportData.bestGroup?.attendance + '%'} subtext={reportData.bestGroup?.name || 'N/A'} icon={Trophy} trend="up" />
        <KPICard title="Discipleship Risk" value={reportData.atRiskMembers.length} subtext="Missed last 2 Sundays" icon={AlertTriangle} trend={reportData.atRiskMembers.length > 5 ? 'down' : 'up'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sunday Engagement Matrix */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-slate-900">Sunday Engagement Matrix</h3>
                    <p className="text-sm text-slate-500 font-medium">Correlation between Group Scale and Sunday Attendance Efficiency</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl"><LayoutGrid className="h-6 w-6 text-brand-600" /></div>
             </div>
             <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis type="number" dataKey="memberCount" name="Congregation Size" unit=" members" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis type="number" dataKey="attendance" name="Sunday Engagement Rate" unit="%" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                        <ReferenceLine x={avgGroupSize} stroke="#cbd5e1" strokeDasharray="5 5" label={{ value: 'Avg Size', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                        <ReferenceLine y={reportData.overallRate} stroke="#cbd5e1" strokeDasharray="5 5" label={{ value: 'Avg Engagement', position: 'insideRight', fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                        <Scatter name="Groups" data={reportData.groupMetrics} fill="#14b8a6">
                             {reportData.groupMetrics.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                             ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Sunday Mix */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
              <div className="mb-6">
                   <h3 className="text-xl font-black text-slate-900">Sunday Service Detail</h3>
                   <p className="text-sm text-slate-500 mb-4 font-medium">Specific breakdown for a single service</p>
                   <div className="relative">
                        <CalendarDays className="absolute left-4 top-3.5 h-4 w-4 text-brand-500" />
                        <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer">
                            {filteredDates.slice().reverse().map(d => (
                                <option key={d} value={d}>Sunday, {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</option>
                            ))}
                        </select>
                   </div>
              </div>

              <div className="flex-1 min-h-[200px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />)}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                 <div className="flex items-center justify-between p-4 bg-teal-50 rounded-2xl border border-teal-100">
                     <span className="text-xs font-black text-teal-800 uppercase tracking-widest">Present</span>
                     <p className="text-2xl font-black text-teal-900">{reportData.sundayServiceStats.present}</p>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                     <span className="text-xs font-black text-red-800 uppercase tracking-widest">Absent</span>
                     <p className="text-2xl font-black text-red-900">{reportData.sundayServiceStats.absent}</p>
                 </div>
                 {reportData.sundayServiceStats.unrecorded > 0 && (
                     <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Unrecorded</span>
                         <p className="text-2xl font-black text-slate-900">{reportData.sundayServiceStats.unrecorded}</p>
                     </div>
                 )}
              </div>
          </div>
      </div>

      {/* Member Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 flex items-center gap-3"><Trophy className="h-5 w-5 text-yellow-500" /> Faithfulness Leaderboard</h3>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Top Performers</span>
              </div>
              <div className="divide-y divide-slate-100">
                  {reportData.memberLeaderboard.map((m, i) => (
                      <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                              <span className={clsx("w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black", i === 0 ? "bg-yellow-100 text-yellow-700 shadow-sm" : "bg-slate-100 text-slate-400")}>{i + 1}</span>
                              <div><p className="text-sm font-black text-slate-900">{m.name}</p><p className="text-xs text-slate-500 font-medium">{m.group}</p></div>
                          </div>
                          <div className="text-right">
                              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-black rounded-xl">{m.rate}%</span>
                          </div>
                      </div>
                  ))}
                  {reportData.memberLeaderboard.length === 0 && <p className="p-6 text-center text-sm text-slate-400 font-medium">No top performers identified for this period.</p>}
              </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-rose-50/50 flex items-center justify-between">
                  <h3 className="font-black text-rose-900 flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-rose-500" /> Retention Monitoring</h3>
                  <span className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Missed 2+ Sundays</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                  {reportData.atRiskMembers.map((m, i) => (
                      <div key={i} className="p-5 flex items-center justify-between hover:bg-rose-50 transition-colors">
                          <div><p className="text-sm font-black text-slate-900">{m.name}</p><p className="text-xs text-slate-500 font-medium">{m.group}</p></div>
                          <div className="text-right">{m.phone && <a href={`tel:${m.phone}`} className="text-xs font-black text-brand-600 hover:underline">{m.phone}</a>}</div>
                      </div>
                  ))}
                  {reportData.atRiskMembers.length === 0 && <div className="p-12 text-center text-slate-400 font-bold">No Retention Risks Identified</div>}
              </div>
          </div>
      </div>

       {/* Detailed Sunday History */}
       <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-teal-50/30 flex items-center gap-4">
              <div className="bg-teal-600 p-3 rounded-2xl text-white shadow-lg shadow-teal-100"><FileText className="h-6 w-6" /></div>
              <div>
                  <h3 className="text-xl font-black text-slate-900">Historical Sunday Performance</h3>
                  <p className="text-sm text-slate-500 font-medium">Record of all youth service Sundays in selected period</p>
              </div>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest sticky top-0">
                      <tr>
                          <th className="px-8 py-5">Service Date</th>
                          <th className="px-8 py-5 text-center">Efficiency</th>
                          <th className="px-8 py-5 text-center">Attendance</th>
                          <th className="px-8 py-5 text-center">Rate</th>
                          <th className="px-8 py-5">Leading Cell</th>
                          <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {reportData.sundayHistory.map((session, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5 font-black text-slate-900">Sunday, {new Date(session.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                              <td className="px-8 py-5 text-center">
                                  <span className={clsx("px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest", session.rate >= 80 ? "bg-green-100 text-green-800" : session.rate >= 60 ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800")}>
                                      {session.rate >= 80 ? 'Optimal' : session.rate >= 60 ? 'Stable' : 'Critical'}
                                  </span>
                              </td>
                              <td className="px-8 py-5 text-center text-slate-900 font-bold">{session.present} <span className="text-slate-300 mx-1">/</span> <span className="text-slate-500 text-xs font-medium">{session.totalRecorded}</span></td>
                              <td className="px-8 py-5 text-center font-black text-slate-700">{session.rate}%</td>
                              <td className="px-8 py-5 text-slate-500 font-medium text-xs">{session.topGroup}</td>
                              <td className="px-8 py-5 text-right">
                                  <button onClick={() => downloadSessionReport(session.date)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all shadow-sm border border-slate-100"><Download className="h-4 w-4" /></button>
                              </td>
                          </tr>
                      ))}
                      {reportData.sundayHistory.length === 0 && (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-medium">No Sunday service history available for this period.</td></tr>
                      )}
                  </tbody>
                  {reportData.sundayHistory.length > 0 && (
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                        <tr>
                            <td className="px-8 py-4 font-black text-slate-900 uppercase">Overall Summary</td>
                            <td className="px-8 py-4 text-center">
                                <span className={clsx("px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest", reportData.overallSummary.overallRate >= 80 ? "bg-green-100 text-green-800" : reportData.overallSummary.overallRate >= 60 ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800")}>
                                    {reportData.overallSummary.overallRate >= 80 ? 'Optimal' : reportData.overallSummary.overallRate >= 60 ? 'Stable' : 'Critical'}
                                </span>
                            </td>
                            <td className="px-8 py-4 text-center text-slate-900 font-black">{reportData.overallSummary.totalPresent} <span className="text-slate-300 mx-1">/</span> <span className="text-slate-500 text-xs font-medium">{reportData.overallSummary.totalRecorded}</span></td>
                            <td className="px-8 py-4 text-center font-black text-slate-700">{reportData.overallSummary.overallRate}%</td>
                            <td className="px-8 py-4 text-slate-500 font-medium text-xs">-</td>
                            <td className="px-8 py-4 text-right"></td>
                        </tr>
                    </tfoot>
                  )}
              </table>
          </div>
       </div>
    </div>
  );
};

export default Reports;