import React, { useEffect, useMemo, useState } from 'react';
import {
  MoreHorizontal,
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
  PencilLine,
} from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';

type MemberStatus = 'Active' | 'On Tour' | 'Away' | 'Invited' | 'Disabled';

type MemberRole = 'Owner' | 'Admin' | 'Manager' | 'Guide' | 'Driver' | 'Support';

interface TeamMember {
  id: number;
  name: string;
  roleLabel: string;
  role: MemberRole;
  status: MemberStatus;
  email: string;
  lastActive?: string;
}

const INITIAL_TEAM: TeamMember[] = [
  { id: 1, name: 'Alex Walker', roleLabel: 'Owner & Guide', role: 'Owner', status: 'Active', email: 'alex@wanderlust.com', lastActive: '5 mins ago' },
  { id: 2, name: 'Sarah Miller', roleLabel: 'Tour Guide', role: 'Guide', status: 'On Tour', email: 'sarah@wanderlust.com', lastActive: '1 hour ago' },
  { id: 3, name: 'Mike Johnson', roleLabel: 'Driver', role: 'Driver', status: 'Active', email: 'mike@wanderlust.com', lastActive: 'Today' },
  { id: 4, name: 'Emily Davis', roleLabel: 'Admin Support', role: 'Support', status: 'Away', email: 'emily@wanderlust.com', lastActive: 'Yesterday' },
];

const ROLE_OPTIONS: { role: MemberRole; label: string; description: string }[] = [
  { role: 'Owner', label: 'Owner', description: 'Full access, billing and team management.' },
  { role: 'Admin', label: 'Admin', description: 'Manage team, settings, and data.' },
  { role: 'Manager', label: 'Manager', description: 'Manage tours, bookings, leads.' },
  { role: 'Guide', label: 'Guide', description: 'Work with tours and bookings.' },
  { role: 'Driver', label: 'Driver', description: 'View assigned tours and bookings.' },
  { role: 'Support', label: 'Support', description: 'Support operations, limited access.' },
];

