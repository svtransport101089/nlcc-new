import React from 'react';
import { Group } from '../types';
import { Users, ChevronRight, User, Filter } from 'lucide-react';

interface GroupListProps {
  groups: Group[];
  onSelectGroup: (groupId: string) => void;
  monthRanges: string[];
  selectedMonthRange: string;
  onSelectMonthRange: (range: string) => void;
}

const GroupList: React.FC<GroupListProps> = ({ 
    groups, 
    onSelectGroup, 
    monthRanges, 
    selectedMonthRange, 
    onSelectMonthRange 
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Groups</h2>
            <span className="text-sm bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
            {groups.length} Active
            </span>
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-500" />
            </div>
            <select
                value={selectedMonthRange}
                onChange={(e) => onSelectMonthRange(e.target.value)}
                className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-9 pr-10 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm font-medium shadow-sm w-full sm:w-auto cursor-pointer hover:bg-slate-50 transition-colors"
            >
                <option value="All">All Month Ranges</option>
                {monthRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div 
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            className="group bg-white rounded-xl shadow-sm border border-slate-200 p-5 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">{group.leaderName}</h3>
                <div className="flex items-center text-sm text-slate-500 mb-3">
                  <User className="h-3 w-3 mr-1" />
                  {group.coLeaderName ? `Co: ${group.coLeaderName}` : 'No Co-Leader'}
                </div>
              </div>
              <div className="bg-brand-50 rounded-full p-2 group-hover:bg-brand-100 transition-colors">
                <ChevronRight className="h-5 w-5 text-brand-600" />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-2 flex items-center justify-between">
              <div className="flex items-center text-slate-600">
                <Users className="h-4 w-4 mr-1.5" />
                <span className="text-sm font-medium">{group.members.length} Members</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{group.monthRange.split(' - ')[0]}</span>
            </div>
          </div>
        ))}
        {groups.length === 0 && (
             <div className="col-span-full p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                 No groups found for the selected filter.
             </div>
        )}
      </div>
    </div>
  );
};

export default GroupList;