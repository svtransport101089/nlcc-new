import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import GroupList from './components/GroupList';
import GroupDetail from './components/GroupDetail';
import MembersList from './components/MembersList';
import Reports from './components/Reports';
import { parseData, calculateStats } from './services/dataProcessor';
import { Group, AttendanceStatus, Member } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedMonthRange, setSelectedMonthRange] = useState<string>('All');
  
  // State for all data with Local Storage Persistence
  const [groups, setGroups] = useState<Group[]>(() => {
    try {
      const saved = localStorage.getItem('youthlink_groups_v1');
      return saved ? JSON.parse(saved) : parseData();
    } catch (e) {
      console.error("Failed to load from local storage", e);
      return parseData();
    }
  });

  // Persist changes
  useEffect(() => {
    localStorage.setItem('youthlink_groups_v1', JSON.stringify(groups));
  }, [groups]);

  // Derive stats
  const stats = useMemo(() => calculateStats(groups), [groups]);

  // Extract all unique month ranges
  const monthRanges = useMemo(() => {
    const ranges = new Set(groups.map(g => g.monthRange));
    return Array.from(ranges).sort();
  }, [groups]);

  // Filter groups
  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
        const matchesSearch = g.leaderName.toLowerCase().includes(globalSearch.toLowerCase());
        const matchesMonth = selectedMonthRange === 'All' || g.monthRange === selectedMonthRange;
        return matchesSearch && matchesMonth;
    });
  }, [groups, globalSearch, selectedMonthRange]);

  // --- CRUD Handlers ---

  const handleGroupSelect = (groupId: string) => setSelectedGroupId(groupId);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'groups') setSelectedGroupId(null);
    setGlobalSearch('');
  };

  const handleResetData = () => {
      if(confirm("WARNING: This will erase all your changes and restore the original dataset. Are you sure?")) {
          localStorage.removeItem('youthlink_groups_v1');
          setGroups(parseData());
          window.location.reload();
      }
  };

  // Group CRUD
  const handleAddGroup = (leader: string, coLeader: string, range: string) => {
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      leaderName: leader,
      coLeaderName: coLeader,
      monthRange: range,
      members: []
    };
    setGroups(prev => [newGroup, ...prev]);
  };

  const handleUpdateGroup = (groupId: string, leader: string, coLeader: string, range: string) => {
    setGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, leaderName: leader, coLeaderName: coLeader, monthRange: range } : g
    ));
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm("Are you sure you want to delete this entire group? This action cannot be undone.")) {
      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (selectedGroupId === groupId) setSelectedGroupId(null);
    }
  };

  // Member CRUD
  const handleAddMember = (groupId: string, name: string, phone: string) => {
    setGroups(prevGroups => prevGroups.map(group => {
      if (group.id !== groupId) return group;
      const newMember: Member = {
        id: `mem-${Date.now()}`,
        name,
        phone,
        attendance: {}
      };
      // Initialize attendance for existing dates
      // Find global dates to ensure consistency
      const allDates = new Set<string>();
      prevGroups.forEach(g => g.members.forEach(m => Object.keys(m.attendance).forEach(d => allDates.add(d))));
      Array.from(allDates).forEach(d => newMember.attendance[d] = '');
      
      return { ...group, members: [newMember, ...group.members] };
    }));
  };

  const handleUpdateMember = (groupId: string, memberId: string, name: string, phone: string) => {
    setGroups(prevGroups => prevGroups.map(group => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        members: group.members.map(m => m.id === memberId ? { ...m, name, phone } : m)
      };
    }));
  };

  const handleDeleteMember = (groupId: string, memberId: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      setGroups(prevGroups => prevGroups.map(group => {
        if (group.id !== groupId) return group;
        return { ...group, members: group.members.filter(m => m.id !== memberId) };
      }));
    }
  };

  // Attendance Handlers
  const handleAddSession = (date: string) => {
     setGroups(prev => prev.map(group => ({
         ...group,
         members: group.members.map(member => ({
             ...member,
             attendance: { ...member.attendance, [date]: '' }
         }))
     })));
  };

  const handleBulkUpdate = (groupId: string, date: string, status: AttendanceStatus) => {
    setGroups(prevGroups => prevGroups.map(group => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        members: group.members.map(member => ({
          ...member,
          attendance: { ...member.attendance, [date]: status }
        }))
      };
    }));
  };

  const handleMarkAttendance = (groupId: string, memberId: string, date: string, status: AttendanceStatus) => {
      setGroups(prevGroups => prevGroups.map(group => {
          if (group.id !== groupId) return group;
          return {
              ...group,
              members: group.members.map(member => {
                  if (member.id !== memberId) return member;
                  return {
                      ...member,
                      attendance: { ...member.attendance, [date]: status }
                  };
              })
          };
      }));
  };

  const selectedGroup = useMemo(() => 
    groups.find(g => g.id === selectedGroupId), 
  [groups, selectedGroupId]);

  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        onSearch={setGlobalSearch}
    >
      {activeTab === 'dashboard' && (
        <Dashboard stats={stats} />
      )}

      {activeTab === 'groups' && !selectedGroupId && (
        <GroupList 
            groups={filteredGroups} 
            onSelectGroup={handleGroupSelect} 
            monthRanges={monthRanges}
            selectedMonthRange={selectedMonthRange}
            onSelectMonthRange={setSelectedMonthRange}
            onAddGroup={handleAddGroup}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
        />
      )}

      {activeTab === 'groups' && selectedGroup && (
        <GroupDetail 
            group={selectedGroup} 
            onBack={() => setSelectedGroupId(null)}
            allGroups={groups}
            onBulkUpdate={handleBulkUpdate}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onAddSession={handleAddSession}
            onMarkAttendance={handleMarkAttendance}
        />
      )}

      {activeTab === 'members' && (
        <MembersList 
            groups={groups} // Pass all groups to allow adding to any group
            searchQuery={globalSearch}
            monthRanges={monthRanges}
            selectedMonthRange={selectedMonthRange}
            onSelectMonthRange={setSelectedMonthRange}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
        />
      )}

      {activeTab === 'reports' && (
        <Reports groups={groups} onResetData={handleResetData} />
      )}
    </Layout>
  );
};

export default App;