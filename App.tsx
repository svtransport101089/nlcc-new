import React, { useState, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import GroupList from './components/GroupList';
import GroupDetail from './components/GroupDetail';
import MembersList from './components/MembersList';
import { parseData, calculateStats } from './services/dataProcessor';
import { Group, AttendanceStatus, Member } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedMonthRange, setSelectedMonthRange] = useState<string>('All');
  
  // Initialize data directly
  const [groups, setGroups] = useState<Group[]>(() => parseData());

  // Derive stats from current groups state
  const stats = useMemo(() => calculateStats(groups), [groups]);

  // Extract all unique month ranges
  const monthRanges = useMemo(() => {
    const ranges = new Set(groups.map(g => g.monthRange));
    return Array.from(ranges).sort();
  }, [groups]);

  // Filter groups based on search and selected month range
  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
        const matchesSearch = g.leaderName.toLowerCase().includes(globalSearch.toLowerCase());
        const matchesMonth = selectedMonthRange === 'All' || g.monthRange === selectedMonthRange;
        return matchesSearch && matchesMonth;
    });
  }, [groups, globalSearch, selectedMonthRange]);

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'groups') {
      setSelectedGroupId(null);
    }
    setGlobalSearch('');
  };

  const handleBulkUpdate = (groupId: string, date: string, status: AttendanceStatus) => {
    setGroups(prevGroups => 
      prevGroups.map(group => {
        if (group.id !== groupId) return group;

        const updatedMembers = group.members.map(member => ({
          ...member,
          attendance: {
            ...member.attendance,
            [date]: status
          }
        }));

        return {
          ...group,
          members: updatedMembers
        };
      })
    );
  };

  const handleAddMember = (groupId: string, name: string, phone: string) => {
    setGroups(prevGroups => 
      prevGroups.map(group => {
        if (group.id !== groupId) return group;

        const newMember: Member = {
          id: `${groupId}-${name}-${Date.now()}`,
          name,
          phone,
          attendance: {} // Initialize empty attendance
        };

        return {
          ...group,
          members: [newMember, ...group.members] // Add to top of list
        };
      })
    );
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
        />
      )}

      {activeTab === 'groups' && selectedGroup && (
        <GroupDetail 
            group={selectedGroup} 
            onBack={() => setSelectedGroupId(null)}
            allGroups={groups}
            onBulkUpdate={handleBulkUpdate}
            onAddMember={handleAddMember}
        />
      )}

      {activeTab === 'members' && (
        <MembersList 
            groups={filteredGroups} 
            searchQuery={globalSearch}
            monthRanges={monthRanges}
            selectedMonthRange={selectedMonthRange}
            onSelectMonthRange={setSelectedMonthRange}
        />
      )}
    </Layout>
  );
};

export default App;