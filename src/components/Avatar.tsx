export default function Avatar({ nome, foto, tam = 36, className = '' }: {
  nome: string; foto?: string | null; tam?: number; className?: string
}) {
  if (foto) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={foto} alt={nome} style={{ width: tam, height: tam }} className={`rounded-full object-cover shrink-0 ${className}`} />
  }
  return (
    <div style={{ width: tam, height: tam, fontSize: tam * 0.42 }}
      className={`rounded-full bg-brand-600 text-white font-bold flex items-center justify-center shrink-0 ${className}`}>
      {nome.trim().charAt(0).toUpperCase()}
    </div>
  )
}
