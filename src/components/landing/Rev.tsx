/** Agrupa um bloco da página. (Sem animações de entrada: o movimento fica para as ações da pessoa.) */
export default function Rev({ children, className = '' }: { children: React.ReactNode; className?: string; atraso?: number }) {
  return <div className={className}>{children}</div>
}
