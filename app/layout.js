import './globals.css'
import { Inter } from 'next/font/google'
import SwRegister from '@/components/SwRegister'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Sistema de Vida',
  description: 'Produtividade diária, rotina e finanças',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sistema de Vida" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <SwRegister />
        {children}
      </body>
    </html>
  )
}