const STATUS_OPTIONS: MemberStatus[] = ['Active', 'On Tour', 'Away', 'Invited', 'Disabled'];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? '';
  const b = parts[1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

function statusPill(status: MemberStatus) {
  switch (status) {
    case 'Active':
      return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300';
    case 'On Tour':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
    case 'Away':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200';
    case 'Invited':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
    case 'Disabled':
      return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200';
  }
}

const TeamPage: React.FC = () => {
  const { t } = useI18n();

  const [members, setMembers] = useState<TeamMember[]>(INITIAL_TEAM);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'All'>('All');
  const [roleFilter, setRoleFilter] = useState<MemberRole | 'All'>('All');

  const [selectedId, setSelectedId] = useState<number>(INITIAL_TEAM[0].id);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('Guide');
  const [inviteName, setInviteName] = useState('');
  const [inviteError, setInviteError] = useState<string>('');

  // Profile edit state (local)
  const selected = useMemo(
    () => members.find((m) => m.id === selectedId) ?? null,
    [members, selectedId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.roleLabel.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' ? true : m.status === statusFilter;
      const matchesRole = roleFilter === 'All' ? true : m.role === roleFilter;

      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [members, search, statusFilter, roleFilter]);

  // Close invite modal with ESC
  useEffect(() => {
    if (!inviteOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInviteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inviteOpen]);

  const openInvite = () => {
    setInviteError('');
    setInviteEmail('');
    setInviteName('');
    setInviteRole('Guide');
    setInviteOpen(true);
  };

  const handleInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    const name = inviteName.trim();

    if (!email || !email.includes('@')) {
      setInviteError('Please enter a valid email.');
      return;
    }
    if (!name) {
      setInviteError('Please enter a name.');
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === email)) {
      setInviteError('This email is already a member.');
      return;
    }

    const roleMeta = ROLE_OPTIONS.find((r) => r.role === inviteRole);
    const newMember: TeamMember = {
      id: Math.max(0, ...members.map((m) => m.id)) + 1,
      name,
      email,
      role: inviteRole,
      roleLabel: roleMeta ? roleMeta.label : inviteRole,
      status: 'Invited',
      lastActive: 'Invitation sent',
    };

    setMembers((prev) => [newMember, ...prev]);
    setSelectedId(newMember.id);
    setInviteOpen(false);
  };

  const updateSelected = (patch: Partial<TeamMember>) => {
    if (!selected) return;
    setMembers((prev) => prev.map((m) => (m.id === selected.id ? { ...m, ...patch } : m)));
  };

  const removeSelected = () => {
    if (!selected) return;
    const ok = window.confirm(`Remove ${selected.name} from the team?`);
    if (!ok) return;

    setMembers((prev) => prev.filter((m) => m.id !== selected.id));
    const remaining = members.filter((m) => m.id !== selected.id);
    setSelectedId(remaining[0]?.id ?? 0);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-none px-6 lg:px-8 pt-6 lg:pt-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t?.('page_team_title') ?? 'Team'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Invite teammates, manage roles, and control access to your workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
              <button
                onClick={() => setView('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                  view === 'grid'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                  view === 'table'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={openInvite}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or role..."
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">All roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 overflow-hidden px-6 lg:px-8 pb-6 lg:pb-8 mt-6">
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Members list */}
          <div className="lg:col-span-7 h-full overflow-hidden">
            <div className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    Team Members
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
                    {filtered.length}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Select a member to manage profile and access.
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {view === 'grid' ? (
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedId(m.id)}
                        className={`text-left rounded-2xl border transition shadow-sm hover:shadow-md ${
                          selectedId === m.id
                            ? 'border-indigo-200 bg-indigo-50/60 dark:border-indigo-800 dark:bg-indigo-900/20'
                            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                        }`}
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200">
                                {initials(m.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-gray-900 dark:text-white truncate">
                                  {m.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {m.roleLabel}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${statusPill(
                                  m.status
                                )}`}
                              >
                                {m.status}
                              </span>
                              <span className="text-gray-400">
                                <MoreHorizontal className="w-4 h-4" />
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2 min-w-0">
                              <Mail className="w-3.5 h-3.5" />
                              <span className="truncate">{m.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{m.lastActive ?? ' - '}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <div className="col-span-full p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No team members match your search.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                        <tr>
                          <th className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">Member</th>
                          <th className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">Role</th>
                          <th className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">Status</th>
                          <th className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">Email</th>
                          <th className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filtered.map((m) => (
                          <tr
                            key={m.id}
                            onClick={() => setSelectedId(m.id)}
                            className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/20 transition ${
                              selectedId === m.id ? 'bg-indigo-50/60 dark:bg-indigo-900/20' : ''
                            }`}
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200">
                                  {initials(m.name)}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 dark:text-white">{m.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{m.lastActive ?? ''}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{m.roleLabel}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusPill(m.status)}`}>
                                {m.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{m.email}</td>
                            <td className="px-5 py-3 text-right text-gray-400">
                              <MoreHorizontal className="w-4 h-4" />
                            </td>
                          </tr>
                        ))}
                        {filtered.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                              No team members match your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile panel */}
          <div className="lg:col-span-5 h-full overflow-hidden">
            <div className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Member Profile</span>
                </div>
                {selected && (
                  <button
                    onClick={removeSelected}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {!selected ? (
                  <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Select a team member to see their profile.
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-extrabold text-gray-700 dark:text-gray-200 text-lg">
                        {initials(selected.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xl font-bold text-gray-900 dark:text-white truncate">
                              {selected.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {selected.email}
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusPill(selected.status)}`}>
                            {selected.status}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <BadgeCheck className="w-4 h-4" />
                            Workspace member
                          </span>
                          <span className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <Clock className="w-4 h-4" />
                            {selected.lastActive ?? ' - '}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4">
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">Role</div>
                          <PencilLine className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Controls what this member can access.
                        </p>

                        <div className="mt-3">
                          <select
                            value={selected.role}
                            onChange={(e) => {
                              const newRole = e.target.value as MemberRole;
                              const meta = ROLE_OPTIONS.find((r) => r.role === newRole);
                              updateSelected({
                                role: newRole,
                                roleLabel: meta ? meta.label : newRole,
                              });
                            }}
                            className="w-full bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r.role} value={r.role}>
                                {r.label}
                              </option>
                            ))}
                          </select>

                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {ROLE_OPTIONS.find((r) => r.role === selected.role)?.description}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Status</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Use Disabled to revoke access without deleting the user.
                        </p>

                        <div className="mt-3">
                          <select
                            value={selected.status}
                            onChange={(e) => updateSelected({ status: e.target.value as MemberStatus })}
                            className="w-full bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Quick actions</div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              if (selected.status === 'Invited') {
                                updateSelected({ status: 'Active', lastActive: 'Just now' });
                              } else {
                                alert('This action is a UI demo (connect to your backend later).');
                              }
                            }}
                            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition"
                          >
                            {selected.status === 'Invited' ? 'Mark as Active' : 'Resend invite'}
                          </button>
                          <button
                            onClick={() => alert('This action is a UI demo (connect to your backend later).')}
                            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition"
                          >
                            Reset password
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40"
            onClick={() => setInviteOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">Invite Member</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Add a teammate by email and choose their role.
                </div>
              </div>
              <button
                onClick={() => setInviteOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {inviteError && (
                <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 text-sm">
                  {inviteError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Full name
                </label>
                <input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {ROLE_OPTIONS.find((r) => r.role === inviteRole)?.description}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3 bg-gray-50/40 dark:bg-gray-900/40">
              <button
                onClick={() => setInviteOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                className="px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
              >
                Send invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
