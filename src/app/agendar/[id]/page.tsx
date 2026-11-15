'use client'
import { useParams } from 'next/navigation'
import AgendarForm from '@/components/AgendarForm'

export default function EditarBanca() {
  const { id } = useParams<{ id: string }>()
  return <AgendarForm key={id} editarId={id} />
}
