'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/** Barra fina no topo que acompanha a mudança de página. */
export default function ProgressoTopo() {
  const path = usePathname()
  const [p, setP] = useState(0)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    setVis(true); setP(18)
    const t1 = setTimeout(() => setP(72), 90)
    const t2 = setTimeout(() => setP(100), 380)
    const t3 = setTimeout(() => { setVis(false); setP(0) }, 780)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [path])

  return (
    <div aria-hidden className="no-print fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none">
      <div className="h-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,.8)] transition-[width,opacity] duration-300 ease-out motion-reduce:transition-none"
        style={{ width: `${p}%`, opacity: vis ? 1 : 0 }} />
    </div>
  )
}
