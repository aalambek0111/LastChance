
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  UserPlus,
  Search,
  LayoutGrid,
  List,
  Mail,
  Shield,
  BadgeCheck,
  Clock,
  X,
  Trash2,
  CheckCircle2,
  Briefcase,
  Lock,
  RefreshCw,
  LogOut,
  Ban,
  MoreHorizontal,
  ChevronRight,
  AlertTriangle,
  Save,
  Phone,
  Camera,
  AlertCircle
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';

// --- Types & Constants ---

type MemberStatus = 'Active' | 'Invited' | 'Suspended';
type SystemRole = 'Owner' | 'Admin' | 'Member' | 'Limited';

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
  invitedBy?: string;
  avatarUrl?: string;
  pendingEmail?: string; // New field for email change flow
}

// Mock Data
const INITIAL_TEAM: TeamMember[] = [
  { 
    id: 1, 
    name: 'Alex Walker', 
    email: 'alex@wanderlust.com',
    phone: '+1 (555) 123-4567',
    role: 'Owner', 
    jobTitle: 'Founder',
    status: 'Active', 
    lastActive: '5 mins ago',
    joinedAt: 'Oct 12, 2022'
  },
  { 
    id: 2, 
    name: 'Sarah Miller', 
    email: 'sarah@wanderlust.com',
    role: 'Member', 
    jobTitle: 'Senior Guide',
    status: 'Active', 
    lastActive: '1 hour ago',
    joinedAt: 'Jan 15, 2023',
    invitedBy: 'Alex Walker'
  },
  { 
    id: 3, 
    name: 'Mike Johnson', 
    email: 'mike@wanderlust.com',
    role: 'Limited', 
    jobTitle: 'Driver',
    status: 'Active', 
    lastActive: '2 days ago',
    joinedAt: 'Mar 10, 2023',
    invitedBy: 'Alex Walker'
  },
  { 
    id: 4, 
    name: 'Emily Davis', 
    email: 'emily@wanderlust.com',
    role: 'Admin', 
    jobTitle: 'Operations Manager',
    status: 'Invited', 
    lastActive: undefined,
    joinedAt: 'Pending',
    invitedBy: 'Alex Walker'
  },
];

const ROLE_DEFINITIONS: { role: SystemRole; label: string; description: string; permissions: string[] }[] = [
  { 
    role: 'Owner', 
    label: 'Owner', 
    description: 'Full access including billing and workspace deletion.',
    permissions: ['Billing & Plan', 'Delete Workspace', 'Manage Admins', 'All Data Access']
  },
  { 
    role: 'Admin', 
    label: 'Admin', 
    description: 'Can manage team, settings, and data. No billing access.',
    permissions: ['Manage Team', 'Configure Settings', 'Export Data', 'Delete Records']
  },
  { 
    role: 'Member', 
    label: 'Member', 
    description: 'Standard access. View/Edit leads and bookings.',
    permissions: ['Create/Edit Leads', 'Create/Edit Bookings', 'View Reports', 'No Export']
  },
  { 
    role: 'Limited', 
    label: 'Limited', 
    description: 'Restricted view. Only sees assigned records.',
    permissions: ['View Assigned Bookings', 'Mobile View Only', 'No CRM Access']
  },
];

// --- Helpers ---

