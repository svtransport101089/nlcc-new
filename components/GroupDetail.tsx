import React, { useMemo, useState, useEffect } from 'react';
import { Group, AttendanceStatus, Member } from '../types';
import { ArrowLeft, Phone, Search, Check, X, Minus, CheckCircle, XCircle, Trash2, UserPlus, Plus, History, Calendar, User, ArrowDown, Edit2, Settings, Zap, ChevronLeft, ChevronRight, CalendarPlus } from 'lucide-react';
import clsx from 'clsx';
import { getAllDates } from '../services/dataProcessor';

interface GroupDetailProps {
  group: Group;
  onBack: () => void;
  allGroups: Group[];
  onBulkUpdate: (groupId: string, date: string, status: AttendanceStatus) => void;
  onAddMember: (groupId: string, name: string, phone: string) => void;
  onUpdateMember: (groupId: string, memberId: string, name: string, phone: string) => void;
  onDeleteMember: (groupId: string, memberId: string) => void;
  onAddSession: (date: string) => void;
  onMarkAttendance: (groupId: string, memberId: string, date: string, status: AttendanceStatus) => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({ 
    group, 
    onBack, 
    allGroups, 
    onBulkUpdate, 
    onAddMember,
    onUpdateMember,
    onDeleteMember,
    onAddSession,
    onMarkAttendance
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionDate, setActionDate] = useState<string | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [isSessionMode, setIsSessionMode] = useState(false);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [newSessionDate, setNewSessionDate] = useState('');
  
  const [sortConfig, setSortConfig] = useState<{ date: string; type: 'present' | 'absent' } | null>(null);
  
  // Form State
  const [memberFormData, setMemberFormData] = useState({ name: '', phone: '' });

  useEffect(() => { setSortConfig(null); }, [group.id]);
  
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
             const getScore = (s: string | undefined, target: string) => s === target ? 2 : (s && s !== target ? 1 : 0);
             
             const target = sortConfig.type === 'present' ? 'P' : 'A';
             const scoreDiff = getScore(sB, target) - getScore(sA, target);
             return scoreDiff !== 0 ? scoreDiff : 0;
        });
    }
    // No default sorting - strictly preserve CSV/Array order
    return members;
  }, [group.members, searchTerm, sortConfig]);

  const groupStats = useMemo(() => {
      let present = 0; let total = 0;
      group.members.forEach(m => {
          Object.values(m.attendance).forEach(status => {
              if (status === 'P') present++;
              if (status === 'P' || status === 'A') total++;
          });
      });
      return total === 0 ? 0 : Math.round((present / total) * 100);
  }, [group]);

  const handleBulkAction = (status: AttendanceStatus) => {
    if (actionDate) { onBulkUpdate(group.id, actionDate, status); setActionDate(null); }
  };

  const handleSort = (type: 'present' | 'absent') => {
      if (actionDate) {
          setSortConfig(sortConfig?.date === actionDate && sortConfig.type === type ? null : { date: actionDate, type });
          setActionDate(null);
      }
  };

  const openAdd = () => {
      setEditingMember(null);
      setMemberFormData({ name: '', phone: '' });
      setIsAddMemberOpen(true);
  };

  const openEditMember = (member: Member) => {
      setEditingMember(member);
      setMemberFormData({ name: member.name, phone: member.phone });
      setIsAddMemberOpen(true);
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (memberFormData.name.trim()) {
      if (editingMember) {
        onUpdateMember(group.id, editingMember.id, memberFormData.name.trim(), memberFormData.phone.trim());
      } else {
        onAddMember(group.id, memberFormData.name.trim(), memberFormData.phone.trim());
      }
      setIsAddMemberOpen(false);
    }
  };

  const handleNewSessionSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(newSessionDate) {
          onAddSession(newSessionDate);
          setIsAddSessionOpen(false);
          setNewSessionDate('');
      }
  }

  return (
    <div className="space-y-4 animate-fade-in relative">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-20 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{group.leaderName}</h2>
            <p className="text-sm text-slate-500">{group.members.length} Youth • {groupStats}% Avg Attendance</p>
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
                onClick={openAdd}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
                <UserPlus className="h-4 w-4" />
                <span>Add Member</span>
            </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col pb-12">
        <div className="overflow-x-auto no-scrollbar">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-56">Member</th>
                {dates.map(date => {
                    const isSorted = sortConfig?.date === date;
                    const d = new Date(date);
                    return (
                        <th key={date} onClick={() => setActionDate(date)} className={clsx("px-2 py-3 text-center text-xs font-medium uppercase tracking-wider min-w-[70px] cursor-pointer hover:bg-slate-100 transition-colors group relative", isSorted && "bg-brand-50 text-brand-700")}>
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-base">{d.getDate()}</span>
                                <span className="text-[10px]">{d.toLocaleString('default', { month: 'short' })}</span>
                                {isSorted && (
                                    <div className={clsx("mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold", sortConfig.type === 'present' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                        {sortConfig.type === 'present' ? 'P' : 'A'} Sorted
                                    </div>
                                )}
                            </div>
                        </th>
                    );
                })}
                <th className="px-2 py-3 text-center min-w-[70px]">
                    <button onClick={() => setIsAddSessionOpen(true)} className="flex flex-col items-center justify-center w-full h-full text-slate-400 hover:text-brand-600 transition-colors">
                        <CalendarPlus className="h-5 w-5 mb-1" />
                        <span className="text-[9px] font-bold uppercase">Add</span>
                    </button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors group/row">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 whitespace-nowrap border-r border-slate-200 text-sm shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-bold text-slate-900 truncate">{member.name}</span>
                            {member.phone && <a href={`tel:${member.phone}`} className="text-xs text-slate-400 hover:text-brand-600">{member.phone}</a>}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                            <button onClick={() => setViewMember(member)} className="p-1 text-slate-400 hover:text-brand-600"><History className="h-3.5 w-3.5" /></button>
                            <button onClick={() => openEditMember(member)} className="p-1 text-slate-400 hover:text-blue-600"><Edit2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => onDeleteMember(group.id, member.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                    </div>
                  </td>
                  {dates.map(date => {
                      const status = member.attendance[date];
                      return (
                        <td key={date} className="px-1 py-1 text-center p-0">
                            <button 
                                onClick={() => {
                                    // Cycle: Empty -> P -> A -> Empty
                                    const nextStatus = status === 'P' ? 'A' : status === 'A' ? '' : 'P';
                                    onMarkAttendance(group.id, member.id, date, nextStatus);
                                }}
                                className="w-full h-full flex items-center justify-center py-2 focus:outline-none"
                            >
                                <div className={clsx("inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-all transform active:scale-95", status === 'P' ? "bg-green-100 text-green-700" : status === 'A' ? "bg-red-100 text-red-700" : "bg-slate-50 text-slate-300 hover:bg-slate-100")}>
                                    {status === 'P' ? <Check className="h-4 w-4" /> : status === 'A' ? <X className="h-4 w-4" /> : <Minus className="h-3 w-3" />}
                                </div>
                            </button>
                        </td>
                      );
                  })}
                  <td className="bg-slate-50/50"></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 sticky bottom-0 z-20 shadow-[0_-2px_5px_-2px_rgba(0,0,0,0.1)]">
                <tr>
                    <td className="sticky left-0 z-20 bg-slate-100 px-4 py-3 text-xs font-bold text-slate-600 uppercase border-r border-slate-200">
                        Total Present
                    </td>
                    {dates.map(date => {
                        const count = group.members.filter(m => m.attendance[date] === 'P').length;
                        return (
                            <td key={date} className="px-2 py-3 text-center">
                                <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full", count > 0 ? "bg-green-200 text-green-800" : "text-slate-400")}>
                                    {count}
                                </span>
                            </td>
                        );
                    })}
                     <td className="bg-slate-100"></td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Session Modal */}
      {isAddSessionOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsAddSessionOpen(false)}>
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleNewSessionSubmit}>
                   <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <CalendarPlus className="h-5 w-5 text-brand-600" />
                            <h3 className="text-lg font-bold text-slate-900">Add New Session</h3>
                        </div>
                        <button type="button" onClick={() => setIsAddSessionOpen(false)} className="p-2 text-slate-400"><X className="w-5 h-5" /></button>
                   </div>
                   <div className="p-5 space-y-4">
                       <p className="text-sm text-slate-500">Select the date for the new attendance column. This will be added to all groups.</p>
                       <div>
                           <label className="block text-sm font-bold text-slate-700 mb-1">Session Date</label>
                           <input 
                                type="date" 
                                required 
                                value={newSessionDate}
                                onChange={e => setNewSessionDate(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                           />
                       </div>
                       <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all">Create Session</button>
                   </div>
                </form>
              </div>
           </div>
      )}

      {/* Bulk Action / Sort Modal */}
      {actionDate && !isSessionMode && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setActionDate(null)}>
            <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase">Date Options</span>
                        <span className="text-lg font-bold text-slate-900">{new Date(actionDate).toLocaleDateString()}</span>
                    </div>
                    <button onClick={() => setActionDate(null)} className="p-2 bg-white rounded-full border border-slate-200 text-slate-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4 space-y-3">
                    {/* Session Mode Launcher */}
                    <button 
                        onClick={() => setIsSessionMode(true)}
                        className="w-full flex items-center justify-between p-4 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all mb-4 group"
                    >
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-white/20 rounded-lg">
                                <Zap className="h-5 w-5 text-white" />
                             </div>
                             <div className="text-left">
                                 <p className="font-bold text-sm">Focus Session Mode</p>
                                 <p className="text-[10px] text-indigo-200">Mobile-friendly marking</p>
                             </div>
                         </div>
                         <ChevronRight className="h-5 w-5 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <button onClick={() => handleSort('present')} className={clsx("flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all", sortConfig?.type === 'present' ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-slate-200 text-slate-600")}>
                            <ArrowDown className="h-3.5 w-3.5" /> Present First
                        </button>
                        <button onClick={() => handleSort('absent')} className={clsx("flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all", sortConfig?.type === 'absent' ? "bg-red-50 border-red-500 text-red-700" : "bg-white border-slate-200 text-slate-600")}>
                            <ArrowDown className="h-3.5 w-3.5" /> Absent First
                        </button>
                    </div>
                    <div className="h-px bg-slate-100 my-2" />
                    <button onClick={() => handleBulkAction('P')} className="w-full flex items-center justify-between p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 font-bold">
                        <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Mark All Present</span>
                        <span className="text-xs opacity-50">P</span>
                    </button>
                    <button onClick={() => handleBulkAction('A')} className="w-full flex items-center justify-between p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 font-bold">
                        <span className="flex items-center gap-2"><XCircle className="w-5 h-5" /> Mark All Absent</span>
                        <span className="text-xs opacity-50">A</span>
                    </button>
                    <button onClick={() => handleBulkAction('')} className="w-full p-3 text-slate-500 text-sm font-medium hover:bg-slate-50 rounded-lg transition-colors">Clear All</button>
                </div>
            </div>
        </div>
      )}

      {/* Full Screen Session Mode */}
      {isSessionMode && actionDate && (
          <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300">
             {/* Session Header */}
             <div className="bg-white px-4 py-4 border-b border-slate-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsSessionMode(false)} className="p-2 hover:bg-slate-100 rounded-full">
                        <ChevronLeft className="h-6 w-6 text-slate-600" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 leading-none">Session Marking</h2>
                        <p className="text-xs text-slate-500 mt-1">{new Date(actionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-brand-600">
                        {group.members.filter(m => m.attendance[actionDate] === 'P').length}
                        <span className="text-sm text-slate-400 font-medium">/{group.members.length}</span>
                    </p>
                </div>
             </div>
             
             {/* Progress Bar */}
             <div className="h-1.5 w-full bg-slate-100">
                <div 
                    className="h-full bg-brand-500 transition-all duration-300" 
                    style={{ width: `${(group.members.filter(m => m.attendance[actionDate] !== '' && m.attendance[actionDate] !== undefined).length / group.members.length) * 100}%` }}
                />
             </div>

             {/* Scrollable List */}
             <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {filteredMembers.map(member => {
                     const status = member.attendance[actionDate];
                     return (
                         <div key={member.id} className={clsx("flex items-center justify-between p-4 rounded-xl border-2 transition-all", status === 'P' ? "bg-green-50 border-green-500" : status === 'A' ? "bg-red-50 border-red-500" : "bg-white border-white shadow-sm")}>
                             <div>
                                 <p className="font-bold text-slate-900 text-lg">{member.name}</p>
                                 {member.phone && <p className="text-xs text-slate-500">{member.phone}</p>}
                             </div>
                             <div className="flex items-center gap-2">
                                 <button 
                                    onClick={() => onMarkAttendance(group.id, member.id, actionDate, 'P')}
                                    className={clsx("h-12 w-12 rounded-full flex items-center justify-center font-bold transition-all", status === 'P' ? "bg-green-600 text-white shadow-lg scale-110" : "bg-slate-100 text-slate-300 hover:bg-green-100 hover:text-green-600")}
                                 >
                                     P
                                 </button>
                                 <button 
                                    onClick={() => onMarkAttendance(group.id, member.id, actionDate, 'A')}
                                    className={clsx("h-12 w-12 rounded-full flex items-center justify-center font-bold transition-all", status === 'A' ? "bg-red-600 text-white shadow-lg scale-110" : "bg-slate-100 text-slate-300 hover:bg-red-100 hover:text-red-600")}
                                 >
                                     A
                                 </button>
                             </div>
                         </div>
                     );
                 })}
                 <div className="h-20" /> {/* Spacer */}
             </div>
             
             {/* Footer Actions */}
             <div className="bg-white border-t border-slate-200 p-4 safe-area-pb">
                 <button 
                    onClick={() => setIsSessionMode(false)}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all"
                 >
                     Done Marking
                 </button>
             </div>
          </div>
      )}

      {/* Add/Edit Member Modal */}
      {isAddMemberOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsAddMemberOpen(false)}>
             <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleMemberSubmit}>
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2">
                             <div className="bg-brand-600 p-1.5 rounded-lg text-white">
                                <UserPlus className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{editingMember ? 'Edit Member' : 'New Member'}</h3>
                        </div>
                        <button type="button" onClick={() => setIsAddMemberOpen(false)} className="p-2 text-slate-400"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                            <input required value={memberFormData.name} onChange={e => setMemberFormData({...memberFormData, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. John Doe" autoFocus />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Phone (Optional)</label>
                            <input type="tel" value={memberFormData.phone} onChange={e => setMemberFormData({...memberFormData, phone: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. 9876543210" />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]">
                            {editingMember ? 'Update Member' : 'Add to Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* History Modal */}
      {viewMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setViewMember(null)}>
             <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                         <div className="bg-brand-100 p-2 rounded-full text-brand-600"><User className="h-5 w-5" /></div>
                        <div><h3 className="text-lg font-bold text-slate-900">{viewMember.name}</h3><p className="text-xs text-slate-500">Attendance History</p></div>
                    </div>
                    <button onClick={() => setViewMember(null)} className="p-2 bg-white rounded-full border border-slate-200 text-slate-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="overflow-y-auto p-4 space-y-2">
                    {dates.map(date => {
                        const status = viewMember.attendance[date];
                        const d = new Date(date);
                        return (
                            <div key={date} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white">
                                <span className="text-sm font-bold text-slate-700">{d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                <span className={clsx("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", status === 'P' ? "bg-green-50 text-green-700 border-green-200" : status === 'A' ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-400 border-slate-200")}>
                                    {status === 'P' ? 'Present' : status === 'A' ? 'Absent' : 'No Record'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;