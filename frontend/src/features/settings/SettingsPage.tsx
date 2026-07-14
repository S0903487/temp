/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import PageShell from '../../components/shared/PageShell'
import { useOrganization, useUpdateOrganization } from '../organizations/hooks/useOrganization'
import { useAuthUser } from '../auth/hooks/useAuth'
import { CURRENCIES } from '../../lib/currency'
import { Select, fieldClass, textAreaClass, labelClass } from '../../components/shared/fields'

function SettingsPage() {
  const { data: organization, isLoading, isError, error } = useOrganization()
  const { data: user } = useAuthUser()
  const updateOrganization = useUpdateOrganization()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('USD')

  useEffect(() => {
    if (organization) {
      setName(organization.name)
      setDescription(organization.description ?? '')
      setCurrency(organization.currency)
    }
  }, [organization])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) return
    updateOrganization.mutate({ name: name.trim(), description: description.trim(), currency })
  }

  return (
    <PageShell
      title="Settings"
      description="Workspace details and account information."
      eyebrow="Configuration"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20">
          <h2 className="text-lg font-semibold text-white">Organization</h2>
          <p className="mt-1 text-sm text-slate-400">Shown across InfluenceOS for your whole team.</p>

          {isLoading && <p className="mt-6 text-sm text-slate-400">Loading organization…</p>}
          {isError && (
            <p className="mt-6 text-sm text-red-400">
              Couldn't load organization{error instanceof Error ? `: ${error.message}` : '.'}
            </p>
          )}

          {organization && (
            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className={labelClass}>
                <span className="mb-2 block">Organization name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={fieldClass}
                  required
                />
              </label>
              <label className={labelClass}>
                <span className="mb-2 block">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className={textAreaClass}
                />
              </label>
              <label className={labelClass}>
                <span className="mb-2 block">Currency</span>
                <Select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                  {CURRENCIES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </Select>
                <span className="mt-1 block text-xs text-slate-500">Used to format budgets and revenue across the app.</span>
              </label>

              {updateOrganization.isError && (
                <p className="rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-300">
                  {updateOrganization.error instanceof Error ? updateOrganization.error.message : 'Update failed.'}
                </p>
              )}
              {updateOrganization.isSuccess && (
                <p className="rounded-lg bg-emerald-950/60 px-3 py-2 text-sm text-emerald-300">Saved.</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateOrganization.isPending}
                  className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  {updateOrganization.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20">
          <h2 className="text-lg font-semibold text-white">Your account</h2>
          <p className="mt-1 text-sm text-slate-400">Signed in as an admin on this workspace.</p>

          {user && (
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800/60 pb-3">
                <dt className="text-slate-400">Name</dt>
                <dd className="text-white">{user.name}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-3">
                <dt className="text-slate-400">Email</dt>
                <dd className="text-white">{user.email}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </PageShell>
  )
}

export default SettingsPage