function initials(name: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getRoleBadgeColor(role: SystemRole) {
  switch (role) {
    case 'Owner': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    case 'Admin': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    case 'Member': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'Limited': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
}

function getStatusIndicator(status: MemberStatus) {
  switch (status) {
    case 'Active': return <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 shadow-sm" />;
    case 'Invited': return <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse shadow-sm" />;
    case 'Suspended': return <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm" />;
  }
}

// --- Member Detail Panel Component ---

interface MemberDetailPaneProps {
  member: TeamMember;
  currentUserRole: SystemRole; // To enforce RBAC on editing
  onClose: () => void;
  onSave: (id: number, updates: Partial<TeamMember>) => void;
  onDelete: (id: number) => void;
}

const MemberDetailPane: React.FC<MemberDetailPaneProps> = ({ member, currentUserRole, onClose, onSave, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'access'>('profile');
  
  // Local state for form handling (The "Buffer" pattern)
  const [formData, setFormData] = useState<Partial<TeamMember>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when member changes
  useEffect(() => {
    setFormData({ ...member });
    setErrors({});
    setIsDirty(false);
  }, [member]);

  // Handle Input Changes
  const handleChange = (field: keyof TeamMember, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      setIsDirty(JSON.stringify(next) !== JSON.stringify(member));
      return next;
    });
    
    // Clear errors on type
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Validation Logic
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) newErrors.name = "Full name is required";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email?.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Handler
  const handleSave = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Check for Email Change (Mock Logic)
    let finalUpdates = { ...formData };
    if (formData.email !== member.email && member.status === 'Active') {
      // If active user changes email, we don't update immediately in a real app
      // We set a 'pendingEmail' state. For this UI demo, we'll mock that behavior.
      alert(`Security Check: An email verification link has been sent to ${formData.email}. The email will update once verified.`);
      // Revert email display for now, add pending
      finalUpdates.email = member.email;
      finalUpdates.pendingEmail = formData.email;
    }

    onSave(member.id, finalUpdates);
    setIsSaving(false);
    setIsDirty(false);
  };

  // RBAC Checks
  const canEditProfile = currentUserRole === 'Owner' || currentUserRole === 'Admin';
  const canEditRole = currentUserRole === 'Owner' || (currentUserRole === 'Admin' && member.role !== 'Owner');
  const isSelf = member.id === 1; // Mocking current user ID as 1 (Alex)

  return (
    <div className="w-full lg:w-[480px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full absolute inset-0 lg:static z-20 shadow-xl transition-all duration-300">
      
      {/* 1. Header */}
      <div className="flex-none px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Member Details</span>
        <button onClick={() => {
          if (isDirty && !window.confirm("You have unsaved changes. Close anyway?")) return;
          onClose();
        }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Hero Profile */}
      <div className="flex-none p-8 flex flex-col items-center border-b border-gray-100 dark:border-gray-700 relative">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-gray-500 dark:text-gray-300 mb-4 ring-4 ring-white dark:ring-gray-800 shadow-sm overflow-hidden">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              initials(member.name)
            )}
          </div>
          {/* Avatar Upload Overlay */}
          {canEditProfile && (
            <button className="absolute bottom-4 right-0 p-1.5 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition-transform hover:scale-105 active:scale-95" title="Change Avatar">
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">{member.name}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">{member.email}</p>
        
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(member.role)}`}>
            {member.role}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${member.status === 'Active' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
            {member.status}
          </span>
        </div>
      </div>

      {/* 3. Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'profile' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('access')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'access' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Access & Role <Lock className="w-3 h-3" />
        </button>
      </div>

      {/* 4. Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 dark:bg-gray-900/10">
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* General Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Identity</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <input 
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={!canEditProfile}
                    className={`w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800 border rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                  />
                  <UserPlus className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Job Title</label>
                <div className="relative">
                  <input 
                    value={formData.jobTitle}
                    onChange={(e) => handleChange('jobTitle', e.target.value)}
                    disabled={!canEditProfile}
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 my-4" />

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact & Security</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <input 
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={!canEditProfile}
                    className={`w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800 border rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                  />
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                
                {/* Pending Email Warning */}
                {member.pendingEmail && (
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-3 items-start">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Pending Change</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                        Verification sent to {member.pendingEmail}. User must click the link to update.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                <div className="relative">
                  <input 
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={!canEditProfile}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Meta Info */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 space-y-2 mt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Joined {member.joinedAt}</span>
              </div>
              {member.invitedBy && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <BadgeCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Invited by {member.invitedBy}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            {/* Role Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">System Role</label>
              
              {!canEditRole && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-lg flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  You do not have permission to change this user's role.
                </div>
              )}

              <div className="space-y-3">
                {ROLE_DEFINITIONS.map(def => (
                  <div 
                    key={def.role}
                    onClick={() => canEditRole && handleChange('role', def.role)}
                    className={`p-4 rounded-xl border transition-all ${
                      formData.role === def.role
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    } ${canEditRole ? 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600' : 'opacity-60 cursor-not-allowed'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">{def.label}</span>
                      {formData.role === def.role && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{def.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {def.permissions.slice(0, 3).map(p => (
                        <span key={p} className="text-[10px] bg-gray-50 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300">{p}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            {canEditRole && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <label className="block text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" /> Danger Zone
                </label>
                <div className="space-y-2">
                  <button 
                    onClick={() => handleChange('status', formData.status === 'Suspended' ? 'Active' : 'Suspended')}
                    className="w-full flex items-center gap-3 p-3 text-left text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
                  >
                    <Ban className="w-4 h-4" />
                    {formData.status === 'Suspended' ? 'Reactivate User' : 'Suspend Access'}
                  </button>
                  <button 
                    onClick={() => onDelete(member.id)}
                    className="w-full flex items-center gap-3 p-3 text-left text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove from Team
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Sticky Footer (Only Visible when Dirty) */}
      <div className={`flex-none p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-all duration-300 transform ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 absolute bottom-0 w-full'}`}>
        <div className="flex gap-3">
          <button 
            onClick={() => { setFormData(member); setIsDirty(false); setErrors({}); }}
            className="flex-1 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

    </div>
  );
};

// --- Main Page Component ---

const TeamPage: React.FC = () => {
  const { t } = useI18n();

  const [members, setMembers] = useState<TeamMember[]>(INITIAL_TEAM);
  const [view, setView] = useState<'grid' | 'table'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'All'>('All');
  const [roleFilter, setRoleFilter] = useState<SystemRole | 'All'>('All');
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // Mock current logged-in user role
  const currentUserRole: SystemRole = 'Owner';

  // Invite Modal State
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', name: '', role: 'Member' as SystemRole, jobTitle: '' });

  // Computed
  const selectedMember = useMemo(() => members.find(m => m.id === selectedId), [members, selectedId]);

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.jobTitle.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
      const matchesRole = roleFilter === 'All' || m.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [members, search, statusFilter, roleFilter]);

  // Handlers
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: TeamMember = {
      id: Date.now(),
      name: inviteData.name || inviteData.email.split('@')[0],
      email: inviteData.email,
      role: inviteData.role,
      jobTitle: inviteData.jobTitle || 'Staff',
      status: 'Invited',
      joinedAt: 'Pending',
      invitedBy: 'You'
    };
    setMembers([newMember, ...members]);
    setInviteOpen(false);
    setInviteData({ email: '', name: '', role: 'Member', jobTitle: '' });
  };

  const handleUpdateMember = (id: number, updates: Partial<TeamMember>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleDeleteMember = (id: number) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setSelectedId(null);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      
      {/* --- HEADER --- */}
      <div className="flex-none px-6 lg:px-8 pt-6 lg:pt-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('page_team_title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage users, roles, and access permissions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-md transition ${view === 'grid' ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('table')}
                className={`p-2 rounded-md transition ${view === 'table' ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setInviteOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="All">All Roles</option>
              {ROLE_DEFINITIONS.map(r => <option key={r.role} value={r.role}>{r.label}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Invited">Invited</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col lg:flex-row">
          
          {/* LEFT: LIST */}
          <div className={`flex-1 overflow-y-auto p-6 lg:p-8 ${selectedId ? 'hidden lg:block' : ''}`}>
            {filteredMembers.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <Search className="w-12 h-12 mb-3 opacity-20" />
                <p>No members found matching your filters.</p>
                <button 
                  onClick={() => { setSearch(''); setRoleFilter('All'); setStatusFilter('All'); }}
                  className="mt-2 text-indigo-600 hover:underline text-sm"
                >
                  Clear filters
                </button>
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMembers.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`text-left p-5 rounded-2xl border transition-all hover:shadow-md group ${
                      selectedId === m.id 
                        ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' 
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-lg text-gray-600 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-600 overflow-hidden">
                        {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : initials(m.name)}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(m.role)}`}>
                        {m.role}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{m.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{m.jobTitle}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-medium">
                        {getStatusIndicator(m.status)}
                        <span>{m.status}</span>
                      </div>
                      <span className="text-gray-400">{m.lastActive || 'Inactive'}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Access</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredMembers.map(m => (
                      <tr 
                        key={m.id}
                        onClick={() => setSelectedId(m.id)}
                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group ${
                          selectedId === m.id ? 'bg-indigo-50/60 dark:bg-indigo-900/10' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-sm text-gray-600 dark:text-gray-300 overflow-hidden">
                              {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : initials(m.name)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{m.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{m.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(m.role)}`}>
                              {m.role === 'Owner' && <Shield className="w-3 h-3" />}
                              {m.role}
                            </span>
                            <span className="text-[10px] text-gray-400 pl-1">{m.jobTitle}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIndicator(m.status)}
                            <span className="text-sm text-gray-700 dark:text-gray-300">{m.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {m.joinedAt}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-400">
                          <ChevronRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RIGHT: DETAILS PANE */}
          {selectedMember && (
            <MemberDetailPane 
              member={selectedMember}
              currentUserRole={currentUserRole}
              onClose={() => setSelectedId(null)}
              onSave={handleUpdateMember}
              onDelete={handleDeleteMember}
            />
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setInviteOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Invite Team Member</h3>
              <button onClick={() => setInviteOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="colleague@wanderlust.com"
                  className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  value={inviteData.email}
                  onChange={e => setInviteData({...inviteData, email: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Name (Optional)</label>
                  <input 
                    placeholder="John Doe"
                    className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    value={inviteData.name}
                    onChange={e => setInviteData({...inviteData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Job Title</label>
                  <input 
                    placeholder="e.g. Guide"
                    className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    value={inviteData.jobTitle}
                    onChange={e => setInviteData({...inviteData, jobTitle: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Access Role</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {ROLE_DEFINITIONS.map(def => (
                    <div 
                      key={def.role}
                      onClick={() => setInviteData({...inviteData, role: def.role})}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                        inviteData.role === def.role
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">{def.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{def.description}</div>
                      </div>
                      {inviteData.role === def.role && <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-500/30 active:scale-95">
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeamPage;
