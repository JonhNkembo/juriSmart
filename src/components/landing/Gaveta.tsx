'use client'
import { useEffect, useState } from 'react'
import LoginForm from '../LoginForm'
import CadastroForm from '../CadastroForm'

export type Modo = 'entrar' | 'criar'

/** Painel lateral que "puxa" o formulário de entrar ou de criar conta, sem sair da página inicial. */
export default function Gaveta({ modo, aoFechar, aoTrocar }: { modo: Modo | null; aoFechar: () => void; aoTrocar: (m: Modo) => void }) {
  const [ultimo, setUltimo] = useState<Modo>('entrar')
  useEffect(() => { if (modo) setUltimo(modo) }, [modo])

  useEffect(() => {
    if (!modo) return
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar() }
    document.addEventListener('keydown', tecla)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', tecla); document.body.style.overflow = antes }
  }, [modo, aoFechar])

  const aberta = modo !== null
  const ativo = modo ?? ultimo
  return (
    <div className={`fixed inset-0 z-50 ${aberta ? '' : 'pointer-events-none'}`} aria-hidden={!aberta}>
      <div onClick={aoFechar} className={`absolute inset-0 bg-brand-900/60 backdrop-blur-[2px] transition-opacity duration-300 ${aberta ? 'opacity-100' : 'opacity-0'}`} />
      <aside role="dialog" aria-modal="true" aria-label={ativo === 'entrar' ? 'Entrar' : 'Criar conta'}
        className={`absolute right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${aberta ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="bg-brand-900 text-white px-6 pt-5 pb-0 border-b-4 border-amber-400">
          <div className="flex items-center justify-between">
            <p className="font-display font-bold text-lg">JúriSmart <span className="text-amber-300">AI</span></p>
            <button onClick={aoFechar} aria-label="Fechar" className="w-9 h-9 -mr-2 rounded-full hover:bg-white/10 flex items-center justify-center"><i className="fa-solid fa-xmark" /></button>
          </div>
          <div className="flex gap-1 mt-4" role="tablist">
            {(['entrar', 'criar'] as Modo[]).map(m => (
              <button key={m} role="tab" aria-selected={ativo === m} onClick={() => aoTrocar(m)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-md transition ${ativo === m ? 'bg-white text-brand-900' : 'text-sky-100 hover:bg-white/10'}`}>
                {m === 'entrar' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {ativo === 'entrar' ? (
            <>
              <h2 className="font-display text-2xl font-bold text-brand-900">Bem-vindo de volta</h2>
              <p className="text-sm text-slate-500 mt-1 mb-5">Entre com o email e a palavra-passe da sua conta.</p>
              <LoginForm />
              <p className="text-sm text-slate-600 text-center mt-5">Ainda não tem conta? <button onClick={() => aoTrocar('criar')} className="font-semibold text-brand-700 hover:underline">Criar conta</button></p>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold text-brand-900">Criar conta</h2>
              <p className="text-sm text-slate-500 mt-1 mb-5">Escolha o seu perfil. A conta fica a aguardar a aprovação do administrador.</p>
              <CadastroForm aoIrParaLogin={() => aoTrocar('entrar')} />
              <p className="text-sm text-slate-600 text-center mt-5">Já tem conta? <button onClick={() => aoTrocar('entrar')} className="font-semibold text-brand-700 hover:underline">Entrar</button></p>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
