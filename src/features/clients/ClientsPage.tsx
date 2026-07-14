import { useState } from 'react'
import { Plus } from 'lucide-react'
import PageShell from '../../components/shared/PageShell'
import { Avatar } from '../../components/shared/Avatar'
import { useClients, useCreateClient } from './hooks/useClients'
import { AddClientModal } from './components/AddClientModal'
import type { CreateClientInput } from './types'

function statusBadgeClasses(status: string) {
  return status === 'active'
    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
}

function ClientsPage() {
  const { data: clients, isLoading, isError, error } = useClients()
  const createClient = useCreateClient()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSubmit = (data: CreateClientInput) => {
    createClient.mutate(data, {
      onSuccess: () => setIsModalOpen(false),
    })
  }

  return (
    <PageShell
      title="Clients"
      description="Every account InfluenceOS manages campaigns for, in one place."
      eyebrow="Accounts"
      action={clients ? `${clients.length} clients` : undefined}
    >
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Client roster</h2>
            <p className="text-sm text-slate-400">Prospects and active accounts.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            <Plus size={16} />
            Add client
          </button>
        </div>

        {isLoading && <p className="mt-6 text-sm text-slate-400">Loading clients…</p>}
        {isError && (
          <p className="mt-6 text-sm text-red-400">
            Couldn't load clients{error instanceof Error ? `: ${error.message}` : '.'}
          </p>
        )}

        {clients && clients.length === 0 && (
          <p className="mt-6 text-sm text-slate-400">No clients yet. Add your first one to get started.</p>
        )}

        {clients && clients.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Contact</th>
                  <th className="pb-3 pr-4">Industry</th>
                  <th className="pb-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-800/60 text-slate-300">
                    <td className="py-3 pr-4 font-medium text-white">
                      <div className="flex items-center gap-3">
                        <Avatar name={client.name} size={32} />
                        {client.name}
                      </div>
                    </td>
                    <td className="py-3 pr-4">{client.contactEmail || '—'}</td>
                    <td className="py-3 pr-4">{client.industry || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full border px-2.5 py-1 text-xs capitalize ${statusBadgeClasses(client.status)}`}>
                        {client.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddClientModal
        isOpen={isModalOpen}
        isSubmitting={createClient.isPending}
        errorMessage={createClient.error instanceof Error ? createClient.error.message : null}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </PageShell>
  )
}

export default ClientsPage
