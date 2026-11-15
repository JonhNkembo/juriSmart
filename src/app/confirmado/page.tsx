'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout, { Estado, btn } from '@/components/AuthLayout'

export default function Confirmado() {
  const router = useRouter()
  const [fase, setFase] = useState<'verificando' | 'ok' | 'erro'>('verificando')

  useEffect(() => {
    if (/error/i.test(window.location.hash)) { setFase('erro'); return }
    // o link de confirmação cria uma sessão; terminamo-la para a pessoa entrar pelo login
    supabase.auth.signOut().finally(() => setFase('ok'))
  }, [])

  useEffect(() => {
    if (fase !== 'ok') return
    const t = setTimeout(() => router.push('/login'), 12000)
    return () => clearTimeout(t)
  }, [fase, router])

  return (
    <AuthLayout title="Confirmação de email" subtitle="JúriSmart AI"
      rodape={<>Precisa de ajuda? Contacte a secretaria.</>}>
      {fase === 'verificando' && <Estado tom="info" icone="fa-circle-notch fa-spin" titulo="A confirmar..." />}
      {fase === 'ok' && (
        <Estado tom="ok" icone="fa-circle-check" titulo="Email confirmado!">
          <p>O seu email foi confirmado com sucesso.</p>
          <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 text-left">
            <i className="fa-solid fa-hourglass-half mr-2" /><b>Aguarde a aprovação do administrador.</b>
            <span className="block text-xs mt-1">Só poderá usar o sistema depois de a sua conta ser aprovada. Pode iniciar sessão a qualquer momento para ver o estado.</span>
          </div>
          <Link href="/login" className={btn}>Ir para o login</Link>
        </Estado>
      )}
      {fase === 'erro' && (
        <Estado tom="erro" icone="fa-link-slash" titulo="Link inválido ou expirado">
          <p>Não foi possível confirmar o email. Tente iniciar sessão: se a conta já estiver confirmada, entra normalmente.</p>
          <Link href="/login" className={btn}>Ir para o login</Link>
        </Estado>
      )}
    </AuthLayout>
  )
}
