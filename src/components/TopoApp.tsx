'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Perfil } from '@/lib/perfis'
import Avatar from './Avatar'

const TITULOS: [string, string][] = [
  ['/agendar/', 'Editar banca'], ['/agendar', 'Agendar júri'], ['/datas', 'Datas de defesa'],
  ['/docentes/novo', 'Novo docente'], ['/docentes', 'Docentes e currículos'], ['/curriculo', 'O meu currículo'],
  ['/bancas', 'Bancas'], ['/utilizadores', 'Utilizadores'], ['/conta', 'Minha conta'], ['/sobre', 'Sobre o projeto'],
]
const tituloDe = (path: string, juri: boolean) =>
  path === '/' ? (juri ? 'O meu painel' : 'Visão geral') : TITULOS.find(([p]) => path === p || path.startsWith(p.endsWith('/') ? p : p + '/'))?.[1] ?? 'Página'

export default function TopoApp({ perfil }: { perfil: Perfil }) {
  const path = usePathname()
  const hoje = new Date().toLocaleDateString('pt-AO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="no-print h-14 shrink-0 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4">
      <nav aria-label="Localização" className="text-sm flex items-center gap-2 min-w-0">
        <Link href="/" className="text-slate-500 hover:text-brand-700 shrink-0">JúriSmart AI</Link>
        <i className="fa-solid fa-chevron-right text-[9px] text-slate-300" />
        <span className="font-semibold text-slate-800 truncate">{tituloDe(path, perfil.perfil === 'juri')}</span>
      </nav>
      <div className="flex items-center gap-4 shrink-0">
        <span className="hidden lg:block text-xs text-slate-500 capitalize">{hoje}</span>
        <Link href="/conta" aria-label="Minha conta"><Avatar nome={perfil.nome} foto={perfil.foto_url} tam={32} /></Link>
      </div>
    </div>
  )
}
