'use client'
import Link from 'next/link'
import AuthLayout from '@/components/AuthLayout'
import LoginForm from '@/components/LoginForm'

export default function Login() {
  return (
    <AuthLayout title="Iniciar sessão" subtitle="Aceda ao painel de agendamento de júris."
      rodape={<>Ainda não tem conta? <Link href="/cadastro" className="font-semibold text-brand-700 hover:underline">Criar conta</Link></>}>
      <LoginForm />
    </AuthLayout>
  )
}
