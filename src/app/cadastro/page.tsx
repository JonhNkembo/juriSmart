'use client'
import Link from 'next/link'
import AuthLayout from '@/components/AuthLayout'
import CadastroForm from '@/components/CadastroForm'

export default function Cadastro() {
  return (
    <AuthLayout title="Criar conta" subtitle="Escolha o seu perfil e registe-se."
      rodape={<>Já tem conta? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Iniciar sessão</Link></>}>
      <CadastroForm />
    </AuthLayout>
  )
}
