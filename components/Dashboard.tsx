import React, { useMemo } from 'react';
import { DashboardStats } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import { Users, UserCheck, TrendingUp, Calendar, Heart, Zap, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import clsx from 'clsx';

interface DashboardProps {
  stats: DashboardStats;
}

const StatCard = ({ title, value, icon: Icon, colorClass, subtext, trend }: any) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between group hover:border-brand-300 transition-all duration-300">
    <div className="flex items-start justify-between mb-4">
      <div className={clsx("p-3 rounded-xl", colorClass)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      {trend && (
        <div className={clsx(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
            trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
            {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const lastService = stats.attendanceTrend[stats.attendanceTrend.length - 1];
  const prevService = stats.attendanceTrend[stats.attendanceTrend.length - 2];
  
  const growth = useMemo(() => {
      if (!lastService || !prevService) return 0;
      const current = lastService.presentCount;
      const prev = prevService.presentCount;
      if (prev === 0) return 0;
      return Math.round(((current - prev) / prev) * 100);
  }, [lastService, prevService]);

  const pieData = [
    { name: 'Present', value: lastService?.presentCount || 0, color: '#14b8a6' },
    { name: 'Absent', value: lastService?.absentCount || 0, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Hero Welcome */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden mb-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Service Overview</h1>
                <p className="text-slate-400 max-w-md">Welcome to the YouthLink Executive Dashboard. Here is the summary of your Sunday Service performance.</p>
            </div>
            <div className="flex gap-4">
                <div className="text-center bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Last Sunday</p>
                    <p className="text-2xl font-black">{lastService?.presentCount || 0}</p>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Growth</p>
                    <p className={clsx("text-2xl font-black", growth >= 0 ? "text-green-400" : "text-red-400")}>
                        {growth > 0 ? '+' : ''}{growth}%
                    </p>
                </div>
            </div>
        </div>
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-brand-500 rounded-full blur-[100px] opacity-20" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Congregation Size" 
          value={stats.totalMembers} 
          icon={Users} 
          colorClass="bg-blue-600" 
          subtext="Registered youth members"
        />
        <StatCard 
          title="Sunday Groups" 
          value={stats.totalGroups} 
          icon={ShieldCheck} 
          colorClass="bg-indigo-600" 
          subtext="Active cell groups"
        />
        <StatCard 
          title="Avg. Engagement" 
          value={`${stats.avgAttendance.toFixed(1)}%`} 
          icon={UserCheck} 
          colorClass="bg-teal-600" 
          subtext="Overall presence rate"
          trend={growth}
        />
        <StatCard 
          title="Ministry Health" 
          value={stats.avgAttendance > 70 ? "Healthy" : "Needs Focus"} 
          icon={Heart} 
          colorClass={stats.avgAttendance > 70 ? "bg-rose-600" : "bg-orange-500"} 
          subtext="Based on engagement trends"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Sunday Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Sunday Attendance Trend</h3>
                <p className="text-sm text-slate-500">Participation levels across the year</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-brand-500" /> Present</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-200" /> Range</div>
              </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.attendanceTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="presentCount" 
                  name="Present"
                  stroke="#14b8a6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorPresent)" 
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#14b8a6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Participation Distribution */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Last Sunday Mix</h3>
            <p className="text-sm text-slate-500 mb-6">Attendance breakdown for the most recent service</p>
            
            <div className="flex-1 relative min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rate</p>
                    <p className="text-3xl font-black text-slate-900">
                        {lastService ? Math.round((lastService.presentCount / (lastService.presentCount + lastService.absentCount)) * 100) : 0}%
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 text-center">
                    <p className="text-[10px] font-bold text-teal-600 uppercase mb-1">Present</p>
                    <p className="text-xl font-black text-teal-900">{lastService?.presentCount || 0}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                    <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Absent</p>
                    <p className="text-xl font-black text-red-900">{lastService?.absentCount || 0}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;