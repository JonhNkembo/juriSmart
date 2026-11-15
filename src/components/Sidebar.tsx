'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PERFIS, pode, type Acao, type Perfil } from '@/lib/perfis'
import Avatar from './Avatar'

export default function Sidebar({ perfil, onSair }: { perfil: Perfil; onSair: () => void }) {
  const path = usePathname()
  const p = perfil.perfil
  const [pendentes, setPendentes] = useState(0)

  useEffect(() => {
    if (p !== 'administrador') return
    const ver = () => supabase.from('perfis').select('id', { count: 'exact', head: true }).eq('estado', 'pendente').then(({ count }) => setPendentes(count ?? 0))
    ver()
    const t = setInterval(ver, 30000)
    return () => clearInterval(t)
  }, [p, path])

  type Item = { href: string; label: string; icon: string; acao?: Acao; ou?: Acao }
  const todos: Item[] = [
    { href: '/', label: p === 'juri' ? 'O Meu Painel' : 'Visão Geral', icon: 'fa-chart-pie', acao: 'ver_painel', ou: 'ver_painel_pessoal' },
    { href: '/agendar', label: 'Agendar Júri (IA)', icon: 'fa-wand-magic-sparkles', acao: 'agendar' },
    { href: '/docentes', label: 'Docentes & Currículos', icon: 'fa-user-graduate', acao: 'ver_docentes' },
    { href: '/docentes/novo', label: 'Novo Docente', icon: 'fa-user-plus', acao: 'gerir_docentes' },
    { href: '/curriculo', label: 'O Meu Currículo', icon: 'fa-book-open', acao: 'editar_curriculo_proprio' },
    { href: '/bancas', label: p === 'administrador' ? 'Bancas Agendadas' : p === 'juri' ? 'As Minhas Defesas' : 'A Minha Banca', icon: 'fa-calendar-check', acao: p === 'administrador' ? 'ver_bancas' : p === 'juri' ? 'ver_defesas' : 'ver_minha_banca' },
    { href: '/utilizadores', label: 'Utilizadores', icon: 'fa-users-gear', acao: 'gerir_utilizadores' },
    { href: '/conta', label: 'Minha Conta', icon: 'fa-id-card', acao: 'editar_conta' },
    { href: '/sobre', label: 'Sobre o Projeto', icon: 'fa-circle-info' },
  ]
  const links = todos.filter(l => !l.acao || pode(p, l.acao) || (l.ou && pode(p, l.ou)))
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
                <i className={`fa-solid ${l.icon} w-5`} /><span className="flex-1">{l.label}</span>
                {l.href === '/utilizadores' && pendentes > 0 && <span className="bg-amber-400 text-brand-900 text-[11px] font-extrabold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">{pendentes}</span>}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
          <Link href="/conta" className="flex items-center gap-3 hover:opacity-80">
            <Avatar nome={perfil.nome} foto={perfil.foto_url} tam={36} />
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
          <Link key={l.href} href={l.href} className={`px-4 py-3 whitespace-nowrap ${ativo(l.href) ? 'bg-brand-600 text-white' : 'text-slate-300'}`}>{l.label}{l.href === '/utilizadores' && pendentes > 0 ? ` (${pendentes})` : ''}</Link>
        ))}
        <button onClick={onSair} className="px-4 py-3 whitespace-nowrap text-rose-400">Sair</button>
      </nav>
    </>
  )
}
