import React, { useMemo, useState } from 'react';
import { Group, Member } from '../types';
import { User, Phone, Users, Filter, Edit2, Trash2, UserPlus, X, Search } from 'lucide-react';
import clsx from 'clsx';

interface MembersListProps {
  groups: Group[];
  searchQuery?: string;
  monthRanges: string[];
  selectedMonthRange: string;
  onSelectMonthRange: (range: string) => void;
  onAddMember: (groupId: string, name: string, phone: string) => void;
  onUpdateMember: (groupId: string, memberId: string, name: string, phone: string) => void;
  onDeleteMember: (groupId: string, memberId: string) => void;
}

const MembersList: React.FC<MembersListProps> = ({ 
    groups, 
    searchQuery = '', 
    monthRanges, 
    selectedMonthRange, 
    onSelectMonthRange,
    onAddMember,
    onUpdateMember,
    onDeleteMember
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<{ id: string, groupId: string, name: string, phone: string } | null>(null);
  const [formData, setFormData] = useState({ groupId: '', name: '', phone: '' });

  const allMembers = useMemo(() => {
    return groups.flatMap(g => 
      g.members.map(m => ({ 
          ...m, 
          groupId: g.id,
          groupName: g.leaderName, 
          monthRange: g.monthRange 
      }))
    ).filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery);
        const matchesFilter = selectedMonthRange === 'All' || m.monthRange === selectedMonthRange;
        return matchesSearch && matchesFilter;
    });
  }, [groups, searchQuery, selectedMonthRange]);

  const handleEdit = (member: any) => {
      setEditingMember(member);
      setFormData({ groupId: member.groupId, name: member.name, phone: member.phone });
      setIsModalOpen(true);
  };

  const handleAdd = () => {
      setEditingMember(null);
      // Default to first group if available
      setFormData({ groupId: groups[0]?.id || '', name: '', phone: '' });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.groupId) return; // Should allow user to pick group
      
      if (editingMember) {
          onUpdateMember(editingMember.groupId, editingMember.id, formData.name, formData.phone);
      } else {
          onAddMember(formData.groupId, formData.name, formData.phone);
      }
      setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 animate-fade-in relative">
       {/* Header Toolbar */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 md:static z-10">
         <div className="flex items-center gap-3">
            <div className="bg-brand-100 p-2 rounded-lg text-brand-600">
                <Users className="h-5 w-5" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Member Directory</h2>
                <p className="text-sm text-slate-500">{allMembers.length} Members Total</p>
            </div>
         </div>

         <div className="flex flex-col sm:flex-row gap-3">
            {/* Filter Dropdown */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-slate-500" />
                </div>
                <select
                    value={selectedMonthRange}
                    onChange={(e) => onSelectMonthRange(e.target.value)}
                    className="w-full sm:w-auto appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-9 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium shadow-sm cursor-pointer"
                >
                    <option value="All">All Periods</option>
                    {monthRanges.map(range => (
                        <option key={range} value={range}>{range}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>

            <button 
                onClick={handleAdd}
                disabled={groups.length === 0}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <UserPlus className="h-4 w-4" />
                <span>Add Member</span>
            </button>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                        <th className="px-6 py-4 text-left">Member</th>
                        <th className="px-6 py-4 text-left">Group</th>
                        <th className="px-6 py-4 text-left">Contact</th>
                        <th className="px-6 py-4 text-left">Period</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {allMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 font-bold text-sm border border-brand-100">
                                {member.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-slate-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-2 text-slate-600">
                             <Users className="h-3.5 w-3.5 text-slate-400" />
                             <span className="text-sm font-medium">{member.groupName}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                          {member.phone ? (
                             <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                <a href={`tel:${member.phone}`} className="text-sm text-slate-600 hover:text-brand-600 hover:underline">{member.phone}</a>
                             </div>
                          ) : (
                             <span className="text-xs text-slate-400 italic">No contact</span>
                          )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                              {member.monthRange}
                          </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={() => handleEdit(member)}
                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                title="Edit Details"
                             >
                                 <Edit2 className="h-4 w-4" />
                             </button>
                             <button 
                                onClick={() => onDeleteMember(member.groupId, member.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Member"
                             >
                                 <Trash2 className="h-4 w-4" />
                             </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {allMembers.length === 0 && (
                     <tr>
                         <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                             <div className="flex flex-col items-center justify-center gap-2">
                                 <Search className="h-8 w-8 text-slate-300" />
                                 <p>No members found matching your search.</p>
                             </div>
                         </td>
                     </tr>
                  )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)}>
             <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2">
                             <div className="bg-brand-600 p-1.5 rounded-lg text-white">
                                {editingMember ? <Edit2 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{editingMember ? 'Edit Member' : 'New Member'}</h3>
                        </div>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-5 space-y-4">
                        {!editingMember && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Assign to Group</label>
                                <select 
                                    required
                                    value={formData.groupId}
                                    onChange={e => setFormData({...formData, groupId: e.target.value})}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                                >
                                    <option value="" disabled>Select a group...</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.leaderName} ({g.members.length} members)</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                            <input 
                                required 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500" 
                                placeholder="e.g. John Doe" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                            <input 
                                type="tel" 
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})} 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500" 
                                placeholder="e.g. 9876543210" 
                            />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]">
                            {editingMember ? 'Update Member' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default MembersList;