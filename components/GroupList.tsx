import React, { useState } from 'react';
import { Group } from '../types';
import { Users, ChevronRight, User, Filter, Plus, Edit2, Trash2, X, Settings } from 'lucide-react';
import clsx from 'clsx';

interface GroupListProps {
  groups: Group[];
  onSelectGroup: (groupId: string) => void;
  monthRanges: string[];
  selectedMonthRange: string;
  onSelectMonthRange: (range: string) => void;
  onAddGroup: (leader: string, coLeader: string, range: string) => void;
  onUpdateGroup: (id: string, leader: string, coLeader: string, range: string) => void;
  onDeleteGroup: (id: string) => void;
}

const GroupList: React.FC<GroupListProps> = ({ 
    groups, 
    onSelectGroup, 
    monthRanges, 
    selectedMonthRange, 
    onSelectMonthRange,
    onAddGroup,
    onUpdateGroup,
    onDeleteGroup
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  
  const [formData, setFormData] = useState({
    leaderName: '',
    coLeaderName: '',
    monthRange: ''
  });

  const openAdd = () => {
    setEditingGroup(null);
    setFormData({ leaderName: '', coLeaderName: '', monthRange: monthRanges[0] || 'JANUARY 2026 - APRIL 2026' });
    setIsFormOpen(true);
  };

  const openEdit = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    setEditingGroup(group);
    setFormData({ 
      leaderName: group.leaderName, 
      coLeaderName: group.coLeaderName || '', 
      monthRange: group.monthRange 
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      onUpdateGroup(editingGroup.id, formData.leaderName, formData.coLeaderName, formData.monthRange);
    } else {
      onAddGroup(formData.leaderName, formData.coLeaderName, formData.monthRange);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">Groups</h2>
            <span className="text-sm bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
            {groups.length} Active
            </span>
        </div>

        <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-slate-500" />
                </div>
                <select
                    value={selectedMonthRange}
                    onChange={(e) => onSelectMonthRange(e.target.value)}
                    className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-9 pr-10 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium shadow-sm w-full sm:w-auto cursor-pointer"
                >
                    <option value="All">All Periods</option>
                    {monthRanges.map(range => <option key={range} value={range}>{range}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>

            <button 
                onClick={openAdd}
                className="bg-brand-600 text-white p-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2 px-4"
            >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-bold">New Group</span>
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div 
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            className="group bg-white rounded-xl shadow-sm border border-slate-200 p-5 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all duration-200 relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <div className="min-w-0 pr-12">
                <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">{group.leaderName}</h3>
                <div className="flex items-center text-sm text-slate-500 mb-3">
                  <User className="h-3 w-3 mr-1" />
                  {group.coLeaderName ? `Co: ${group.coLeaderName}` : 'No Co-Leader'}
                </div>
              </div>
              <div className="flex flex-col gap-2 absolute top-4 right-4 translate-x-2 group-hover:translate-x-0 transition-transform opacity-0 group-hover:opacity-100 duration-200">
                <button 
                    onClick={(e) => openEdit(e, group)}
                    className="p-1.5 bg-slate-50 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-slate-200"
                >
                    <Edit2 className="h-4 w-4" />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteGroup(group.id); }}
                    className="p-1.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-2 flex items-center justify-between">
              <div className="flex items-center text-slate-600">
                <Users className="h-4 w-4 mr-1.5" />
                <span className="text-sm font-medium">{group.members.length} Members</span>
              </div>
              <span className="text-xs text-slate-400 font-mono font-bold px-2 py-0.5 bg-slate-50 rounded border border-slate-100">
                {group.monthRange.substring(0, 3)} - {group.monthRange.slice(-4)}
              </span>
            </div>
          </div>
        ))}
        {groups.length === 0 && (
             <div className="col-span-full p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                 No groups found for the selected filter.
             </div>
        )}
      </div>

      {/* Group Form Modal */}
      {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsFormOpen(false)}>
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-3">
                             <div className="bg-brand-600 p-2 rounded-lg text-white">
                                <Settings className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{editingGroup ? 'Edit Group' : 'Create New Group'}</h3>
                        </div>
                        <button type="button" onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Leader Name</label>
                            <input 
                                required
                                value={formData.leaderName}
                                onChange={e => setFormData({...formData, leaderName: e.target.value})}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                placeholder="Enter leader name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Co-Leader Name (Optional)</label>
                            <input 
                                value={formData.coLeaderName}
                                onChange={e => setFormData({...formData, coLeaderName: e.target.value})}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                placeholder="Enter co-leader name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Period / Month Range</label>
                            <input 
                                required
                                value={formData.monthRange}
                                onChange={e => setFormData({...formData, monthRange: e.target.value})}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                placeholder="e.g. MAY 2026 - AUG 2026"
                            />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]">
                            {editingGroup ? 'Save Changes' : 'Create Group'}
                        </button>
                    </div>
                </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default GroupList;