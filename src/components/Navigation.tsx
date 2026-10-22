import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Menu,
  Moon,
  Printer,
  Sun,
  Users,
  X,
} from 'lucide-react'

interface NavigationProps {
  isDarkMode: boolean
  onToggleDarkMode: () => void
}

const menuItems = [
  { path: '/', label: 'Painel', icon: LayoutDashboard },
  { path: '/equipment', label: 'Equipamentos', icon: Printer },
  { path: '/clients', label: 'Clientes', icon: Users },
  { path: '/reports', label: 'Relatórios', icon: BarChart3 },
  { path: '/documents', label: 'Documentos', icon: FileText },
]

export function Navigation({
  isDarkMode,
  onToggleDarkMode,
}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const hasSupabaseConfiguration = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  )

  const sidebar = (
    <>
      <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/20">
          <Printer size={19} strokeWidth={2.5} />
        </div>
        <div>
          <span className="block text-[17px] font-bold tracking-tight text-white">
            LocaPrinter
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Gestão inteligente
          </span>
        </div>
      </div>

      <div className="px-4 pt-8">
        <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Menu principal
        </p>
        <nav aria-label="Navegação principal" className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
            const Icon = item.icon

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/20'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={15} />}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isDemoMode
                  ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.55)]'
                    : hasSupabaseConfiguration
                      ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]'
                      : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-semibold text-slate-200">
              {isDemoMode
                ? 'Modo demonstração'
                : hasSupabaseConfiguration
                  ? 'Backend configurado'
                  : 'Backend não configurado'}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            {isDemoMode
              ? 'Prévia da interface sem conexão ao backend.'
              : hasSupabaseConfiguration
                ? 'Acompanhe seus equipamentos e contratos em um só lugar.'
                : 'Configure o Supabase para carregar os dados do sistema.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="mt-4 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/8 hover:text-white"
          aria-label={isDarkMode ? 'Ativar tema claro' : 'Ativar tema escuro'}
        >
          <span>{isDarkMode ? 'Tema escuro' : 'Tema claro'}</span>
          {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <div className="mt-3 border-t border-white/10 px-3 pt-4 text-[10px] text-slate-500">
          LocaPrinter · Gestão de locação
        </div>
      </div>
    </>
  )

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-cyan-300 dark:bg-cyan-400 dark:text-slate-950">
            <Printer size={17} />
          </span>
          <span className="font-bold tracking-tight text-slate-900 dark:text-white">
            LocaPrinter
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col bg-slate-950 text-white md:flex">
        {sidebar}
      </aside>

      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-slate-950 text-white shadow-2xl transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        {sidebar}
      </aside>
    </>
  )
}
