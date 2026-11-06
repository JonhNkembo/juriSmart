'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { PERFIS, type Perfil, type PerfilTipo } from '@/lib/perfis'

export default function Utilizadores() {
  const { perfil: eu } = useAuth()
  const [l, setL] = useState<Perfil[]>([])
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.from('perfis').select('*').order('nome')
    setL((data ?? []) as Perfil[])
  }, [])
  useEffect(() => { load() }, [load])

  async function mudar(u: Perfil, novo: PerfilTipo) {
    setMsg('')
    let docente_id = u.docente_id
    if (novo === 'juri' && !docente_id) {
      const { data: ex } = await supabase.from('docentes').select('id').eq('email', u.email).maybeSingle()
      if (ex) docente_id = ex.id
      else {
        const { data: d, error } = await supabase.from('docentes')
          .insert({ nome: u.nome, email: u.email, grau: 'Docente', nivel: 'Licenciatura' }).select('id').single()
        if (error || !d) return setMsg(error?.message ?? 'Erro ao criar o docente.')
        docente_id = d.id
      }
    }
    const { error } = await supabase.from('perfis').update({ perfil: novo, docente_id }).eq('id', u.id)
    if (error) return setMsg(error.message)
    load()
  }

  const lista = l.filter(u => `${u.nome} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Utilizadores e perfis</h2>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Pesquisar por nome ou email..." className="w-full sm:w-80 h-10 px-4 text-sm rounded-md border border-slate-300" />
      </div>
      {msg && <p className="text-sm text-rose-600">{msg}</p>}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead><tr className="border-b border-slate-200 text-xs text-slate-400 uppercase"><th className="p-3">Nome</th><th className="p-3">Email</th><th className="p-3">Telefone</th><th className="p-3">Perfil</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {lista.map(u => (
              <tr key={u.id}>
                <td className="p-3 font-medium">{u.nome}{u.id === eu.id && <span className="ml-2 text-[10px] text-brand-700 font-bold">(você)</span>}</td>
                <td className="p-3 text-slate-600">{u.email}</td>
                <td className="p-3 text-slate-600">{u.telefone ?? '—'}</td>
                <td className="p-3">
                  <select value={u.perfil} disabled={u.id === eu.id} onChange={e => mudar(u, e.target.value as PerfilTipo)}
                    className="h-9 px-2 rounded-md border border-slate-300 text-sm disabled:bg-slate-100">
                    {(Object.keys(PERFIS) as PerfilTipo[]).map(p => <option key={p} value={p}>{PERFIS[p].rotulo} ({PERFIS[p].detalhe})</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={4} className="p-6 text-center text-slate-400">Nenhum utilizador.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">Não pode alterar o seu próprio perfil (evita ficar sem administradores).</p>
    </div>
  )
}
