import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { DataMigration } from "@/components/data-migration"
import { SessionProvider } from "@/components/session-provider"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'YASAR DEV - Gestion Commerciale',
  description: 'Application CRM complète pour gérer votre cycle de vente',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CRM Client',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'YASAR DEV CRM',
    title: 'Gestion Commerciale',
    description: 'Application CRM complète',
  },
  twitter: {
    card: 'summary',
    title: 'YASAR DEV CRM',
    description: 'Application CRM complète',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-screen gradient-soft">
              <div className="flex h-screen overflow-hidden">
                <AppSidebar />
                <main className="flex-1 overflow-auto lg:pl-64">
                  <DataMigration />
                  {children}
                </main>
              </div>
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
