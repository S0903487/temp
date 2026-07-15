import { useState } from 'react'
import { Plus } from 'lucide-react'
import PageShell from '../../components/shared/PageShell'
import { Avatar } from '../../components/shared/Avatar'
import { useClients, useCreateClient } from './hooks/useClients'
import { AddClientModal } from './components/AddClientModal'
import type { CreateClientInput } from './types'

function statusBadgeClasses(status: string) {
  return status === 'active'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-amber-50 text-amber-700 border-amber-200'
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
      <div className="rounded border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Client roster</h2>
            <p className="text-xs text-slate-500">Prospects and active accounts.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded bg-black px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer"
          >
            <Plus size={14} />
            Add client
          </button>
        </div>

        {isLoading && <p className="mt-4 text-xs text-slate-500">Loading clients…</p>}
        {isError && (
          <p className="mt-4 text-xs text-red-600">
            Couldn't load clients{error instanceof Error ? `: ${error.message}` : '.'}
          </p>
        )}

        {clients && clients.length === 0 && (
          <p className="mt-4 text-xs text-slate-500">No clients yet. Add your first one to get started.</p>
        )}

        {clients && clients.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="pb-2 pr-4 font-bold">Name</th>
                  <th className="pb-2 pr-4 font-bold">Contact</th>
                  <th className="pb-2 pr-4 font-bold">Industry</th>
                  <th className="pb-2 pr-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-100">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/50">
                    <td className="py-2 pr-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Avatar name={client.name} size={24} />
                        {client.name}
                      </div>
                    </td>
                    <td className="py-2 pr-4">{client.contactEmail || '—'}</td>
                    <td className="py-2 pr-4">{client.industry || '—'}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClasses(client.status)}`}>
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
