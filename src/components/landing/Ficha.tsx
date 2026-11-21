'use client'
import { useState } from 'react'
import Barra from '../Barra'

const MESA = [
  ['Presidente', 'Dra. Helena Cardoso'],
  ['1.º Vogal', 'Msc. Paulo Kiala'],
  ['2.º Vogal', 'Msc. Isabel Domingos'],
  ['Suplente', 'Lic. Rosa Tchissola'],
]

/** Reprodução da ficha de banca que o sistema imprime (dados inventados, só para mostrar). */
export default function Ficha() {
  const [examinada, setExaminada] = useState(false)
  return (
    <div className="relative max-w-md mx-auto lg:mx-0 lg:ml-auto">
      <div className="relative bg-white border border-slate-300 border-t-4 border-t-brand-900 shadow-sm p-6 sm:p-7 overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b-2 border-brand-900 pb-3">
          <div>
            <p className="text-xs text-slate-500">Ficha de convocatória</p>
            <h3 className="font-display text-xl font-bold text-brand-900 leading-tight">Defesa de TCC</h3>
          </div>
          <span className="text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5">Exemplo</span>
        </div>

        <dl className="grid grid-cols-[5.5rem_1fr] gap-y-1.5 text-[13px] mt-4">
          <dt className="text-slate-500">Candidata</dt><dd className="font-semibold text-slate-900">Ana Beatriz Quintas</dd>
          <dt className="text-slate-500">Tema</dt><dd className="font-semibold text-slate-900">Segurança em redes sem fios numa universidade</dd>
          <dt className="text-slate-500">Data</dt><dd className="font-semibold text-slate-900">Quinta-feira, 12 de março, às 10h00</dd>
          <dt className="text-slate-500">Local</dt><dd className="font-semibold text-slate-900">Sala 12, Bloco B</dd>
          <dt className="text-slate-500">Orientador</dt><dd className="font-semibold text-slate-900">Dr. Joaquim Bento</dd>
        </dl>

        <p className="text-xs font-semibold text-slate-600 mt-5 mb-1">Mesa examinadora</p>
        <ul className="text-[13px]">
          {MESA.map(([c, n]) => (
            <li key={c} className="flex items-end gap-2 py-1.5">
              <span className="w-[4.5rem] shrink-0 text-slate-500">{c}</span>
              <span className="font-semibold text-slate-900 shrink-0">{n}</span>
              <span className="flex-1 border-b border-dashed border-slate-300 mb-1" aria-hidden />
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5"><span>Marcada</span><span className={examinada ? 'text-emerald-700 font-semibold' : ''}>Examinada</span></div>
          <Barra valor={examinada ? 100 : 50} cor={examinada ? 'bg-emerald-600' : 'bg-amber-400'} rotulo="Estado da banca" />
        </div>

        {examinada && (
          <div className="carimbo absolute right-5 top-[46%] border-4 border-emerald-700 text-emerald-700 font-extrabold tracking-[.25em] text-lg px-3 py-1 bg-white/40 pointer-events-none select-none">
            EXAMINADA
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button onClick={() => setExaminada(v => !v)}
          className="h-10 px-4 text-sm font-semibold border-2 border-brand-900 text-brand-900 hover:bg-brand-900 hover:text-white transition rounded-md">
          {examinada ? 'Reabrir a banca' : 'Marcar como examinada'}
        </button>
        <p className="text-xs text-slate-500 min-h-[2rem] flex items-center" aria-live="polite">
          {examinada ? 'No sistema, a candidata, o orientador e os júris recebem um email.' : 'Experimente: é assim que o administrador fecha uma banca.'}
        </p>
      </div>
    </div>
  )
}
