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
  Filter,
  User,
  RefreshCw,
  MoreVertical,
  Activity,
  Users,
  ShieldCheck,
  Eye,
  Loader2
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';

// --- Types & Constants ---
type MemberStatus = 'Active' | 'Invited' | 'Suspended';
type SystemRole = 'Owner' | 'Admin' | 'Manager' | 'Limited' | 'Read Only';

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
  { id: 2, name: 'Sarah Miller', email: 'sarah@wanderlust.com', phone: '+1 (555) 987-6543', role: 'Manager', jobTitle: 'Operations Lead', status: 'Active', lastActive: '1 hour ago', joinedAt: 'Jan 15, 2023' },
  { id: 3, name: 'Mike Johnson', email: 'mike@wanderlust.com', phone: '+1 (555) 444-2211', role: 'Limited', jobTitle: 'Seasonal Guide', status: 'Active', lastActive: '2 days ago', joinedAt: 'Mar 10, 2023' },
  { id: 4, name: 'Emily Davis', email: 'emily@wanderlust.com', role: 'Admin', jobTitle: 'Product Manager', status: 'Invited', lastActive: undefined, joinedAt: 'Pending' },
  { id: 5, name: 'David Chen', email: 'david@wanderlust.com', role: 'Read Only', jobTitle: 'Accounting Intern', status: 'Active', lastActive: '4 days ago', joinedAt: 'Sep 05, 2023' },
];

const ROLE_CONFIG: Record<SystemRole, { label: string, color: string, desc: string, icon: any }> = {
  Owner: { label: 'Owner', color: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800', desc: 'Full system control & billing access.', icon: ShieldCheck },
  Admin: { label: 'Admin', color: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800', desc: 'Can manage team and settings.', icon: Shield },
  Manager: { label: 'Manager', color: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800', desc: 'Full tour & booking management.', icon: Briefcase },
  Limited: { label: 'Limited', color: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30', desc: 'Only access to assigned bookings.', icon: User },
  'Read Only': { label: 'Read Only', color: 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', desc: 'View records only. Cannot edit.', icon: Eye },
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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [members, search]);

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter(m => m.status === 'Active').length,
    pending: members.filter(m => m.status === 'Invited').length,
  }), [members]);

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
    if (confirm("Remove this member?")) {
      setMembers(prev => prev.filter(m => m.id !== id));
      setEditingMember(null);
    }
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col">
      {/* Header Area */}
      <div className="flex-none p-6 lg:px-10 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('page_team_title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <Users className="w-4 h-4" /> {stats.active} active members • {stats.pending} pending invites
            </p>
          </div>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        </div>
      </div>

      {/* Main Workspace: Split Layout */}
      <div className="flex-1 overflow-hidden flex max-w-[1600px] mx-auto w-full">
        
        {/* LEFT: MEMBER LIST (70%) */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex gap-3">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search team..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredMembers.map((m) => (
                  <tr 
                    key={m.id} 
                    onClick={() => setEditingMember({...m})}
                    className="hover:bg-gray-50 dark:hover:bg-indigo-900/5 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 overflow-hidden">
                          {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : initials(m.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 dark:text-white truncate text-sm">{m.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${ROLE_CONFIG[m.role].color}`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {m.phone || <span className="italic opacity-40">Not set</span>}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${m.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                         <span className={`w-1 h-1 rounded-full ${m.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                         {m.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-all">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: INSIGHTS SIDEBAR (30%) */}
        <div className="hidden lg:flex flex-col w-[380px] flex-none bg-gray-50/50 dark:bg-gray-900/50 p-8 space-y-10 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Team Performance</h3>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Utilization Rate</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">82%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full w-[82%]" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                   <div className="text-xl font-bold text-gray-900 dark:text-white">14</div>
                   <div className="text-[10px] font-bold text-gray-400 uppercase">Tours Today</div>
                </div>
                <div>
                   <div className="text-xl font-bold text-gray-900 dark:text-white">2</div>
                   <div className="text-[10px] font-bold text-gray-400 uppercase">Guides Off</div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
             <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
             <ShieldCheck className="w-8 h-8 mb-4 opacity-80" />
             <h4 className="font-bold text-lg mb-2">Role Permissions</h4>
             <p className="text-xs text-indigo-100 leading-relaxed mb-4">
               Manage detailed access levels for each member to secure your business data.
             </p>
             <button onClick={() => alert('Accessing permission documentation...')} className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors">
                Read Permission Docs
             </button>
          </div>
        </div>
      </div>

      {/* --- INVITE MODAL --- */}
      {isInviteModalOpen && (
        <InviteMemberModal 
          onClose={() => setIsInviteModalOpen(false)} 
          onInvite={(member) => {
            setMembers([...members, { ...member, id: Date.now(), status: 'Invited', joinedAt: 'Pending' }]);
            setIsInviteModalOpen(false);
          }}
        />
      )}

      {/* --- EDIT MODAL --- */}
      {editingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setEditingMember(null)} />
          <form 
            onSubmit={handleSave}
            className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {initials(editingMember.name)}
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-none">{editingMember.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Profile & Permissions</p>
                 </div>
              </div>
              <button type="button" onClick={() => setEditingMember(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input required value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                  <input type="email" value={editingMember.email} onChange={e => setEditingMember({...editingMember, email: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Permission Role</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(['Owner', 'Admin', 'Manager', 'Limited', 'Read Only'] as SystemRole[]).map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setEditingMember({...editingMember, role})}
                        className={`p-4 rounded-2xl border-2 text-left transition-all relative ${editingMember.role === role ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-gray-700'}`}
                      >
                        {editingMember.role === role && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-indigo-600" />}
                        <div className="flex items-center gap-2 mb-1">
                           {React.createElement(ROLE_CONFIG[role].icon, { className: "w-4 h-4 text-indigo-500" })}
                           <span className="font-bold text-gray-900 dark:text-white">{role}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-tight">{ROLE_CONFIG[role].desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between gap-4">
               <button type="button" onClick={() => handleDelete(editingMember.id)} className="px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl">Remove Member</button>
               <div className="flex gap-4">
                  <button type="button" onClick={() => setEditingMember(null)} className="px-6 py-2.5 text-sm font-bold text-gray-500">Discard</button>
                  <button type="submit" disabled={isSaving} className="px-10 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
               </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const InviteMemberModal = ({ onClose, onInvite }: { onClose: () => void, onInvite: (m: any) => void }) => {
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Manager' as SystemRole, jobTitle: '' });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      onInvite(formData);
      setIsSending(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Invite Team Member</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
           <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm" placeholder="John Doe" />
           </div>
           <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm" placeholder="john@example.com" />
           </div>
           <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">System Role</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as SystemRole})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none">
                 <option value="Manager">Manager</option>
                 <option value="Admin">Admin</option>
                 <option value="Limited">Limited Access</option>
                 <option value="Read Only">Read Only</option>
              </select>
           </div>
        </div>
        <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50 flex gap-3">
           <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500">Cancel</button>
           <button type="submit" disabled={isSending} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
             {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
             Send Invite
           </button>
        </div>
      </form>
    </div>
  );
};

export default TeamPage;