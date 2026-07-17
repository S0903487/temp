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
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-slate-200 bg-white p-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">Organization</h2>
          <p className="text-xs text-slate-500 mt-0.5">Shown across InfluenceOS for your whole team.</p>

          {isLoading && <p className="mt-4 text-xs text-slate-500">Loading organization…</p>}
          {isError && (
            <p className="mt-4 text-xs text-red-600">
              Couldn't load organization{error instanceof Error ? `: ${error.message}` : '.'}
            </p>
          )}

          {organization && (
            <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
              <label className={labelClass}>
                <span className="mb-1 block">Organization name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={fieldClass}
                  required
                />
              </label>
              <label className={labelClass}>
                <span className="mb-1 block">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className={textAreaClass}
                />
              </label>
              <label className={labelClass}>
                <span className="mb-1 block">Currency</span>
                <Select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                  {CURRENCIES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </Select>
                <span className="mt-1 block text-[10px] text-slate-400 font-medium leading-normal">Used to format budgets and revenue across the app.</span>
              </label>

              {updateOrganization.isError && (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 font-semibold">
                  {updateOrganization.error instanceof Error ? updateOrganization.error.message : 'Update failed.'}
                </p>
              )}
              {updateOrganization.isSuccess && (
                <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 font-semibold space-y-1">
                  <p>Changes saved successfully.</p>
                  {updateOrganization.data?.conversion && (
                    <p className="text-[11px] text-emerald-800 font-medium leading-relaxed mt-1">
                      Converted existing monetary figures (campaign budgets, creator rates, CPA/LTV funnels, and performance logs) from <span className="font-bold">{updateOrganization.data.conversion.oldCurrency}</span> to <span className="font-bold">{updateOrganization.data.conversion.newCurrency}</span> at the current rate of <span className="font-bold">1 {updateOrganization.data.conversion.oldCurrency} = {updateOrganization.data.conversion.rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} {updateOrganization.data.conversion.newCurrency}</span> (retrieved via {updateOrganization.data.conversion.rateSource}).
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-1">
                <button
                  type="submit"
                  disabled={updateOrganization.isPending}
                  className="rounded bg-black px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                >
                  {updateOrganization.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">Your account</h2>
          <p className="text-xs text-slate-500 mt-0.5">Signed in as an admin on this workspace.</p>

          {user && (
            <dl className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <dt className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Name</dt>
                <dd className="text-slate-900 font-bold">{user.name}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <dt className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Email</dt>
                <dd className="text-slate-900 font-bold">{user.email}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </PageShell>
  )
}

export default SettingsPage
