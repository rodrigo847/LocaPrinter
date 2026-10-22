import { lazy, Suspense, useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from 'react-router-dom'
import { Toaster } from 'sonner'
import {
  ArrowUpRight,
  ArrowUpRightFromSquare,
  CircleCheck,
  FileText,
  Printer,
  Sparkles,
  Users,
} from 'lucide-react'
import { Navigation } from './components/Navigation'
import { CompanyProvider } from './contexts/CompanyContext'
import { ClientsPage } from './pages/ClientsPage'

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
const hasSupabaseConfiguration = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

const EquipmentPage = lazy(() =>
  import('./pages/EquipmentPage').then(({ EquipmentPage }) => ({
    default: EquipmentPage,
  }))
)
const DocumentsPage = lazy(() =>
  import('./pages/DocumentsPage').then(({ DocumentsPage }) => ({
    default: DocumentsPage,
  }))
)

function EquipmentRoute() {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">
          Equipamentos ficam indisponíveis na prévia sem backend.
        </p>
      </div>
    )
  }

  if (
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">
          Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para acessar
          equipamentos.
        </p>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg text-gray-500">Carregando equipamentos...</p>
        </div>
      }
    >
      <EquipmentPage />
    </Suspense>
  )
}

function DocumentsRoute() {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">
          Documentos ficam indisponíveis na prévia sem backend.
        </p>
      </div>
    )
  }

  if (
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">
          Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para acessar
          documentos.
        </p>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg text-gray-500">Carregando documentos...</p>
        </div>
      }
    >
      <DocumentsPage />
    </Suspense>
  )
}

const dashboardMetrics = [
  {
    label: 'Clientes cadastrados',
    value: '0',
    hint: 'Sua carteira de clientes',
    icon: Users,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
  },
  {
    label: 'Equipamentos ativos',
    value: '0',
    hint: 'Impressoras em operação',
    icon: Printer,
    color:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  {
    label: 'Documentos',
    value: '0',
    hint: 'Arquivos armazenados',
    icon: FileText,
    color:
      'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
  },
]

const Dashboard = () => (
  <div className="space-y-8">
    <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-9 sm:py-10">
      <div className="absolute -right-12 -top-24 -z-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -bottom-32 right-1/3 -z-10 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-cyan-100">
          <CircleCheck size={14} />
          Gestão simples, operação eficiente
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
          Seu negócio,
          <br className="sm:hidden" /> sob controle.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
          Acompanhe seus clientes, equipamentos e documentos em um só lugar.
          Aqui está o resumo da sua operação.
        </p>
        <Link
          to="/equipment"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-300"
        >
          Ver equipamentos
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="absolute bottom-8 right-10 hidden h-36 w-36 items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.06] backdrop-blur-sm lg:flex">
        <div className="flex h-24 w-24 items-center justify-center rounded-[1.5rem] bg-cyan-400/15 text-cyan-300">
          <Printer size={48} strokeWidth={1.3} />
        </div>
      </div>
    </section>

    <section aria-labelledby="overview-heading">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
            Visão geral
          </p>
          <h2
            id="overview-heading"
            className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Resumo da operação
          </h2>
        </div>
        <span className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
          Indicadores atuais
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardMetrics.map((metric) => {
          const Icon = metric.icon

          return (
            <article
              key={metric.label}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${metric.color}`}
                >
                  <Icon size={20} />
                </span>
                <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  {isDemoMode ? 'Prévia' : 'Atual'}
                </span>
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                {metric.label}
              </p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {metric.value}
                </span>
                <span className="pb-1 text-xs text-slate-400">
                  {metric.hint}
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">
              Comece por aqui
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Acesse rapidamente as áreas principais.
            </p>
          </div>
          <ArrowUpRightFromSquare
            size={18}
            className="text-slate-400"
            aria-hidden="true"
          />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            to="/clients"
            className="group flex items-center gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/70 dark:border-slate-800 dark:hover:border-blue-900 dark:hover:bg-blue-950/30"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              <Users size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                Clientes
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Gerencie sua carteira
              </span>
            </span>
            <ArrowUpRight
              size={16}
              className="text-slate-400 transition group-hover:text-blue-600"
            />
          </Link>
          <Link
            to="/equipment"
            className="group flex items-center gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/70 dark:border-slate-800 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/30"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Printer size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                Equipamentos
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Acompanhe as impressoras
              </span>
            </span>
            <ArrowUpRight
              size={16}
              className="text-slate-400 transition group-hover:text-emerald-600"
            />
          </Link>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-6 shadow-sm dark:border-cyan-950 dark:from-cyan-950/40 dark:to-slate-950">
        <div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm dark:bg-slate-900 dark:text-cyan-300">
            <Sparkles size={19} />
          </span>
          <h2 className="mt-4 font-bold text-slate-900 dark:text-white">
            Um espaço para sua operação
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Cadastre seus clientes e equipamentos para organizar a gestão das
            suas locações.
          </p>
        </div>
        <p className="mt-5 border-t border-cyan-100 pt-4 text-xs text-slate-500 dark:border-cyan-900 dark:text-slate-400">
          Seus indicadores aparecem aqui conforme você utiliza o sistema.
        </p>
      </div>
    </section>
  </div>
)

const queryClient = new QueryClient()

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  return (
    <QueryClientProvider client={queryClient}>
      <CompanyProvider>
        <Router>
          <div className={isDarkMode ? 'dark' : ''}>
            <Navigation
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            />
            <div className="min-h-screen bg-[#f4f7fb] pt-16 transition-colors dark:bg-slate-900 md:pl-[260px] md:pt-0">
              <header className="border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur sm:px-8 md:px-10 md:py-5 dark:border-slate-800 dark:bg-slate-950/90">
                <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                      LocaPrinter
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Gestão de locação de equipamentos
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isDemoMode
                          ? 'bg-amber-400'
                          : hasSupabaseConfiguration
                            ? 'bg-emerald-500'
                            : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {isDemoMode
                        ? 'Modo demonstração'
                        : hasSupabaseConfiguration
                          ? 'Backend configurado'
                          : 'Backend não configurado'}
                    </span>
                  </div>
                </div>
              </header>
              <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 md:px-10">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/equipment" element={<EquipmentRoute />} />
                  <Route path="/clients" element={<ClientsPage />} />
                  <Route path="/documents" element={<DocumentsRoute />} />
                </Routes>
              </main>
            </div>
            <Toaster position="top-right" richColors />
          </div>
        </Router>
      </CompanyProvider>
    </QueryClientProvider>
  )
}

export default App