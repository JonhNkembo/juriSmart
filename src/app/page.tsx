'use client'
import { useAuth } from '@/lib/auth'
import PainelAdmin from '@/components/PainelAdmin'
import PainelJuri from '@/components/PainelJuri'

export default function Home() {
  const { perfil } = useAuth()
  return perfil.perfil === 'juri' ? <PainelJuri /> : <PainelAdmin />
}
