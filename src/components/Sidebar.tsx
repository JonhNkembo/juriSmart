'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PERFIS, pode, type Acao, type Perfil } from '@/lib/perfis'

export default function Sidebar({ perfil, onSair }: { perfil: Perfil; onSair: () => void }) {
  const path = usePathname()
  const p = perfil.perfil
  type Item = { href: string; label: string; icon: string; acao: Acao }
  const todos: Item[] = [
    { href: '/', label: 'Visão Geral', icon: 'fa-chart-pie', acao: 'ver_painel' },
    { href: '/agendar', label: 'Agendar Júri (IA)', icon: 'fa-wand-magic-sparkles', acao: 'agendar' },
    { href: '/docentes', label: 'Docentes & Currículos', icon: 'fa-user-graduate', acao: 'ver_docentes' },
    { href: '/docentes/novo', label: 'Novo Docente', icon: 'fa-user-plus', acao: 'gerir_docentes' },
    { href: '/bancas', label: p === 'avaliador' ? 'A Minha Banca' : 'Bancas Agendadas', icon: 'fa-calendar-check', acao: 'ver_bancas' },
    { href: '/utilizadores', label: 'Utilizadores', icon: 'fa-users-gear', acao: 'gerir_utilizadores' },
    { href: '/conta', label: 'Minha Conta', icon: 'fa-id-card', acao: 'editar_conta' },
  ]
  const links = todos.filter(l => pode(p, l.acao))
  const ativo = (h: string) => path === h

  return (
    <>
      <aside className="no-print hidden md:flex w-64 shrink-0 bg-slate-900 text-slate-300 flex-col justify-between">
        <div>
          <div className="p-5 flex items-center space-x-3 border-b border-slate-800">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-xl text-white shadow-lg">
              <i className="fa-solid fa-graduation-cap text-xl" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-none">JúriSmart <span className="text-cyan-400 font-extrabold">AI</span></h1>
              <span className="text-xs text-slate-400">Agendamento de TCC</span>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition hover:bg-slate-800 ${ativo(l.href) ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <i className={`fa-solid ${l.icon} w-5`} /><span>{l.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
          <Link href="/conta" className="flex items-center gap-3 hover:opacity-80">
            <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center shrink-0">{perfil.nome.charAt(0).toUpperCase()}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{perfil.nome}</p>
              <p className="text-xs text-cyan-400 truncate">{PERFIS[p].rotulo} ({PERFIS[p].detalhe})</p>
            </div>
          </Link>
          <button onClick={onSair} className="mt-3 w-full text-left text-xs text-rose-400 hover:text-rose-300 px-1">
            <i className="fa-solid fa-right-from-bracket mr-2" />Terminar sessão
          </button>
        </div>
      </aside>
      <nav className="no-print md:hidden flex overflow-x-auto bg-slate-900 text-xs">
        {links.map(l => (
          <Link key={l.href} href={l.href} className={`px-4 py-3 whitespace-nowrap ${ativo(l.href) ? 'bg-brand-600 text-white' : 'text-slate-300'}`}>{l.label}</Link>
        ))}
        <button onClick={onSair} className="px-4 py-3 whitespace-nowrap text-rose-400">Sair</button>
      </nav>
    </>
  )
}
