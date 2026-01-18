import React from 'react';
import { DashboardStats } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { Users, UserCheck, TrendingUp, Calendar } from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats;
}

const StatCard = ({ title, value, icon: Icon, colorClass, subtext }: any) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  // Determine if attendance is growing
  const lastTwo = stats.attendanceTrend.slice(-2);
  const isGrowing = lastTwo.length === 2 && lastTwo[1].presentCount >= lastTwo[0].presentCount;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Youth" 
          value={stats.totalMembers} 
          icon={Users} 
          colorClass="bg-blue-500" 
          subtext="Registered across all groups"
        />
        <StatCard 
          title="Groups" 
          value={stats.totalGroups} 
          icon={Calendar} 
          colorClass="bg-indigo-500" 
          subtext="Active cells"
        />
        <StatCard 
          title="Avg. Attendance" 
          value={`${stats.avgAttendance.toFixed(1)}%`} 
          icon={UserCheck} 
          colorClass="bg-emerald-500" 
          subtext="Overall presence rate"
        />
        <StatCard 
          title="Recent Trend" 
          value={isGrowing ? "Upward" : "Steady"} 
          icon={TrendingUp} 
          colorClass={isGrowing ? "bg-green-500" : "bg-orange-400"} 
          subtext="Based on last 2 sessions"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Attendance Trends</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.attendanceTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => val.slice(5)} 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="presentCount" 
                  name="Present"
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPresent)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Participation Mix</h3>
          <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.attendanceTrend.slice(-5)} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0"/>
                <XAxis type="number" hide />
                <YAxis 
                    dataKey="date" 
                    type="category" 
                    width={80} 
                    tickFormatter={(val) => val.slice(5)}
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                <Bar dataKey="presentCount" name="Present" fill="#10b981" radius={[0, 4, 4, 0]} stackId="a" />
                <Bar dataKey="absentCount" name="Absent" fill="#ef4444" radius={[0, 4, 4, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
