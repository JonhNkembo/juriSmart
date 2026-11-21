'use client'
import { useEffect, useState } from 'react'
import Barra from '../Barra'
import { horasDoDia, rotuloDia } from '@/lib/slots'

type DiaDemo = { data: string; horas: { hora: string; livre: boolean }[] }
const p2 = (n: number) => String(n).padStart(2, '0')

// Ocupação inventada, mas estável para o mesmo dia.
const ocupado = (data: string, hora: string) => {
  let h = 0
  for (const c of data + hora) h = (h * 31 + c.charCodeAt(0)) % 997
  return h % 100 < 38
}

function proximosDias(): DiaDemo[] {
  const out: DiaDemo[] = []
  const d = new Date()
  while (out.length < 6) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    const data = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
    out.push({ data, horas: horasDoDia({ hora_inicio: '08:00', hora_fim: '16:00', duracao_min: 60 }).map(hora => ({ hora, livre: !ocupado(data, hora) })) })
  }
  return out
}

/** Exemplo do que se vê ao agendar: só os dias abertos e as horas livres de cada um. */
export default function DatasDemo() {
  const [dias, setDias] = useState<DiaDemo[]>([])
  const [dia, setDia] = useState(0)
  const [hora, setHora] = useState<string | null>(null)
  useEffect(() => { setDias(proximosDias()) }, [])

  const atual = dias[dia]
  return (
    <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6">
      <div className="text-slate-700 leading-relaxed space-y-4">
        <p>Antes de agendar, o administrador abre um dia ou um intervalo de dias e diz a que horas começam e acabam as defesas e quanto dura cada uma.</p>
        <ul className="space-y-2.5 text-sm">
          <li className="flex gap-3"><i className="fa-solid fa-check text-emerald-600 mt-1" /><span>Os dias passados e os dias fechados não aparecem.</span></li>
          <li className="flex gap-3"><i className="fa-solid fa-check text-emerald-600 mt-1" /><span>Uma hora ocupada por outra banca deixa de estar disponível.</span></li>
          <li className="flex gap-3"><i className="fa-solid fa-check text-emerald-600 mt-1" /><span>A barra de cada dia mostra quantas horas já estão tomadas.</span></li>
        </ul>
        <p className="text-xs text-slate-500">À direita, um exemplo com datas e ocupações inventadas. Escolha um dia e uma hora.</p>
      </div>

      <div className="bg-paper-50 border border-paper-300 p-5 sm:p-6">
        {atual ? (
          <>
            <p className="text-sm font-semibold text-slate-700 mb-3">Dia da defesa</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2" role="listbox" aria-label="Dias abertos">
              {dias.map((d, i) => {
                const livres = d.horas.filter(h => h.livre).length
                return (
                  <button key={d.data} role="option" aria-selected={dia === i} onClick={() => { setDia(i); setHora(null) }}
                    className={`p-2.5 border text-left ${dia === i ? 'bg-brand-900 text-white border-brand-900' : 'bg-white border-slate-300 hover:border-brand-600'}`}>
                    <span className="block text-[11px] opacity-70 capitalize">{rotuloDia(d.data, { weekday: 'short' })}</span>
                    <span className="block text-xl font-bold leading-none my-0.5">{d.data.slice(8)}</span>
                    <Barra valor={d.horas.length - livres} max={d.horas.length} altura="h-1" cor={dia === i ? 'bg-amber-400' : 'bg-brand-600'} className={dia === i ? '!bg-white/25' : ''} rotulo={`Ocupação de ${d.data}`} />
                    <span className="block text-[11px] mt-1 opacity-80">{livres} livres</span>
                  </button>
                )
              })}
            </div>

            <p className="text-sm font-semibold text-slate-700 mt-5 mb-3">Hora <span className="font-normal text-slate-500 capitalize">({rotuloDia(atual.data, { weekday: 'long', day: 'numeric', month: 'long' })})</span></p>
            <div className="flex flex-wrap gap-2">
              {atual.horas.map(h => (
                <button key={h.hora} disabled={!h.livre} onClick={() => setHora(h.hora)} aria-pressed={hora === h.hora}
                  className={`h-9 px-3 text-sm border ${!h.livre ? 'bg-slate-100 text-slate-400 line-through cursor-not-allowed border-slate-200' : hora === h.hora ? 'bg-amber-400 text-brand-900 border-amber-400 font-bold' : 'bg-white border-slate-300 hover:border-brand-600'}`}>
                  {h.hora}
                </button>
              ))}
            </div>
            <p className="text-sm mt-4 min-h-[1.5rem]" aria-live="polite">
              {hora ? <><i className="fa-solid fa-circle-check text-emerald-600 mr-2" />Defesa marcada para {rotuloDia(atual.data, { weekday: 'long', day: 'numeric', month: 'long' })}, às {hora}.</> : <span className="text-slate-500">Escolha uma hora livre para marcar.</span>}
            </p>
          </>
        ) : <p className="text-sm text-slate-400">O exemplo de datas aparece aqui.</p>}
      </div>
    </div>
  )
}
