import React, { useMemo, useState, useEffect } from 'react';
import { Group, AttendanceStatus, Member } from '../types';
import { ArrowLeft, Phone, Search, Check, X, Minus, CheckCircle, XCircle, Trash2, UserPlus, Plus, History, Calendar, User, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import clsx from 'clsx';
import { getAllDates } from '../services/dataProcessor';

interface GroupDetailProps {
  group: Group;
  onBack: () => void;
  allGroups: Group[];
  onBulkUpdate: (groupId: string, date: string, status: AttendanceStatus) => void;
  onAddMember: (groupId: string, name: string, phone: string) => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({ group, onBack, allGroups, onBulkUpdate, onAddMember }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionDate, setActionDate] = useState<string | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [viewMember, setViewMember] = useState<Member | null>(null);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ date: string; type: 'present' | 'absent' } | null>(null);
  
  // Add Member Form State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  // Reset sort when group changes
  useEffect(() => {
    setSortConfig(null);
  }, [group.id]);
  
  // Get all unique dates from the dataset, sorted
  const dates = useMemo(() => getAllDates(allGroups), [allGroups]);
  
  const filteredMembers = useMemo(() => {
    let members = group.members.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.phone.includes(searchTerm)
    );

    if (sortConfig) {
        members = [...members].sort((a, b) => {
             const sA = a.attendance[sortConfig.date];
             const sB = b.attendance[sortConfig.date];
             
             if (sortConfig.type === 'present') {
                 // Priority: Present(2) > Absent(1) > Empty(0)
                 const getScore = (s: string | undefined) => s === 'P' ? 2 : (s === 'A' ? 1 : 0);
                 const scoreDiff = getScore(sB) - getScore(sA);
                 if (scoreDiff !== 0) return scoreDiff;
             } else {
                 // Priority: Absent(2) > Present(1) > Empty(0)
                 const getScore = (s: string | undefined) => s === 'A' ? 2 : (s === 'P' ? 1 : 0);
                 const scoreDiff = getScore(sB) - getScore(sA);
                 if (scoreDiff !== 0) return scoreDiff;
             }
             // Secondary sort by name
             return a.name.localeCompare(b.name);
        });
    } else {
         members.sort((a, b) => a.name.localeCompare(b.name));
    }

    return members;
  }, [group.members, searchTerm, sortConfig]);

  // Calculate stats for this specific group
  const groupStats = useMemo(() => {
      let present = 0;
      let total = 0;
      group.members.forEach(m => {
          Object.values(m.attendance).forEach(status => {
              if (status === 'P') present++;
              if (status === 'P' || status === 'A') total++;
          });
      });
      return total === 0 ? 0 : Math.round((present / total) * 100);
  }, [group]);

  const handleBulkAction = (status: AttendanceStatus) => {
    if (actionDate) {
      onBulkUpdate(group.id, actionDate, status);
      setActionDate(null);
    }
  };

  const handleSort = (type: 'present' | 'absent') => {
      if (actionDate) {
          if (sortConfig?.date === actionDate && sortConfig.type === type) {
              setSortConfig(null); // Toggle off if already active
          } else {
              setSortConfig({ date: actionDate, type });
          }
          setActionDate(null);
      }
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberName.trim()) {
      onAddMember(group.id, newMemberName.trim(), newMemberPhone.trim());
      setNewMemberName('');
      setNewMemberPhone('');
      setIsAddMemberOpen(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in relative">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-20 z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{group.leaderName}</h2>
            <p className="text-sm text-slate-500">
                {group.members.length} Youth • {groupStats}% Avg Attendance
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
             <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Find in group..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
            </div>
            
            <button 
                onClick={() => setIsAddMemberOpen(true)}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
                <UserPlus className="h-4 w-4" />
                <span>Add Member</span>
            </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col pb-12">
        <div className="overflow-x-auto no-scrollbar">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-r border-slate-200 shadow-[4px_0_24px_-2px_rgba(0,0,0,0.05)] w-48">
                  Member
                </th>
                {dates.map(date => {
                    const d = new Date(date);
                    const isActionOpen = actionDate === date;
                    const isSorted = sortConfig?.date === date;
                    return (
                        <th 
                            key={date} 
                            onClick={() => setActionDate(date)}
                            scope="col" 
                            className={clsx(
                                "px-2 py-3 text-center text-xs font-medium uppercase tracking-wider min-w-[60px] cursor-pointer transition-colors group relative select-none",
                                isActionOpen ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            )}
                        >
                            <div className="flex flex-col items-center justify-center gap-1">
                                <div className="flex flex-col leading-tight items-center">
                                    <span className="font-bold text-lg">{d.getDate()}</span>
                                    <span className="text-[10px]">{d.toLocaleString('default', { month: 'short' })}</span>
                                </div>
                                <div className="h-4 flex items-center justify-center">
                                    {isSorted ? (
                                        <div className={clsx(
                                            "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                            sortConfig.type === 'present' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        )}>
                                            {sortConfig.type === 'present' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                            Sort
                                        </div>
                                    ) : (
                                         <div className={clsx(
                                            "h-1 w-8 rounded-full transition-all mt-1",
                                            isActionOpen ? "bg-brand-500" : "bg-transparent group-hover:bg-slate-300"
                                        )} />
                                    )}
                                </div>
                            </div>
                        </th>
                    );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 whitespace-nowrap border-r border-slate-200 text-sm font-medium text-slate-900 shadow-[4px_0_24px_-2px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                            <span className="truncate max-w-[110px]" title={member.name}>{member.name}</span>
                            {member.phone && (
                                <a href={`tel:${member.phone}`} className="flex items-center text-xs text-slate-400 mt-0.5 hover:text-brand-600 w-fit">
                                    <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{member.phone}</span>
                                </a>
                            )}
                        </div>
                        <button 
                            onClick={() => setViewMember(member)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors flex-shrink-0"
                            title="View History"
                        >
                            <History className="h-4 w-4" />
                        </button>
                    </div>
                  </td>
                  {dates.map(date => {
                      const status = member.attendance[date];
                      return (
                        <td key={`${member.id}-${date}`} className="px-2 py-3 whitespace-nowrap text-center">
                            <div className={clsx(
                                "inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-all",
                                status === 'P' && "bg-green-100 text-green-700",
                                status === 'A' && "bg-red-100 text-red-700",
                                !status && "bg-slate-100 text-slate-300"
                            )}>
                                {status === 'P' && <Check className="h-4 w-4" />}
                                {status === 'A' && <X className="h-4 w-4" />}
                                {!status && <Minus className="h-4 w-4" />}
                            </div>
                        </td>
                      );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">
                  No members found matching "{searchTerm}"
              </div>
          )}
        </div>
      </div>

      {/* Action Modal (Date Headers) */}
      {actionDate && (
        <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setActionDate(null)}
        >
            <div 
                className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300" 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Actions</span>
                        <span className="text-lg font-bold text-slate-900">
                            {new Date(actionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    <button 
                        onClick={() => setActionDate(null)} 
                        className="p-2 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-4 space-y-3">
                     {/* Sorting Section */}
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <button
                            onClick={() => handleSort('present')}
                            className={clsx(
                                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-[0.98]",
                                sortConfig?.date === actionDate && sortConfig.type === 'present' 
                                    ? "bg-green-50 border-green-200 text-green-700 ring-1 ring-green-500" 
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            <ArrowDown className="h-5 w-5 mb-1 text-green-600" />
                            <span className="text-xs font-semibold">Present First</span>
                        </button>
                        <button
                            onClick={() => handleSort('absent')}
                             className={clsx(
                                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-[0.98]",
                                sortConfig?.date === actionDate && sortConfig.type === 'absent' 
                                    ? "bg-red-50 border-red-200 text-red-700 ring-1 ring-red-500" 
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            <ArrowDown className="h-5 w-5 mb-1 text-red-600" />
                            <span className="text-xs font-semibold">Absent First</span>
                        </button>
                    </div>

                    <div className="h-px bg-slate-100 my-2" />

                    <p className="text-sm text-slate-500 mb-2">Update attendance for all displayed members.</p>
                    
                    <button 
                        onClick={() => handleBulkAction('P')} 
                        className="w-full flex items-center justify-between p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 border border-green-200 transition-all active:scale-[0.98]"
                    >
                        <span className="flex items-center gap-3 font-semibold">
                            <div className="p-2 bg-green-200 rounded-full">
                                <CheckCircle className="w-5 h-5" /> 
                            </div>
                            Mark All Present
                        </span>
                        <span className="text-xs font-bold bg-white/50 px-2 py-1 rounded-md">P</span>
                    </button>

                    <button 
                        onClick={() => handleBulkAction('A')} 
                        className="w-full flex items-center justify-between p-4 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 border border-red-200 transition-all active:scale-[0.98]"
                    >
                         <span className="flex items-center gap-3 font-semibold">
                            <div className="p-2 bg-red-200 rounded-full">
                                <XCircle className="w-5 h-5" /> 
                            </div>
                            Mark All Absent
                        </span>
                        <span className="text-xs font-bold bg-white/50 px-2 py-1 rounded-md">A</span>
                    </button>

                    <div className="h-px bg-slate-100 my-2" />

                    <button 
                        onClick={() => handleBulkAction('')} 
                        className="w-full flex items-center justify-center gap-2 p-3 text-slate-500 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> 
                        Clear Attendance
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setIsAddMemberOpen(false)}
        >
             <div 
                className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300" 
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleAddMemberSubmit}>
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2">
                             <div className="bg-brand-100 p-1.5 rounded-lg text-brand-600">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Add New Member</h3>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setIsAddMemberOpen(false)} 
                            className="p-2 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-5 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={newMemberName}
                                onChange={(e) => setNewMemberName(e.target.value)}
                                placeholder="e.g. John Doe"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                autoFocus
                            />
                        </div>

                         <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                            <input
                                id="phone"
                                type="tel"
                                value={newMemberPhone}
                                onChange={(e) => setNewMemberPhone(e.target.value)}
                                placeholder="e.g. 9876543210"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit"
                                className="w-full bg-slate-900 text-white font-medium py-3 rounded-lg hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="h-5 w-5" />
                                Add Member
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Member History Modal */}
      {viewMember && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setViewMember(null)}
        >
             <div 
                className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                    <div className="flex items-center gap-3">
                         <div className="bg-brand-100 p-2 rounded-full text-brand-600">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{viewMember.name}</h3>
                            <p className="text-xs text-slate-500">Attendance History</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setViewMember(null)} 
                        className="p-2 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Stats Summary */}
                <div className="p-4 grid grid-cols-3 gap-3 border-b border-slate-100 flex-shrink-0 bg-white">
                    {(() => {
                        let p = 0; let a = 0;
                        dates.forEach(d => {
                            const s = viewMember.attendance[d];
                            if (s === 'P') p++;
                            if (s === 'A') a++;
                        });
                        const percentage = (p + a) > 0 ? Math.round((p / (p + a)) * 100) : 0;
                        
                        return (
                            <>
                               <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-green-600">{p}</span>
                                    <span className="text-xs font-medium text-green-600/80">Present</span>
                               </div>
                               <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-red-600">{a}</span>
                                    <span className="text-xs font-medium text-red-600/80">Absent</span>
                               </div>
                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-blue-600">{percentage}%</span>
                                    <span className="text-xs font-medium text-blue-600/80">Rate</span>
                               </div>
                            </>
                        )
                    })()}
                </div>

                {/* History List */}
                <div className="overflow-y-auto p-4 space-y-2">
                    {dates.map(date => {
                        const status = viewMember.attendance[date];
                        const d = new Date(date);

                        return (
                            <div key={date} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-700">
                                        {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <div>
                                    {status === 'P' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Present</span>}
                                    {status === 'A' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Absent</span>}
                                    {!status && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">No Record</span>}
                                </div>
                            </div>
                        );
                    })}
                    {dates.length === 0 && (
                        <div className="text-center text-slate-400 py-8 text-sm">
                            No attendance dates configured.
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;