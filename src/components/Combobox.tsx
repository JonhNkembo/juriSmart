'use client'
import { useEffect, useRef, useState } from 'react'

export type Opcao = { id: string; label: string; sub?: string }
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function Combobox({ opcoes, value, onChange, placeholder }: {
  opcoes: Opcao[]; value: string; onChange: (id: string) => void; placeholder?: string
}) {
  const [q, setQ] = useState('')
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const atual = opcoes.find(o => o.id === value)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const lista = opcoes.filter(o => norm(`${o.label} ${o.sub ?? ''}`).includes(norm(q)))
  return (
    <div ref={ref} className="relative">
      <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
      <input
        value={aberto ? q : atual?.label ?? ''}
        onFocus={() => { setQ(''); setAberto(true) }}
        onChange={e => { setQ(e.target.value); setAberto(true) }}
        placeholder={atual ? atual.label : placeholder}
        className="w-full h-11 pl-9 pr-9 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
      />
      {value && (
        <button type="button" aria-label="Limpar" onClick={() => { onChange(''); setQ('') }}
          className="absolute right-0 top-0 h-11 w-9 text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark" /></button>
      )}
      {aberto && (
        <ul className="absolute z-30 mt-1 w-full max-h-60 overflow-auto bg-white border border-slate-200 rounded-md shadow-lg text-sm">
          {lista.map(o => (
            <li key={o.id}>
              <button type="button" onClick={() => { onChange(o.id); setAberto(false) }}
                className={`w-full text-left px-3 py-2 hover:bg-brand-50 ${o.id === value ? 'bg-brand-50' : ''}`}>
                <span className="font-medium text-slate-800">{o.label}</span>
                {o.sub && <span className="block text-xs text-slate-500 truncate">{o.sub}</span>}
              </button>
            </li>
          ))}
          {!lista.length && <li className="px-3 py-2 text-slate-400">Nenhum resultado</li>}
        </ul>
      )}
    </div>
  )
}
