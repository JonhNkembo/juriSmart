'use client'
import Link from 'next/link'
import Barra from './Barra'
import { rotuloDia, type DataDefesa, type Dia } from '@/lib/slots'

/** Escolha do dia (entre os dias abertos) e da hora (entre as livres). O valor é "AAAA-MM-DDTHH:mm". */
export default function SeletorData({ dias, valor, onEscolher, carregado }: {
  dias: Dia[]; valor: string; onEscolher: (quando: string, dia: DataDefesa) => void; carregado: boolean
}) {
  const [dq, hq] = valor ? valor.split('T') : ['', '']
  const sel = dias.find(d => d.dia.data === dq)

  if (carregado && dias.length === 0) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <i className="fa-solid fa-calendar-xmark mr-2" />Não há dias abertos para defesas. Só se pode agendar em dias que a secretaria abriu.
        <Link href="/datas" className="ml-2 font-semibold underline">Abrir datas de defesa</Link>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-xs text-slate-500 mb-2">Dias abertos pela secretaria. A barra mostra as horas já ocupadas.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2" role="listbox" aria-label="Dias abertos">
        {dias.map(d => {
          const ativo = d.dia.data === dq
          const lotado = d.livres === 0 && !ativo
          return (
            <button key={d.dia.data} type="button" role="option" aria-selected={ativo} disabled={lotado}
              onClick={() => { const h = d.horas.find(x => x.livre)?.hora; if (h) onEscolher(`${d.dia.data}T${h}`, d.dia) }}
              className={`text-left p-2.5 rounded-md border ${ativo ? 'bg-brand-900 text-white border-brand-900' : lotado ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-300 hover:border-brand-600'}`}>
              <span className="block text-[11px] opacity-70 capitalize">{rotuloDia(d.dia.data, { weekday: 'short' })}</span>
              <span className="block text-xl font-bold leading-none my-0.5">{d.dia.data.slice(8)} <span className="text-xs font-medium opacity-70">{rotuloDia(d.dia.data, { month: 'short' })}</span></span>
              <Barra valor={d.total - d.livres} max={d.total || 1} altura="h-1" cor={ativo ? 'bg-amber-400' : 'bg-brand-600'} className={ativo ? '!bg-white/25' : ''} rotulo={`Ocupação de ${d.dia.data}`} />
              <span className="block text-[11px] mt-1 opacity-80">{lotado ? 'Lotado' : `${d.livres} livre${d.livres === 1 ? '' : 's'}`}</span>
            </button>
          )
        })}
      </div>

      {sel ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-700 mb-2">
            Hora <span className="font-normal text-slate-500 capitalize">({rotuloDia(sel.dia.data, { weekday: 'long', day: 'numeric', month: 'long' })}, {sel.dia.duracao_min} min por defesa)</span>
            {sel.legado && <span className="ml-2 text-xs font-normal text-amber-700">dia fora das datas abertas, mantido porque é o da banca</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {sel.horas.map(h => {
              const ativa = h.hora === hq
              return (
                <button key={h.hora} type="button" disabled={!h.livre && !ativa} aria-pressed={ativa}
                  onClick={() => onEscolher(`${sel.dia.data}T${h.hora}`, sel.dia)}
                  className={`h-9 px-3 text-sm rounded-md border ${ativa ? 'bg-amber-400 text-brand-900 border-amber-400 font-bold' : !h.livre ? 'bg-slate-100 text-slate-400 line-through cursor-not-allowed border-slate-200' : 'bg-white border-slate-300 hover:border-brand-600'}`}>
                  {h.hora}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 mt-4"><i className="fa-regular fa-hand-pointer mr-2" />Escolha um dia para ver as horas livres.</p>
      )}
    </div>
  )
}
