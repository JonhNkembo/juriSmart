'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { PERFIS, type Perfil, type PerfilTipo } from '@/lib/perfis'
import Avatar from '@/components/Avatar'

type Aviso = { ok: boolean; txt: string } | null

export default function Utilizadores() {
  const { perfil: eu } = useAuth()
  const [l, setL] = useState<Perfil[]>([])
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState<'todos' | PerfilTipo | 'pendentes' | 'desativados'>('todos')
  const [aviso, setAviso] = useState<Aviso>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('perfis').select('*').order('nome')
    setL((data ?? []) as Perfil[])
  }, [])
  useEffect(() => { load() }, [load])

  async function mudar(u: Perfil, novo: PerfilTipo) {
    setAviso(null)
    if (novo === 'administrador' && !window.confirm(`Promover ${u.nome} a Administrador? Passará a ter acesso total ao sistema.`)) return
    let docente_id = u.docente_id
    if (novo === 'juri' && !docente_id) {
      const { data: ex } = await supabase.from('docentes').select('id').eq('email', u.email).maybeSingle()
      if (ex) docente_id = ex.id
      else {
        const { data: d, error } = await supabase.from('docentes')
          .insert({ nome: u.nome, email: u.email, grau: 'Docente', nivel: 'Licenciatura' }).select('id').single()
        if (error || !d) return setAviso({ ok: false, txt: error?.message ?? 'Erro ao criar o docente.' })
        docente_id = d.id
      }
    }
    if (novo !== 'juri') docente_id = null   // só os Júris têm registo de investigador ligado à conta
    const { error } = await supabase.from('perfis').update({ perfil: novo, docente_id }).eq('id', u.id)
    if (error) return setAviso({ ok: false, txt: error.message })
    setAviso({ ok: true, txt: `${u.nome} passou a ${PERFIS[novo].rotulo}.` })
    load()
  }

  async function aprovar(u: Perfil) {
    setAviso(null)
    const { error } = await supabase.from('perfis').update({ estado: 'ativo' }).eq('id', u.id)
    if (error) return setAviso({ ok: false, txt: error.message })
    setAviso({ ok: true, txt: `Conta de ${u.nome} aprovada. Já pode entrar no sistema.` })
    load()
  }

  async function alternarAtivo(u: Perfil) {
    setAviso(null)
    const desativar = u.estado === 'ativo'
    const pergunta = desativar
      ? `Desativar a conta de ${u.nome}? A pessoa deixa de poder usar o sistema até ser reativada.`
      : `Reativar a conta de ${u.nome}?`
    if (!window.confirm(pergunta)) return
    const { error } = await supabase.from('perfis').update({ estado: desativar ? 'desativado' : 'ativo' }).eq('id', u.id)
    if (error) return setAviso({ ok: false, txt: error.message })
    setAviso({ ok: true, txt: `Conta de ${u.nome} ${desativar ? 'desativada' : 'reativada'}.` })
    load()
  }

  async function excluir(u: Perfil) {
    setAviso(null)
    const rejeitar = u.estado === 'pendente'
    if (!window.confirm(rejeitar ? `Rejeitar o pedido de ${u.nome} (${u.email})? A conta será eliminada.` : `Excluir definitivamente a conta de ${u.nome} (${u.email})? Esta acção não pode ser desfeita.`)) return
    const { error } = await supabase.rpc('excluir_utilizador', { alvo: u.id })
    if (error) return setAviso({ ok: false, txt: error.message })
    setAviso({ ok: true, txt: `Conta de ${u.nome} ${rejeitar ? 'rejeitada e eliminada' : 'excluída'}.` })
    load()
  }

  const conta = (f: (u: Perfil) => boolean) => l.filter(f).length
  const stats = [
    { t: 'Total', v: l.length, i: 'fa-users', f: 'todos' as const },
    { t: 'Administradores', v: conta(u => u.perfil === 'administrador'), i: 'fa-user-shield', f: 'administrador' as const },
    { t: 'Júris', v: conta(u => u.perfil === 'juri'), i: 'fa-scale-balanced', f: 'juri' as const },
    { t: 'Estudantes', v: conta(u => u.perfil === 'avaliador'), i: 'fa-user-graduate', f: 'avaliador' as const },
    { t: 'Por aprovar', v: conta(u => u.estado === 'pendente'), i: 'fa-hourglass-half', f: 'pendentes' as const },
    { t: 'Desativados', v: conta(u => u.estado === 'desativado'), i: 'fa-user-lock', f: 'desativados' as const },
  ]
  const ordem = (u: Perfil) => (u.estado === 'pendente' ? 0 : 1)
  const lista = l.filter(u =>
    `${u.nome} ${u.email}`.toLowerCase().includes(q.toLowerCase()) &&
    (filtro === 'todos' || (filtro === 'pendentes' ? u.estado === 'pendente' : filtro === 'desativados' ? u.estado === 'desativado' : u.perfil === filtro)))
    .sort((a, b) => ordem(a) - ordem(b))

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Utilizadores e perfis</h2>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Pesquisar por nome ou email..." className="w-full sm:w-80 h-10 px-4 text-sm rounded-md border border-slate-300" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {stats.map(s => (
          <button key={s.t} onClick={() => setFiltro(s.f)}
            className={`text-left bg-white rounded-xl border p-3 transition ${filtro === s.f ? 'border-brand-600 ring-2 ring-brand-600/20' : 'border-slate-200 hover:border-slate-300'}`}>
            <i className={`fa-solid ${s.i} text-brand-600`} />
            <p className="text-2xl font-extrabold mt-1">{s.v}</p>
            <p className="text-xs text-slate-500">{s.t}</p>
          </button>
        ))}
      </div>

      {aviso && (
        <p className={`text-sm ${aviso.ok ? 'text-emerald-700' : 'text-rose-600'}`}>
          <i className={`fa-solid ${aviso.ok ? 'fa-circle-check' : 'fa-circle-exclamation'} mr-2`} />{aviso.txt}
        </p>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-400 uppercase">
              <th className="p-3">Utilizador</th><th className="p-3">Perfil</th><th className="p-3">Estado</th><th className="p-3 text-right">Acções</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lista.map(u => {
              const eu_ = u.id === eu.id
              return (
                <tr key={u.id} className={u.estado === 'ativo' ? '' : u.estado === 'pendente' ? 'bg-amber-50/60' : 'bg-slate-50 text-slate-400'}>
                  <td className="p-3 flex items-center gap-3">
                    <Avatar nome={u.nome} foto={u.foto_url} tam={32} />
                    <div>
                    <p className="font-medium">{u.nome}{eu_ && <span className="ml-2 text-[10px] text-brand-700 font-bold">(você)</span>}</p>
                    <p className="text-xs text-slate-500">{u.email}{u.telefone ? ` · ${u.telefone}` : ''}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <select value={u.perfil} disabled={eu_} onChange={e => mudar(u, e.target.value as PerfilTipo)}
                      className="h-9 px-2 rounded-md border border-slate-300 text-sm bg-white text-slate-800 disabled:bg-slate-100 disabled:text-slate-500">
                      {(Object.keys(PERFIS) as PerfilTipo[]).map(p => <option key={p} value={p}>{PERFIS[p].rotulo} ({PERFIS[p].detalhe})</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${u.estado === 'ativo' ? 'bg-emerald-100 text-emerald-800' : u.estado === 'pendente' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'}`}>{u.estado === 'ativo' ? 'Ativo' : u.estado === 'pendente' ? 'Por aprovar' : 'Desativado'}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      {u.estado === 'pendente' ? (
                        <button onClick={() => aprovar(u)} className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                          <i className="fa-solid fa-user-check mr-1.5" />Aprovar
                        </button>
                      ) : (
                        <button disabled={eu_} onClick={() => alternarAtivo(u)}
                          className="h-8 px-3 rounded-md border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                          <i className={`fa-solid ${u.estado === 'ativo' ? 'fa-user-lock' : 'fa-user-check'} mr-1.5`} />{u.estado === 'ativo' ? 'Desativar' : 'Reativar'}
                        </button>
                      )}
                      <button disabled={eu_} onClick={() => excluir(u)}
                        className="h-8 px-3 rounded-md border border-rose-200 bg-white text-rose-600 text-xs font-semibold hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed">
                        <i className="fa-solid fa-trash mr-1.5" />{u.estado === 'pendente' ? 'Rejeitar' : 'Excluir'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!lista.length && <tr><td colSpan={4} className="p-6 text-center text-slate-400">Nenhum utilizador.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">As contas novas ficam "Por aprovar" até as aprovar aqui. Para criar outro administrador, peça à pessoa que se registe, aprove-a e depois promova-a. Não pode alterar, desativar nem excluir a sua própria conta.</p>
    </div>
  )
}
