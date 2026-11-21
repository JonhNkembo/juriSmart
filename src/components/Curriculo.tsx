'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS, type Item } from '@/lib/types'
import Barra from './Barra'

const inp = 'w-full h-11 px-3.5 rounded-md border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 transition'
const lbl = 'block text-[13px] font-semibold text-slate-700 mb-1.5'

export default function Curriculo({ docenteId }: { docenteId: string }) {
  const [itens, setItens] = useState<Item[]>([])
  const [n, setN] = useState({ categoria: 'publicacoes', titulo: '', ano: '' })
  const [msg, setMsg] = useState<{ ok: boolean; txt: string } | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('curriculo_itens').select('*').eq('docente_id', docenteId).order('created_at')
    setItens((data ?? []) as Item[])
  }, [docenteId])
  useEffect(() => { load() }, [load])

  async function add(e: React.FormEvent) {
    e.preventDefault(); setMsg(null)
    if (!n.titulo.trim()) return setMsg({ ok: false, txt: 'Escreva o título do item.' })
    const { error } = await supabase.from('curriculo_itens').insert({
      docente_id: docenteId, categoria: n.categoria, titulo: n.titulo.trim(), ano: n.ano ? Number(n.ano) : null,
    })
    if (error) return setMsg({ ok: false, txt: error.message })
    setN({ ...n, titulo: '', ano: '' }); setMsg({ ok: true, txt: 'Item adicionado ao currículo.' }); load()
  }
  async function del(id: string) {
    if (!window.confirm('Remover este item do currículo?')) return
    await supabase.from('curriculo_itens').delete().eq('id', id); load()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex justify-between text-sm"><span className="font-semibold text-slate-700">Secções com itens</span><span className="text-slate-500">{new Set(itens.map(i => i.categoria)).size} de {CATEGORIAS.length}</span></div>
        <Barra valor={new Set(itens.map(i => i.categoria)).size} max={CATEGORIAS.length} className="mt-2" rotulo="Secções do currículo preenchidas" />
      </div>
      <form onSubmit={add} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <h3 className="bg-brand-900 text-white text-sm font-bold px-6 py-3 border-b-4 border-amber-400"><i className="fa-solid fa-plus mr-2" />Adicionar ao currículo</h3>
        <div className="p-6 grid grid-cols-1 md:grid-cols-[13rem_1fr_6.5rem_auto] gap-4 items-end">
          <div><label className={lbl}>Secção</label>
            <select className={inp} value={n.categoria} onChange={e => setN({ ...n, categoria: e.target.value })}>
              {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select></div>
          <div><label className={lbl}>Título</label>
            <input className={inp} value={n.titulo} onChange={e => setN({ ...n, titulo: e.target.value })} placeholder="Ex.: Segurança em redes sem fios" /></div>
          <div><label className={lbl}>Ano</label>
            <input type="number" className={inp} value={n.ano} onChange={e => setN({ ...n, ano: e.target.value })} placeholder="2025" /></div>
          <button className="h-11 px-6 rounded-md bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold shadow-sm">Adicionar</button>
        </div>
        {msg && <p className={`px-6 pb-5 -mt-2 text-sm ${msg.ok ? 'text-emerald-700' : 'text-rose-600'}`}><i className={`fa-solid ${msg.ok ? 'fa-circle-check' : 'fa-circle-exclamation'} mr-2`} />{msg.txt}</p>}
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIAS.map(c => {
          const l = itens.filter(i => i.categoria === c.key)
          return (
            <section key={c.key} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold"><i className={`fa-solid ${c.icon} text-brand-600 mr-2`} />{c.label}</h4>
                <span className="text-xs font-bold text-slate-400">{l.length}</span>
              </div>
              {l.length ? (
                <ul className="mt-2 divide-y divide-slate-100">
                  {l.map(i => (
                    <li key={i.id} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                      <span>{i.titulo}{i.ano ? <span className="text-slate-400"> · {i.ano}</span> : null}</span>
                      <button onClick={() => del(i.id)} aria-label="Remover" className="text-rose-500 hover:text-rose-700 text-xs shrink-0"><i className="fa-solid fa-trash" /></button>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-slate-400 mt-2">Nada adicionado.</p>}
            </section>
          )
        })}
      </div>
    </div>
  )
}
