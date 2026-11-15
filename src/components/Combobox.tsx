'use client'
import { useEffect, useRef, useState } from 'react'

export type Opcao = { id: string; label: string; sub?: string }
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** Botão de seleção que abre uma lista com caixa de pesquisa. */
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
  const abrir = () => { setQ(''); setAberto(a => !a) }

  return (
    <div ref={ref} className="relative" onKeyDown={e => { if (e.key === 'Escape') setAberto(false) }}>
      <button type="button" onClick={abrir}
        className={`w-full h-11 px-3.5 flex items-center justify-between gap-2 rounded-md border bg-white text-sm text-left transition ${aberto ? 'border-brand-600 ring-2 ring-brand-600/20' : 'border-slate-300 hover:border-slate-400'}`}>
        <span className={`truncate ${atual ? 'text-slate-800' : 'text-slate-400'}`}>{atual ? atual.label : placeholder ?? 'Selecionar...'}</span>
        <span className="flex items-center gap-3 shrink-0 text-slate-400">
          {value && (
            <span role="button" aria-label="Limpar seleção" className="hover:text-rose-500"
              onClick={e => { e.stopPropagation(); onChange('') }}><i className="fa-solid fa-xmark" /></span>
          )}
          <i className={`fa-solid fa-chevron-down text-xs transition-transform ${aberto ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {aberto && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Pesquisar..."
                className="w-full h-9 pl-8 pr-3 rounded border border-slate-300 text-sm focus:outline-none focus:border-brand-600" />
            </div>
          </div>
          <ul className="max-h-56 overflow-auto text-sm">
            {lista.map(o => (
              <li key={o.id}>
                <button type="button" onClick={() => { onChange(o.id); setAberto(false) }}
                  className={`w-full text-left px-3 py-2 hover:bg-brand-50 flex items-start justify-between gap-2 ${o.id === value ? 'bg-brand-50' : ''}`}>
                  <span className="min-w-0">
                    <span className="font-medium text-slate-800 block truncate">{o.label}</span>
                    {o.sub && <span className="block text-xs text-slate-500 truncate">{o.sub}</span>}
                  </span>
                  {o.id === value && <i className="fa-solid fa-check text-brand-600 text-xs mt-1" />}
                </button>
              </li>
            ))}
            {!lista.length && <li className="px-3 py-3 text-slate-400 text-center">Nenhum resultado</li>}
          </ul>
          <p className="px-3 py-1.5 text-[11px] text-slate-400 border-t border-slate-100">{lista.length} de {opcoes.length}</p>
        </div>
      )}
    </div>
  )
}
