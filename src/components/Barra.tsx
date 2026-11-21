/** Barra de progresso. `indeterminada` para esperas sem percentagem conhecida. */
export default function Barra({ valor = 0, max = 100, cor = 'bg-brand-600', altura = 'h-2', rotulo, indeterminada = false, className = '' }: {
  valor?: number; max?: number; cor?: string; altura?: string; rotulo?: string; indeterminada?: boolean; className?: string
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (valor / max) * 100)) : 0
  if (indeterminada) {
    return <div role="progressbar" aria-label={rotulo ?? 'A carregar'} className={`relative overflow-hidden rounded-full bg-slate-200 text-brand-600 barra-indet ${altura} ${className}`} />
  }
  return (
    <div role="progressbar" aria-label={rotulo} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(valor)}
      className={`w-full overflow-hidden rounded-full bg-slate-200 ${altura} ${className}`}>
      <div className={`${cor} ${altura} rounded-full transition-[width] duration-500 motion-reduce:transition-none`} style={{ width: `${pct}%` }} />
    </div>
  )
}
