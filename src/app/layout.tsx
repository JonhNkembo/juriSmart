import './globals.css'
import { Inter } from 'next/font/google'
import AuthShell from '@/components/AuthShell'

const inter = Inter({ subsets: ['latin'] })
export const metadata = { title: 'JúriSmart AI — Agendamento de Júris de TCC' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-800 antialiased`}>
        <AuthShell>{children}</AuthShell>
      </body>
    </html>
  )
}
