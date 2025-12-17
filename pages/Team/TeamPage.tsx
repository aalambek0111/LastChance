import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Mail,
  Shield,
  Clock,
  X,
  Trash2,
  CheckCircle2,
  Briefcase,
  Ban,
  MoreHorizontal,
  ChevronRight,
  AlertTriangle,
  Save,
  Phone,
  Camera,
  Filter,
  User,
  // Fix: Added RefreshCw to the imports
  RefreshCw
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';

// --- Types & Constants ---
type MemberStatus = 'Active' | 'Invited' | 'Suspended';
type SystemRole = 'Owner' | 'Admin' | 'Manager' | 'Limited';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: SystemRole;
  jobTitle: string;
  status: MemberStatus;
  lastActive?: string;
  joinedAt: string;
  avatarUrl?: string;
}

const INITIAL_TEAM: TeamMember[] = [
  { id: 1, name: 'Alex Walker', email: 'alex@wanderlust.com', phone: '+1 (555) 123-4567', role: 'Owner', jobTitle: 'Founder', status: 'Active', lastActive: '5 mins ago', joinedAt: 'Oct 12, 2022' },
  { id: 2, name: 'Sarah Miller', email: 'sarah@wanderlust.com', role: 'Manager', jobTitle: 'Operations Lead', status: 'Active', lastActive: '1 hour ago', joinedAt: 'Jan 15, 2023' },
  { id: 3, name: 'Mike Johnson', email: 'mike@wanderlust.com', role: 'Limited', jobTitle: 'Seasonal Guide', status: 'Active', lastActive: '2 days ago', joinedAt: 'Mar 10, 2023' },
  { id: 4, name: 'Emily Davis', email: 'emily@wanderlust.com', role: 'Admin', jobTitle: 'Product Manager', status: 'Invited', lastActive: undefined, joinedAt: 'Pending' },
];

const ROLE_CONFIG: Record<SystemRole, { label: string, color: string, desc: string }> = {
  Owner: { label: 'Owner', color: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800', desc: 'Full control over billing and settings.' },
  Admin: { label: 'Admin', color: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800', desc: 'Can manage team members and data.' },
  Manager: { label: 'Manager', color: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800', desc: 'Can manage tours and bookings.' },
  Limited: { label: 'Limited', color: 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700', desc: 'View only access to assigned items.' },
};

// --- Helpers ---
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

const TeamPage: React.FC = () => {
  const { t } = useI18n();
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_TEAM);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [members, search]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSaving(true);
    setTimeout(() => {
      setMembers(prev => prev.map(m => m.id === editingMember.id ? editingMember : m));
      setEditingMember(null);
      setIsSaving(false);
    }, 600);
  };

  const handleDelete = (id: number) => {
    if (confirm("Remove this member from workspace?")) {
      setMembers(prev => prev.filter(m => m.id !== id));
      setEditingMember(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto h-full overflow-y-auto space-y-8">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('page_team_title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage users, permissions, and roles for your agency.</p>
        </div>
        <button 
          onClick={() => {}} 
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or role..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Filter className="w-4 h-4" /> All Roles
          </button>
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Access / Role</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredMembers.map((m) => (
                <tr 
                  key={m.id} 
                  onClick={() => setEditingMember({...m})}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-xs text-gray-500 overflow-hidden border border-gray-200 dark:border-gray-600">
                        {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : initials(m.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 dark:text-white truncate text-sm">{m.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${ROLE_CONFIG[m.role].color}`}>
                        {m.role}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">{m.jobTitle}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                       <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${m.status === 'Active' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                         <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                         {m.status}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{m.joinedAt}</div>
                    <div className="text-[10px] text-gray-400">{m.lastActive || 'Never'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MEMBER EDIT MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setEditingMember(null)} />
          
          <form 
            onSubmit={handleSave}
            className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs text-white ${editingMember.id === 1 ? 'bg-indigo-600' : 'bg-gray-400'}`}>
                  {initials(editingMember.name)}
                </div>
                {editingMember.name}
              </h3>
              <button onClick={() => setEditingMember(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              
              {/* Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input 
                    required
                    value={editingMember.name} 
                    onChange={e => setEditingMember({...editingMember, name: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Job Title</label>
                  <input 
                    value={editingMember.jobTitle} 
                    onChange={e => setEditingMember({...editingMember, jobTitle: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="email"
                      value={editingMember.email} 
                      onChange={e => setEditingMember({...editingMember, email: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                    <input 
                      value={editingMember.phone || ''} 
                      onChange={e => setEditingMember({...editingMember, phone: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Role Picker */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Select Permission Level</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(['Owner', 'Admin', 'Manager', 'Limited'] as SystemRole[]).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setEditingMember({...editingMember, role})}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative ${editingMember.role === role ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                    >
                      {editingMember.role === role && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-indigo-600" />}
                      <div className="font-bold text-gray-900 dark:text-white mb-1">{role}</div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">{ROLE_CONFIG[role].desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              {editingMember.id !== 1 && (
                <div className="pt-8 border-t border-gray-100 dark:border-gray-700 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-widest px-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Security Actions
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      type="button"
                      onClick={() => setEditingMember({...editingMember, status: editingMember.status === 'Suspended' ? 'Active' : 'Suspended'})}
                      className="flex-1 py-3 px-4 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold border border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      {editingMember.status === 'Suspended' ? 'Activate Member' : 'Suspend Member'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDelete(editingMember.id)}
                      className="flex-1 py-3 px-4 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/30 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Member
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3 z-10 sticky bottom-0">
               <button 
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
               >
                 Cancel
               </button>
               <button 
                type="submit"
                disabled={isSaving}
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
               >
                 {/* Fix: Usage of RefreshCw from lucide-react */}
                 {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Save Details
               </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeamPage;