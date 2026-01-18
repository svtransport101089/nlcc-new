import React, { useMemo } from 'react';
import { Group } from '../types';
import { User, Phone, Users, Filter } from 'lucide-react';

interface MembersListProps {
  groups: Group[];
  searchQuery?: string;
  monthRanges: string[];
  selectedMonthRange: string;
  onSelectMonthRange: (range: string) => void;
}

const MembersList: React.FC<MembersListProps> = ({ 
    groups, 
    searchQuery = '', 
    monthRanges, 
    selectedMonthRange, 
    onSelectMonthRange 
}) => {
  const allMembers = useMemo(() => {
    return groups.flatMap(g => 
      g.members.map(m => ({ ...m, groupName: g.leaderName, monthRange: g.monthRange }))
    ).filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.phone.includes(searchQuery)
    );
  }, [groups, searchQuery]);

  return (
    <div className="space-y-4">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
         <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">All Members</h2>
            <span className="text-sm bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
            {allMembers.length} Total
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {allMembers.map((member) => (
            <li key={member.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-brand-50 h-10 w-10 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm">
                  {member.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {member.groupName}
                    </span>
                    {member.phone && (
                        <span className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {member.phone}
                        </span>
                    )}
                    <span className="text-slate-400 border-l border-slate-200 pl-3">
                        {member.monthRange}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {allMembers.length === 0 && (
             <li className="p-8 text-center text-slate-500 text-sm">
                No members found.
             </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default MembersList;