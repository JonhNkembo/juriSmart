'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Docente } from '@/lib/types'
import { rankDocentes, assignSlots, pontuar, justificar, PAPEIS, ROTULOS } from '@/lib/matching'
import Combobox from '@/components/Combobox'
import { notificar, type ResultadoAviso } from '@/lib/notificar'
import SeletorData from '@/components/SeletorData'
import Barra from '@/components/Barra'
import { ocupacaoDoDia, hojeLocal, type DataDefesa, type Dia } from '@/lib/slots'

const inp = 'w-full h-11 px-3.5 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20'
const lbl = 'block text-[13px] font-semibold text-slate-700 mb-1.5'
const VAZIO = { tema: '', palavras: '', estudante: '', orientador: '', quando: '', local: '' }

async function ocupadosEm(quando: string, ignorar?: string) {
  const { data } = await supabase.from('juris').select('id, orientador_id, juri_membros(docente_id)').eq('data_hora', new Date(quando).toISOString())
  const s = new Set<string>()
  ;(data ?? []).forEach((j: { id: string; orientador_id: string; juri_membros: { docente_id: string }[] }) => {
    if (j.id === ignorar) return
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

export default function AgendarForm({ editarId }: { editarId?: string }) {
  const router = useRouter()
  const [docs, setDocs] = useState<Docente[]>([])
  const [estudantes, setEstudantes] = useState<{ id: string; nome: string; email: string }[]>([])
  const [f, setF] = useState(VAZIO)
  const [modo, setModo] = useState<'auto' | 'manual'>('auto')
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null])
  const [compat, setCompat] = useState<(number | null)[]>([null, null, null, null])
  const [just, setJust] = useState<string[]>(['', '', '', ''])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [ultimo, setUltimo] = useState<string | null>(null)
  const [avisar, setAvisar] = useState(true)
  const [carregado, setCarregado] = useState(!editarId)
  const [orig, setOrig] = useState<{ modo: 'auto' | 'manual'; slots: (string | null)[] } | null>(null)
  const [comBanca, setComBanca] = useState<Set<string>>(new Set())
  const [datas, setDatas] = useState<DataDefesa[]>([])
  const [tempos, setTempos] = useState<{ id: string; data_hora: string }[]>([])
  const [datasProntas, setDatasProntas] = useState(false)

  useEffect(() => {
    supabase.from('docentes').select('*, curriculo_itens(*)').order('nome').then(({ data }) => setDocs((data ?? []) as Docente[]))
    supabase.from('perfis').select('id,nome,email').eq('perfil', 'avaliador').order('nome').then(({ data }) => setEstudantes((data ?? []) as { id: string; nome: string; email: string }[]))
  }, [])

  useEffect(() => {
    supabase.from('juris').select('id,estudante_id').then(({ data }) => {
      setComBanca(new Set((data ?? []).filter(j => j.estudante_id && j.id !== editarId).map(j => j.estudante_id as string)))
    })
  }, [editarId])

  useEffect(() => {
    supabase.from('datas_defesa').select('*').eq('ativa', true).gte('data', hojeLocal()).order('data')
      .then(({ data }) => { setDatas((data ?? []) as DataDefesa[]); setDatasProntas(true) })
    supabase.from('juris').select('id,data_hora').then(({ data }) => setTempos((data ?? []) as { id: string; data_hora: string }[]))
  }, [])

  // dias abertos com as horas livres; ao editar, o dia da própria banca fica sempre visível
  const dias: Dia[] = useMemo(() => {
    const outros = tempos.filter(t => t.id !== editarId)
    const lista = datas.map(d => ocupacaoDoDia(d, outros))
    const [dq, hq] = f.quando ? f.quando.split('T') : ['', '']
    if (editarId && dq && !lista.some(x => x.dia.data === dq)) {
      const dia: DataDefesa = { id: 'atual', data: dq, hora_inicio: '08:00', hora_fim: '18:00', duracao_min: 60, local: null, ativa: true }
      const o = ocupacaoDoDia(dia, outros, new Date(0))
      const h = o.horas.find(x => x.hora === hq)
      if (h) h.livre = true; else { o.horas.push({ hora: hq, livre: true }); o.horas.sort((a, b) => a.hora.localeCompare(b.hora)) }
      lista.push({ ...o, livres: o.horas.filter(x => x.livre).length, total: o.horas.length, legado: true })
    }
    return lista.sort((a, b) => a.dia.data.localeCompare(b.dia.data))
  }, [datas, tempos, f.quando, editarId])

  useEffect(() => {
    if (!editarId) return
    supabase.from('juris')
      .select('tema,palavras_chave,estudante_id,orientador_id,data_hora,modo,local,juri_membros(docente_id,papel,compatibilidade,justificacao)')
      .eq('id', editarId).single()
      .then(({ data, error }) => {
        if (error || !data) { setMsg('Júri não encontrado.'); return }
        const p = (n: number) => String(n).padStart(2, '0')
        const d = new Date(data.data_hora)
        setF({
          tema: data.tema, palavras: (data.palavras_chave ?? []).join(', '), estudante: data.estudante_id ?? '',
          local: data.local ?? '', orientador: data.orientador_id, quando: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`,
        })
        const s: (string | null)[] = [null, null, null, null]; const c: (number | null)[] = [null, null, null, null]; const j: string[] = ['', '', '', '']
        ;(data.juri_membros as { docente_id: string; papel: string; compatibilidade: number | null; justificacao: string | null }[]).forEach(m => {
          const i = (PAPEIS as readonly string[]).indexOf(m.papel)
          if (i >= 0) { s[i] = m.docente_id; c[i] = m.compatibilidade; j[i] = m.justificacao ?? '' }
        })
        setSlots(s); setCompat(c); setJust(j)
        setModo('manual'); setOrig({ modo: data.modo as 'auto' | 'manual', slots: s }); setCarregado(true)
      })
  }, [editarId])

  const set = (k: keyof typeof VAZIO) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const opcoes = docs.map(d => ({ id: d.id, label: d.nome, sub: `${d.grau} · ${d.especialidades.join(', ')}${d.disponivel ? '' : ' · INDISPONÍVEL'}` }))
  const opcoesEst = estudantes.map(e => ({ id: e.id, label: e.nome, sub: `${e.email}${comBanca.has(e.id) ? ' · já tem banca agendada' : ''}` }))
  const opcoesSlot = (i: number) => opcoes.filter(o => o.id !== f.orientador && !slots.some((s, k) => k !== i && s === o.id))

  function escolherOrientador(id: string) {
    setF({ ...f, orientador: id })
    setCompat(compat.map((c, i) => (slots[i] === id ? null : c)))
    setJust(just.map((t, i) => (slots[i] === id ? '' : t)))
    setSlots(slots.map(s => (s === id ? null : s)))
  }
  async function escolher(i: number, id: string) {
    setSlots(slots.map((s, k) => (k === i ? id || null : s)))
    setCompat(compat.map((c, k) => (k === i ? null : c)))
    setJust(just.map((t, k) => (k === i ? '' : t)))
    const d = docs.find(x => x.id === id)
    if (!d) return
    const ca = await cargas()
    const score = pontuar(f, d, ca)
    setCompat(c => c.map((v, k) => (k === i ? score : v)))
    setJust(j => j.map((t, k) => (k === i ? `Escolhido pela secretaria. ${justificar(f, d, ca[d.id] ?? 0, score)}` : t)))
  }

  async function gerar() {
    if (!f.tema || !f.orientador || !f.quando) return setMsg('Preencha o tema, o orientador e a data.')
    setBusy(true); setMsg('')
    const [oc, ca] = await Promise.all([ocupadosEm(f.quando, editarId), cargas()])
    const r = assignSlots(rankDocentes(f, docs, ca, oc))
    setSlots(r.map(x => x?.docente.id ?? null)); setCompat(r.map(x => x?.score ?? null)); setJust(r.map(x => x?.motivo ?? ''))
    setBusy(false)
    if (r.some(x => !x)) setMsg('Não há docentes disponíveis suficientes nesse horário; passe a "Composição Manual" para completar.')
  }

  async function avisarParticipantes(tipo: 'convocatoria' | 'atualizacao', id: string): Promise<ResultadoAviso | null> {
    return avisar ? notificar(tipo, id) : null
  }
  const guardarAviso = (r: ResultadoAviso | null) => {
    try { if (r) sessionStorage.setItem('jurismart_aviso', JSON.stringify({ ok: r.ok, txt: `Banca guardada. ${r.txt}` })) } catch { /* sem armazenamento */ }
  }

  async function confirmar(imprimir: boolean) {
    if (!f.tema || !f.estudante || !f.orientador || !f.quando) return setMsg('Preencha todos os campos obrigatórios.')
    const est = estudantes.find(e => e.id === f.estudante)
    if (!est) return setMsg('Escolha um estudante registado.')
    const [dq] = f.quando.split('T')
    const diaSel = dias.find(d => d.dia.data === dq)
    if (!diaSel || (diaSel.legado && !editarId)) return setMsg('Escolha um dos dias abertos para as defesas.')
    const t0 = new Date(f.quando).getTime()
    const folga = (diaSel.dia.duracao_min - 1) * 60000
    const { data: choque } = await supabase.from('juris').select('id').gte('data_hora', new Date(t0 - folga).toISOString()).lte('data_hora', new Date(t0 + folga).toISOString())
    if ((choque ?? []).some(c => c.id !== editarId)) return setMsg('Esse horário acabou de ser ocupado por outra banca. Escolha outra hora.')
    const ids = slots.filter(Boolean) as string[]
    if (slots.slice(0, 3).some(s => !s)) return setMsg('Presidente e dois vogais são obrigatórios.')
    if (new Set(ids).size !== ids.length || ids.includes(f.orientador)) return setMsg('Há docentes repetidos ou o orientador está na mesa.')
    const oc = await ocupadosEm(f.quando, editarId)
    if (ids.some(i => oc.has(i))) return setMsg('Algum docente já tem júri neste horário.')
    if (editarId) {
      const mudouMesa = !orig || slots.some((s, i) => s !== orig.slots[i])
      const membros = slots.flatMap((id, i) => (id ? [{ docente_id: id, papel: PAPEIS[i], compatibilidade: compat[i], justificacao: just[i].trim() || 'Escolha manual do administrador.' }] : []))
      const { error: e1 } = await supabase.rpc('substituir_membros', { p_juri: editarId, p_membros: membros })
      if (e1) return setMsg(e1.message)
      const { error: e2 } = await supabase.from('juris').update({
        tema: f.tema, estudante: est.nome, estudante_id: est.id, orientador_id: f.orientador,
        modo: mudouMesa ? 'manual' : orig?.modo ?? 'manual',
        palavras_chave: f.palavras.split(',').map(s => s.trim()).filter(Boolean),
        data_hora: new Date(f.quando).toISOString(), local: f.local.trim() || null,
      }).eq('id', editarId)
      if (e2) return setMsg(e2.message)
      guardarAviso(await avisarParticipantes('atualizacao', editarId))
      return router.push(imprimir ? `/bancas/${editarId}?auto=1` : '/bancas')
    }
    const { data: j, error } = await supabase.from('juris').insert({
      tema: f.tema, estudante: est.nome, estudante_id: est.id, orientador_id: f.orientador, modo,
      palavras_chave: f.palavras.split(',').map(s => s.trim()).filter(Boolean),
      data_hora: new Date(f.quando).toISOString(), local: f.local.trim() || null,
    }).select().single()
    if (error || !j) return setMsg(error?.message ?? 'Erro ao guardar.')
    const { error: e2 } = await supabase.from('juri_membros').insert(
      slots.flatMap((id, i) => (id ? [{ juri_id: j.id, docente_id: id, papel: PAPEIS[i], compatibilidade: compat[i], justificacao: just[i].trim() || 'Escolha manual do administrador.' }] : []))
    )
    if (e2) { await supabase.from('juris').delete().eq('id', j.id); return setMsg(e2.message) }
    const aviso = await avisarParticipantes('convocatoria', j.id)
    if (imprimir) { guardarAviso(aviso); return router.push(`/bancas/${j.id}?auto=1`) }
    setMsg(`Júri agendado com sucesso.${aviso ? ' ' + aviso.txt : ''}`); setUltimo(j.id); setF(VAZIO)
    setSlots([null, null, null, null]); setCompat([null, null, null, null]); setJust(['', '', '', ''])
  }

  if (!carregado) return <div className="max-w-md"><p className="text-sm text-slate-500 mb-2">{msg || 'A carregar a banca...'}</p>{!msg && <Barra indeterminada altura="h-1.5" rotulo="A carregar" />}</div>

  const etapas = [
    { t: 'Trabalho e pessoas', ok: !!(f.tema && f.estudante && f.orientador) },
    { t: 'Dia, hora e local', ok: !!f.quando },
    { t: 'Mesa examinadora', ok: slots.slice(0, 3).every(Boolean) },
  ]
  const feitas = etapas.filter(e => e.ok).length

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">Progresso do agendamento</span>
          <span className="text-slate-500">{feitas} de {etapas.length} etapas</span>
        </div>
        <Barra valor={feitas} max={etapas.length} cor={feitas === etapas.length ? 'bg-emerald-600' : 'bg-brand-600'} className="mt-2" rotulo="Progresso do agendamento" />
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-xs">
          {etapas.map(e => (
            <li key={e.t} className={e.ok ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
              <i className={`fa-solid ${e.ok ? 'fa-circle-check' : 'fa-circle'} mr-1.5 ${e.ok ? '' : 'text-[9px] text-slate-300'}`} />{e.t}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold"><i className={`fa-solid ${editarId ? 'fa-pen-to-square' : 'fa-wand-magic-sparkles'} text-amber-500 mr-2`} />{editarId ? 'Editar Banca Agendada' : 'Agendamento Inteligente de Mesa Examinadora'}</h3>
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
          <div><label className={lbl}>Candidato / Estudante * <span className="font-normal text-slate-400">(estudantes registados)</span></label>
            <Combobox opcoes={opcoesEst} value={f.estudante} onChange={id => setF({ ...f, estudante: id })} placeholder="Pesquisar estudante..." />
            {!estudantes.length && <p className="text-xs text-amber-700 mt-1.5">Ainda não há estudantes registados. Peça-lhes para criar conta com o perfil Avaliador (Estudante).</p>}</div>
          <div><label className={lbl}>Orientador * <span className="font-normal text-slate-400">(pesquise pelo nome)</span></label>
            <Combobox opcoes={opcoes} value={f.orientador} onChange={escolherOrientador} placeholder="Pesquisar orientador..." /></div>
          <div className="md:col-span-2 lg:col-span-3"><label className={lbl}>Dia e hora da defesa *</label>
            <SeletorData dias={dias} valor={f.quando} carregado={datasProntas}
              onEscolher={(q, dia) => setF({ ...f, quando: q, local: f.local || dia.local || '' })} /></div>
          <div className="md:col-span-2 lg:col-span-3"><label className={lbl}><i className="fa-solid fa-location-dot text-brand-600 mr-1.5" />Local da defesa</label>
            <input className={inp} value={f.local} onChange={set('local')} placeholder="Ex.: Sala 12, Bloco B — ou Auditório Principal" maxLength={120} /></div>
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
                        {d && <textarea rows={3} value={just[i]} onChange={e => setJust(just.map((t, k) => (k === i ? e.target.value : t)))}
                          placeholder="Justificação da escolha (o estudante vai ler isto)" className="w-full mt-2 p-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:border-brand-600" />}
                      </>
                    ) : d ? (
                      <div className="text-center py-2">
                        <div className="w-12 h-12 mx-auto rounded-full bg-brand-600 text-white font-bold flex items-center justify-center">{d.nome.charAt(0)}</div>
                        <p className="font-semibold text-sm mt-2">{d.nome}</p><p className="text-xs text-slate-500">{d.grau}</p>
                        {just[i] && <p className="text-[11px] text-slate-500 mt-2 text-left leading-snug">{just[i]}</p>}
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
        <label className="flex items-center gap-2 text-sm text-slate-700 mt-5 cursor-pointer">
          <input type="checkbox" checked={avisar} onChange={e => setAvisar(e.target.checked)} />
          <span><i className="fa-solid fa-envelope mr-1.5 text-brand-600" />Avisar por email o estudante, o orientador e os júris escolhidos</span>
        </label>
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-end gap-3">
          {editarId && <Link href="/bancas" className="h-11 px-5 inline-flex items-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-sm">Cancelar</Link>}
          <button onClick={() => confirmar(true)} className="h-11 px-5 rounded-md border border-brand-600 text-brand-700 hover:bg-brand-50 font-bold text-sm">
            <i className="fa-solid fa-print mr-2" />{editarId ? 'Guardar e Imprimir' : 'Confirmar e Imprimir'}
          </button>
          <button onClick={() => confirmar(false)} className="h-11 px-5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm">
            <i className="fa-solid fa-check mr-2" />{editarId ? 'Guardar Alterações' : 'Confirmar e Salvar Agendamento'}
          </button>
        </div>
      </div>
    </div>
  )
}
