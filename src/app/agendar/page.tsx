'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Docente } from '@/lib/types'
import { rankDocentes, assignSlots, PAPEIS, ROTULOS } from '@/lib/matching'
import Combobox from '@/components/Combobox'

const inp = 'w-full h-11 px-3.5 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20'
const lbl = 'block text-[13px] font-semibold text-slate-700 mb-1.5'
const VAZIO = { tema: '', palavras: '', estudante: '', orientador: '', quando: '' }

async function ocupadosEm(quando: string) {
  const { data } = await supabase.from('juris').select('orientador_id, juri_membros(docente_id)').eq('data_hora', new Date(quando).toISOString())
  const s = new Set<string>()
  ;(data ?? []).forEach((j: { orientador_id: string; juri_membros: { docente_id: string }[] }) => {
    s.add(j.orientador_id); j.juri_membros.forEach(m => s.add(m.docente_id))
  })
  return s
}
async function cargas() {
  const { data } = await supabase.from('juri_membros').select('docente_id')
  const c: Record<string, number> = {}
  ;(data ?? []).forEach(m => { c[m.docente_id] = (c[m.docente_id] ?? 0) + 1 })
  return c
}

export default function Agendar() {
  const router = useRouter()
  const [docs, setDocs] = useState<Docente[]>([])
  const [estudantes, setEstudantes] = useState<string[]>([])
  const [f, setF] = useState(VAZIO)
  const [modo, setModo] = useState<'auto' | 'manual'>('auto')
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null])
  const [compat, setCompat] = useState<(number | null)[]>([null, null, null, null])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [ultimo, setUltimo] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('docentes').select('*, curriculo_itens(*)').order('nome').then(({ data }) => setDocs((data ?? []) as Docente[]))
    supabase.from('perfis').select('nome').eq('perfil', 'avaliador').order('nome').then(({ data }) => setEstudantes((data ?? []).map(x => x.nome as string)))
  }, [])

  const set = (k: keyof typeof VAZIO) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const opcoes = docs.map(d => ({ id: d.id, label: d.nome, sub: `${d.grau} · ${d.especialidades.join(', ')}${d.disponivel ? '' : ' · INDISPONÍVEL'}` }))
  const opcoesSlot = (i: number) => opcoes.filter(o => o.id !== f.orientador && !slots.some((s, k) => k !== i && s === o.id))

  function escolherOrientador(id: string) {
    setF({ ...f, orientador: id })
    setCompat(compat.map((c, i) => (slots[i] === id ? null : c)))
    setSlots(slots.map(s => (s === id ? null : s)))
  }
  function escolher(i: number, id: string) {
    setSlots(slots.map((s, k) => (k === i ? id || null : s)))
    setCompat(compat.map((c, k) => (k === i ? null : c)))
  }

  async function gerar() {
    if (!f.tema || !f.orientador || !f.quando) return setMsg('Preencha o tema, o orientador e a data.')
    setBusy(true); setMsg('')
    const [oc, ca] = await Promise.all([ocupadosEm(f.quando), cargas()])
    const r = assignSlots(rankDocentes(f, docs, ca, oc))
    setSlots(r.map(x => x?.docente.id ?? null)); setCompat(r.map(x => x?.score ?? null))
    setBusy(false)
    if (r.some(x => !x)) setMsg('Não há docentes disponíveis suficientes nesse horário; passe a "Composição Manual" para completar.')
  }

  async function confirmar(imprimir: boolean) {
    if (!f.tema || !f.estudante || !f.orientador || !f.quando) return setMsg('Preencha todos os campos obrigatórios.')
    const ids = slots.filter(Boolean) as string[]
    if (slots.slice(0, 3).some(s => !s)) return setMsg('Presidente e dois vogais são obrigatórios.')
    if (new Set(ids).size !== ids.length || ids.includes(f.orientador)) return setMsg('Há docentes repetidos ou o orientador está na mesa.')
    const oc = await ocupadosEm(f.quando)
    if (ids.some(i => oc.has(i))) return setMsg('Algum docente já tem júri neste horário.')
    const { data: j, error } = await supabase.from('juris').insert({
      tema: f.tema, estudante: f.estudante, orientador_id: f.orientador, modo,
      palavras_chave: f.palavras.split(',').map(s => s.trim()).filter(Boolean),
      data_hora: new Date(f.quando).toISOString(),
    }).select().single()
    if (error || !j) return setMsg(error?.message ?? 'Erro ao guardar.')
    const { error: e2 } = await supabase.from('juri_membros').insert(
      slots.flatMap((id, i) => (id ? [{ juri_id: j.id, docente_id: id, papel: PAPEIS[i], compatibilidade: compat[i] }] : []))
    )
    if (e2) { await supabase.from('juris').delete().eq('id', j.id); return setMsg(e2.message) }
    if (imprimir) return router.push(`/bancas/${j.id}?auto=1`)
    setMsg('Júri agendado com sucesso.'); setUltimo(j.id); setF(VAZIO)
    setSlots([null, null, null, null]); setCompat([null, null, null, null])
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold"><i className="fa-solid fa-wand-magic-sparkles text-amber-500 mr-2" />Agendamento Inteligente de Mesa Examinadora</h3>
            <p className="text-xs text-slate-500">No modo automático, o agente analisa currículos, formações e orientações e escolhe a mesa. No manual, escolhe e pesquisa tu.</p>
          </div>
          <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 self-start">
            {(['auto', 'manual'] as const).map(m => (
              <button key={m} onClick={() => setModo(m)} className={`px-4 py-2 rounded-lg text-xs font-bold ${modo === m ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'}`}>
                {m === 'auto' ? 'Automático (IA)' : 'Composição Manual'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2"><label className={lbl}>Tema / Título do TCC *</label><input className={inp} value={f.tema} onChange={set('tema')} placeholder="Ex: Aplicação de Deep Learning no Diagnóstico Precoce de Imagens Médicas" /></div>
          <div><label className={lbl}>Palavras-Chave (vírgulas)</label><input className={inp} value={f.palavras} onChange={set('palavras')} placeholder="IA, Visão Computacional, Saúde" /></div>
          <div><label className={lbl}>Candidato / Estudante *</label>
            <input className={inp} list="lista-estudantes" value={f.estudante} onChange={set('estudante')} placeholder="Escreva ou escolha um estudante registado" />
            <datalist id="lista-estudantes">{estudantes.map(n => <option key={n} value={n} />)}</datalist></div>
          <div><label className={lbl}>Orientador * <span className="font-normal text-slate-400">(pesquise pelo nome)</span></label>
            <Combobox opcoes={opcoes} value={f.orientador} onChange={escolherOrientador} placeholder="Pesquisar orientador..." /></div>
          <div><label className={lbl}>Data e Hora *</label><input type="datetime-local" className={inp} value={f.quando} onChange={set('quando')} /></div>
        </div>
        {modo === 'auto' && (
          <div className="mt-6 flex justify-end">
            <button onClick={gerar} disabled={busy} className="bg-gradient-to-r from-brand-600 to-cyan-600 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg disabled:opacity-60">
              <i className="fa-solid fa-microchip mr-2" />{busy ? 'A analisar...' : 'Analisar Currículos & Gerar Mesa Automática'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <h4 className="font-bold text-lg">Composição Proposta da Mesa Examinadora</h4>
        <p className="text-xs text-slate-500 mb-4">{modo === 'auto' ? 'Mesa escolhida pelo agente. Para a alterar, passe a "Composição Manual".' : 'Pesquise e escolha o docente de cada lugar.'}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {ROTULOS.map((r, i) => {
            const d = docs.find(x => x.id === slots[i])
            return (
              <div key={r} className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col justify-between">
                <div>
                  <span className={`text-xs font-extrabold uppercase px-2.5 py-1 text-white rounded-md ${i === 0 ? 'bg-slate-900' : i === 3 ? 'bg-slate-400' : 'bg-brand-600'}`}>{r}</span>
                  <div className="mt-3">
                    {modo === 'manual' ? (
                      <>
                        <Combobox opcoes={opcoesSlot(i)} value={slots[i] ?? ''} onChange={id => escolher(i, id)} placeholder="Pesquisar docente..." />
                        {d && <p className="text-xs text-slate-500 mt-2">{d.grau}</p>}
                      </>
                    ) : d ? (
                      <div className="text-center py-2">
                        <div className="w-12 h-12 mx-auto rounded-full bg-brand-600 text-white font-bold flex items-center justify-center">{d.nome.charAt(0)}</div>
                        <p className="font-semibold text-sm mt-2">{d.nome}</p><p className="text-xs text-slate-500">{d.grau}</p>
                      </div>
                    ) : (
                      <div className="text-center py-3 text-slate-400 text-xs"><i className="fa-solid fa-user-tie text-2xl mb-2 block" />Nenhum docente alocado</div>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-slate-500">Compatibilidade: <b className="text-slate-700">{compat[i] != null ? `${compat[i]}%` : '--'}</b></div>
              </div>
            )
          })}
        </div>
        {msg && <p className="mt-4 text-sm text-slate-700">{msg}</p>}
        {ultimo && (
          <Link href={`/bancas/${ultimo}`} className="inline-flex items-center mt-3 h-10 px-5 rounded-md border border-brand-600 text-brand-700 text-sm font-semibold hover:bg-brand-50">
            <i className="fa-solid fa-print mr-2" />Imprimir a mesa agendada
          </Link>
        )}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap justify-end gap-3">
          <button onClick={() => confirmar(true)} className="h-11 px-5 rounded-md border border-brand-600 text-brand-700 hover:bg-brand-50 font-bold text-sm">
            <i className="fa-solid fa-print mr-2" />Confirmar e Imprimir
          </button>
          <button onClick={() => confirmar(false)} className="h-11 px-5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm">
            <i className="fa-solid fa-check mr-2" />Confirmar e Salvar Agendamento
          </button>
        </div>
      </div>
    </div>
  )
}
