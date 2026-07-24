/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import {
  Edit2,
  Trash2,
  Search,
  Lock,
  Unlock,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react'
import PageShell from '../../components/shared/PageShell'
import { Avatar } from '../../components/shared/Avatar'
import { apiRequest } from '../../lib/api'
import { useAuthUser } from '../auth/hooks/useAuth'

interface UserAccount {
  id: string
  organizationId: string
  organizationName: string | null
  name: string
  email: string
  role: string
  isFrozen: boolean
  createdAt: string
}

export default function AccountsPage() {
  const { data: currentUser } = useAuthUser()
  const [users, setUsers] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Edit State
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    isFrozen: false,
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Delete State
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<UserAccount[]>('/users')
      setUsers(data)
      setError(null)
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load user accounts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleEditClick = (user: UserAccount) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      isFrozen: user.isFrozen,
    })
    setSaveError(null)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setSaveError('Name and email are required.')
      return
    }

    try {
      setSaving(true)
      setSaveError(null)
      await apiRequest(`/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      })
      
      // Update local state
      setUsers((current) =>
        current.map((u) =>
          u.id === editingUser.id
            ? { ...u, ...editForm }
            : u
        )
      )
      setEditingUser(null)
    } catch (err: unknown) {
      setSaveError((err as Error).message || 'Failed to update user account.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleFreeze = async (user: UserAccount) => {
    const nextFrozen = !user.isFrozen
    try {
      await apiRequest(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isFrozen: nextFrozen }),
      })
      setUsers((current) =>
        current.map((u) => (u.id === user.id ? { ...u, isFrozen: nextFrozen } : u))
      )
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to change freeze status.')
    }
  }

  const handleDeleteClick = (user: UserAccount) => {
    setDeletingUser(user)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return
    try {
      setDeleting(true)
      setDeleteError(null)
      await apiRequest(`/users/${deletingUser.id}`, {
        method: 'DELETE',
      })
      setUsers((current) => current.filter((u) => u.id !== deletingUser.id))
      setDeletingUser(null)
    } catch (err: unknown) {
      setDeleteError((err as Error).message || 'Failed to delete user account.')
    } finally {
      setDeleting(false)
    }
  }

  // Filtered list
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.organizationName || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <PageShell
      title="User Accounts"
      description="Manage registered user accounts, roles, access status, and freezing policies."
      eyebrow="Administration"
      action={users ? `${users.length} registered accounts` : undefined}
    >
      {/* Search / Filter bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200 rounded p-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search accounts by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-slate-200 py-1.5 pl-9 pr-4 text-xs transition focus:border-black focus:outline-hidden"
          />
        </div>
        <button
          onClick={fetchUsers}
          className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          Refresh list
        </button>
      </div>

      {/* Main Table Container */}
      <div className="rounded border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Signed-up User accounts</h2>
            <p className="text-xs text-slate-500">View and manage registered user accounts in the platform.</p>
          </div>
        </div>

        {loading && <p className="text-xs text-slate-500 py-4">Loading accounts...</p>}
        {error && <p className="text-xs text-red-600 py-4">{error}</p>}

        {!loading && !error && filteredUsers.length === 0 && (
          <p className="text-xs text-slate-500 py-4">No matching signed-up user accounts found.</p>
        )}

        {!loading && !error && filteredUsers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="pb-2 pr-4 font-bold">User</th>
                  <th className="pb-2 pr-4 font-bold">Workspace (Organization)</th>
                  <th className="pb-2 pr-4 font-bold">Role</th>
                  <th className="pb-2 pr-4 font-bold">Access Status</th>
                  <th className="pb-2 pr-4 font-bold">Joined Date</th>
                  <th className="pb-2 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100">
                {filteredUsers.map((account) => {
                  const isMe = currentUser && account.id === currentUser.id;
                  const isOtherOrg = currentUser && account.organizationId !== currentUser.organizationId;
                  return (
                    <tr key={account.id} className="hover:bg-slate-50/50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={account.name} size={32} />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              {account.name}
                              {isMe && (
                                <span className="inline-flex items-center rounded-sm bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                  You (Logged in)
                                </span>
                              )}
                              {isOtherOrg && (
                                <span className="inline-flex items-center rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                  Created by Other
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{account.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-700">
                        {account.organizationName || '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 border border-slate-200">
                          {account.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {account.isFrozen ? (
                          <span className="inline-flex items-center gap-1 rounded bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            <Lock size={10} />
                            Frozen
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            <Check size={10} />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-slate-400">
                        {new Date(account.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleToggleFreeze(account)}
                            disabled={!!isMe}
                            title={isMe ? 'You cannot freeze your own account' : (account.isFrozen ? 'Unfreeze account' : 'Freeze account')}
                            className={`rounded border p-1 transition ${
                              isMe
                                ? 'border-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                                : account.isFrozen
                                ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 cursor-pointer'
                                : 'border-amber-200 text-amber-600 hover:bg-amber-50 cursor-pointer'
                            }`}
                          >
                            {account.isFrozen ? <Unlock size={14} /> : <Lock size={14} />}
                          </button>
                          <button
                            onClick={() => handleEditClick(account)}
                            title="Modify account details"
                            className="rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(account)}
                            disabled={!!isMe}
                            title={isMe ? 'You cannot delete your own account' : 'Delete user account'}
                            className={`rounded border p-1 transition ${
                              isMe
                                ? 'border-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                                : 'border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer'
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setEditingUser(null)} />
          <div className="relative w-full max-w-md rounded bg-white p-5 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Admin</p>
                <h3 className="text-base font-bold text-slate-900">Modify Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded border border-slate-200 p-1 text-slate-400 hover:bg-slate-50 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleSaveEdit}>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs focus:border-black focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs focus:border-black focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wider">User Role</label>
                <div className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 font-medium select-none capitalize">
                  {editForm.role}
                </div>
                <p className="mt-1 text-[10px] text-slate-400 select-none">
                  User roles are permanent once created and cannot be changed.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modal-is-frozen"
                  checked={editForm.isFrozen}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, isFrozen: e.target.checked }))}
                  disabled={editingUser?.id === currentUser?.id}
                  className="rounded border-slate-300 text-black focus:ring-black h-4 w-4 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="modal-is-frozen" className={`text-xs font-bold cursor-pointer ${editingUser?.id === currentUser?.id ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700'}`}>
                  Freeze account (prevents any data updates)
                </label>
              </div>

              {editingUser?.id === currentUser?.id && (
                <p className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded px-2 py-1 select-none">
                  You cannot modify your own role or freeze state to prevent locking yourself out.
                </p>
              )}

              {saveError && (
                <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                  {saveError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-black px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setDeletingUser(null)} />
          <div className="relative w-full max-w-sm rounded bg-white p-5 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-50 p-2 text-red-600 border border-red-150 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Account?</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Are you absolutely sure you want to delete the user account for <strong className="text-slate-900">{deletingUser.name}</strong> ({deletingUser.email})? This action is irreversible and will delete their sessions.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-3 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="rounded border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
