'use client'
import { useAuth } from '@/lib/auth'
import Curriculo from '@/components/Curriculo'

export default function PaginaCurriculo() {
  const { perfil } = useAuth()
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold">O Meu Currículo</h2>
        <p className="text-sm text-slate-500 mt-1">Formação, publicações, projectos e orientações. O sistema usa estes dados para o sugerir para as bancas mais adequadas à sua área.</p>
      </div>
      {perfil.docente_id ? <Curriculo docenteId={perfil.docente_id} /> : (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-5 text-sm">
          <i className="fa-solid fa-triangle-exclamation mr-2" />A sua conta ainda não está ligada a um registo de docente. Peça ao administrador para verificar o seu perfil.
        </div>
      )}
    </div>
  )
}
