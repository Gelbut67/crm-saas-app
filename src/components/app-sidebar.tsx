"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  BarChart3,
  Users,
  FileText,
  Settings,
  Home,
  X,
  Menu,
  UserPlus,
  Navigation,
  LogOut,
  ShieldCheck,
  Activity,
  Bell,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export function AppSidebar() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dueCount, setDueCount] = useState(0)
  const { data: session } = useSession()

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/reminders?includeDone=false')
        if (res.ok) {
          const data = await res.json()
          const now = new Date()
          const due = data.filter((r: any) => new Date(r.echeance) <= now).length
          setDueCount(due)
        }
      } catch {}
    }
    fetchCount()
    const iv = setInterval(fetchCount, 60_000)
    const handler = () => fetchCount()
    window.addEventListener('reminders-updated', handler)
    return () => { clearInterval(iv); window.removeEventListener('reminders-updated', handler) }
  }, [])

  const navigation = [
    {
      name: "Tableau de bord",
      href: "/",
      icon: Home,
    },
    {
      name: "Prospects",
      href: "/prospects-db",
      icon: UserPlus,
    },
    {
      name: "Clients",
      href: "/clients-db",
      icon: Users,
    },
    {
      name: "Devis",
      href: "/devis-db",
      icon: FileText,
    },
    {
      name: "Tournées",
      href: "/tournees",
      icon: Navigation,
    },
    {
      name: "Activités",
      href: "/interactions",
      icon: Activity,
    },
    {
      name: "Pipeline",
      href: "/pipeline-db",
      icon: BarChart3,
    },
    {
      name: "Réglages",
      href: "/settings",
      icon: Settings,
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: dueCount,
    },
    ...(session?.user?.role === 'admin' ? [{
      name: "Utilisateurs",
      href: "/admin/users",
      icon: ShieldCheck,
    }] : []),
  ]

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 sidebar-modern transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex-shrink-0">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                  <defs>
                    <linearGradient id="beGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#7c3aed"/>
                      <stop offset="100%" stopColor="#4f46e5"/>
                    </linearGradient>
                  </defs>
                  <path d="M4 6 H26 L36 20 L26 34 H4 Q2 34 2 32 V8 Q2 6 4 6 Z" fill="url(#beGrad)"/>
                  <circle cx="8.5" cy="20" r="2.5" fill="white" fillOpacity="0.9"/>
                  <text x="13" y="25" fontFamily="Arial" fontWeight="900" fontSize="13" fill="white" letterSpacing="-0.5">BE</text>
                </svg>
              </div>
              <div>
                <h1 className="text-base font-black tracking-wide bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                  BELLE ETIQUETTE
                </h1>
                <p className="text-[10px] text-muted-foreground leading-tight">Gestion Commerciale by YASAR</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const badge = (item as any).badge
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200",
                    "hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20",
                    isActive && "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-white" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "font-medium transition-colors",
                    isActive ? "text-white" : "text-foreground"
                  )}>
                    {item.name}
                  </span>
                  {badge > 0 && !isActive && (
                    <span className="ml-auto min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200/50 space-y-1.5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {session?.user?.name ? session.user.name.slice(0, 2).toUpperCase() : '?'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{session?.user?.name ?? 'Utilisateur'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{session?.user?.role ?? ''}</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-30 lg:hidden button-modern"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>
    </>
  )
}
