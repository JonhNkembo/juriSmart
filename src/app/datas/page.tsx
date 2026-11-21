'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Barra from '@/components/Barra'
import { hhmm, hojeLocal, horasDoDia, ocupacaoDoDia, rotuloDia, type DataDefesa } from '@/lib/slots'

const inp = 'w-full h-11 px-3.5 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20'
const lbl = 'block text-[13px] font-semibold text-slate-700 mb-1.5'
const p2 = (n: number) => String(n).padStart(2, '0')
type Aviso = { ok: boolean; txt: string } | null

function intervalo(de: string, ate: string, diasUteis: boolean): string[] {
  const out: string[] = []
  const d = new Date(`${de}T12:00:00`), fim = new Date(`${ate || de}T12:00:00`)
  for (let n = 0; d <= fim && n < 180; n++, d.setDate(d.getDate() + 1)) {
    if (diasUteis && (d.getDay() === 0 || d.getDay() === 6)) continue
    out.push(`${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`)
  }
  return out
}

export default function Datas() {
  const [datas, setDatas] = useState<DataDefesa[]>([])
  const [tempos, setTempos] = useState<{ id: string; data_hora: string }[]>([])
  const [pronto, setPronto] = useState(false)
  const [aviso, setAviso] = useState<Aviso>(null)
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState({ de: '', ate: '', uteis: true, inicio: '08:00', fim: '17:00', duracao: '60', local: '' })

  const load = useCallback(async () => {
    const [{ data: d }, { data: j }] = await Promise.all([
      supabase.from('datas_defesa').select('*').order('data'),
      supabase.from('juris').select('id,data_hora'),
    ])
    setDatas((d ?? []) as DataDefesa[]); setTempos((j ?? []) as { id: string; data_hora: string }[]); setPronto(true)
  }, [])
  useEffect(() => { load() }, [load])

  const hoje = hojeLocal()
  // ocupação só pelas bancas (os horários que já passaram não contam como ocupados)
  const linhas = useMemo(() => datas.map(d => {
    const o = ocupacaoDoDia(d, tempos, new Date(0))
    return { d, ocupadas: o.total - o.livres, total: o.total }
  }), [datas, tempos])
  const futuras = linhas.filter(l => l.d.data >= hoje)
  const passadas = linhas.filter(l => l.d.data < hoje).reverse()
  const totalH = futuras.filter(l => l.d.ativa).reduce((a, l) => a + l.total, 0)
  const ocupH = futuras.filter(l => l.d.ativa).reduce((a, l) => a + l.ocupadas, 0)

  async function abrir(e: React.FormEvent) {
    e.preventDefault(); setAviso(null)
    if (!f.de) return setAviso({ ok: false, txt: 'Escolha a data (ou a primeira data do intervalo).' })
    if (f.de < hoje) return setAviso({ ok: false, txt: 'Não se abrem datas que já passaram.' })
    if (f.ate && f.ate < f.de) return setAviso({ ok: false, txt: 'A data final é anterior à inicial.' })
    if (f.fim <= f.inicio) return setAviso({ ok: false, txt: 'A hora de fim tem de ser depois da hora de início.' })
    const duracao = Number(f.duracao)
    if (horasDoDia({ hora_inicio: f.inicio, hora_fim: f.fim, duracao_min: duracao }).length === 0) return setAviso({ ok: false, txt: 'Com esta duração não cabe nenhuma defesa no horário indicado.' })
    const dias = intervalo(f.de, f.ate, f.uteis)
    if (!dias.length) return setAviso({ ok: false, txt: 'O intervalo não tem dias úteis.' })
    const novos = dias.filter(x => !datas.some(d => d.data === x))
    if (!novos.length) return setAviso({ ok: false, txt: 'Esses dias já estão abertos.' })
    setBusy(true)
    const { error } = await supabase.from('datas_defesa').insert(novos.map(data => ({
      data, hora_inicio: f.inicio, hora_fim: f.fim, duracao_min: duracao, local: f.local.trim() || null,
    })))
    setBusy(false)
    if (error) return setAviso({ ok: false, txt: error.message })
    setAviso({ ok: true, txt: `${novos.length} ${novos.length === 1 ? 'dia aberto' : 'dias abertos'} para defesas.` })
    setF({ ...f, de: '', ate: '' }); load()
  }

  async function alternar(d: DataDefesa) {
    const { error } = await supabase.from('datas_defesa').update({ ativa: !d.ativa }).eq('id', d.id)
    setAviso(error ? { ok: false, txt: error.message } : null); load()
  }
  async function apagar(d: DataDefesa, ocupadas: number) {
    const aviso2 = ocupadas > 0 ? ` Já existem ${ocupadas} banca(s) neste dia; elas mantêm-se, mas o dia deixa de estar aberto.` : ''
    if (!window.confirm(`Remover o dia ${rotuloDia(d.data, { day: 'numeric', month: 'long', year: 'numeric' })}?${aviso2}`)) return
    const { error } = await supabase.from('datas_defesa').delete().eq('id', d.id)
    setAviso(error ? { ok: false, txt: error.message } : { ok: true, txt: 'Dia removido.' }); load()
  }

  const Linha = ({ l, passada = false }: { l: (typeof linhas)[number]; passada?: boolean }) => (
    <li className={`grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] gap-x-4 gap-y-2 items-center px-5 py-3.5 ${l.d.ativa && !passada ? '' : 'bg-slate-50 text-slate-400'}`}>
      <div>
        <p className="font-semibold capitalize">{rotuloDia(l.d.data, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <p className="text-xs text-slate-500">{l.d.local || 'Sem local definido'}</p>
      </div>
      <p className="text-sm">{hhmm(l.d.hora_inicio)} às {hhmm(l.d.hora_fim)}<span className="block text-xs text-slate-500">{l.d.duracao_min} min por defesa</span></p>
      <div>
        <Barra valor={l.ocupadas} max={l.total || 1} cor={l.ocupadas >= l.total ? 'bg-rose-500' : 'bg-brand-600'} rotulo={`Ocupação de ${l.d.data}`} />
        <p className="text-xs text-slate-500 mt-1">{l.ocupadas} de {l.total} horários ocupados</p>
      </div>
      <div className="flex gap-2 sm:justify-end">
        {!passada && <button onClick={() => alternar(l.d)} className={`h-8 px-3 rounded-md border text-xs font-semibold ${l.d.ativa ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-slate-300 text-slate-600 bg-white'}`}>{l.d.ativa ? 'Aberta' : 'Fechada'}</button>}
        <button onClick={() => apagar(l.d, l.ocupadas)} aria-label="Remover dia" className="h-8 w-8 rounded-md border border-rose-200 text-rose-600 bg-white hover:bg-rose-50"><i className="fa-solid fa-trash text-xs" /></button>
      </div>
    </li>
  )

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-bold">Datas de defesa</h2>
        <p className="text-sm text-slate-500 mt-1">Só se pode agendar uma banca nos dias abertos aqui. Cada dia tem as suas horas e a duração de cada defesa.</p>
      </div>

      <section className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">Horários ocupados nos próximos dias abertos</span>
          <span className="text-slate-500">{ocupH} de {totalH}</span>
        </div>
        <Barra valor={ocupH} max={totalH || 1} cor={totalH && ocupH / totalH > 0.85 ? 'bg-rose-500' : 'bg-brand-600'} className="mt-2" rotulo="Ocupação geral" />
        {pronto && futuras.filter(l => l.d.ativa).length === 0 && <p className="text-sm text-amber-700 mt-3"><i className="fa-solid fa-triangle-exclamation mr-2" />Não há dias abertos: sem eles, não é possível agendar nenhuma banca.</p>}
      </section>

      <form onSubmit={abrir} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <h3 className="bg-brand-900 text-white text-sm font-bold px-6 py-3 border-b-4 border-amber-400"><i className="fa-solid fa-calendar-plus mr-2" />Abrir datas</h3>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div><label className={lbl}>Primeiro dia *</label><input type="date" min={hoje} className={inp} value={f.de} onChange={e => setF({ ...f, de: e.target.value })} /></div>
          <div><label className={lbl}>Último dia <span className="font-normal text-slate-400">(opcional, para abrir vários)</span></label><input type="date" min={f.de || hoje} className={inp} value={f.ate} onChange={e => setF({ ...f, ate: e.target.value })} /></div>
          <label className="flex items-end gap-2 pb-3 text-sm text-slate-700"><input type="checkbox" checked={f.uteis} onChange={e => setF({ ...f, uteis: e.target.checked })} />Só dias úteis (sem sábados e domingos)</label>
          <div><label className={lbl}>Primeira defesa às</label><input type="time" className={inp} value={f.inicio} onChange={e => setF({ ...f, inicio: e.target.value })} /></div>
          <div><label className={lbl}>Termina às</label><input type="time" className={inp} value={f.fim} onChange={e => setF({ ...f, fim: e.target.value })} /></div>
          <div><label className={lbl}>Duração de cada defesa</label>
            <select className={inp} value={f.duracao} onChange={e => setF({ ...f, duracao: e.target.value })}>{[30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} minutos</option>)}</select></div>
          <div className="md:col-span-3"><label className={lbl}>Local <span className="font-normal text-slate-400">(opcional; sugerido ao agendar)</span></label>
            <input className={inp} value={f.local} onChange={e => setF({ ...f, local: e.target.value })} placeholder="Ex.: Sala de Defesas, Bloco B" maxLength={120} /></div>
        </div>
        <div className="px-6 pb-6 flex flex-wrap items-center gap-4">
          <button disabled={busy} className="h-11 px-6 rounded-md bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white text-sm font-semibold shadow-sm">{busy ? 'A abrir...' : 'Abrir datas'}</button>
          {aviso && <p className={`text-sm ${aviso.ok ? 'text-emerald-700' : 'text-rose-600'}`}><i className={`fa-solid ${aviso.ok ? 'fa-circle-check' : 'fa-circle-exclamation'} mr-2`} />{aviso.txt}</p>}
        </div>
      </form>

      <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <h3 className="px-5 py-3 text-sm font-bold border-b border-slate-200">Próximas datas {pronto && <span className="font-normal text-slate-500">({futuras.length})</span>}</h3>
        {!pronto ? <div className="p-5"><Barra indeterminada altura="h-1.5" rotulo="A carregar" /></div>
          : futuras.length ? <ul className="divide-y divide-slate-100">{futuras.map(l => <Linha key={l.d.id} l={l} />)}</ul>
          : <p className="p-5 text-sm text-slate-400">Ainda não abriu nenhuma data. Use o formulário acima.</p>}
      </section>

      {passadas.length > 0 && (
        <details className="bg-white rounded-lg border border-slate-200">
          <summary className="px-5 py-3 text-sm font-semibold cursor-pointer">Datas passadas ({passadas.length})</summary>
          <ul className="divide-y divide-slate-100 border-t border-slate-100">{passadas.map(l => <Linha key={l.d.id} l={l} passada />)}</ul>
        </details>
      )}
    </div>
  )
}
