import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Route, Routes } from 'react-router-dom'
import { toast } from 'sonner'
import { Navigation } from '../components/Navigation'
import { supabase } from '../lib/supabaseClient'
import { customerService } from '../services/customerService'
import type { ClientInput, ClientRecord, CompanyRecord } from '../types/customers'

const actionClass = 'rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50'
const panelClass = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950'

function reportError(error: unknown) {
  console.error('Erro na gestão online:', error)
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null
  const message = code === '23505'
    ? 'Este CPF/CNPJ já está cadastrado.'
    : code === '23503'
      ? 'Esta empresa possui clientes. Exclua ou transfira os clientes antes de excluir a empresa.'
      : 'Não foi possível concluir a operação. Verifique a conexão e tente novamente.'
  toast.error(message)
}

function authErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null
  switch (code) {
    case 'invalid_credentials': return 'E-mail ou senha incorretos.'
    case 'email_not_confirmed': return 'Confirme seu e-mail pelo convite de primeiro acesso.'
    case 'over_email_send_rate_limit': return 'O limite temporário de envio de e-mails foi atingido. Tente mais tarde ou entre com sua senha.'
    case 'over_request_rate_limit': return 'Muitas tentativas de acesso. Aguarde antes de tentar novamente.'
    case 'weak_password': return 'Escolha uma senha mais forte, com pelo menos 12 caracteres.'
    case 'same_password': return 'Escolha uma senha diferente da atual.'
    case 'reauthentication_needed': return 'Entre novamente antes de alterar sua senha.'
    default: return 'Não foi possível concluir o acesso. Confira os dados, a conexão e se sua conta já foi autorizada.'
  }
}

function Field({ label, name, value, type = 'text', required = false, maxLength, minLength, autoComplete }: {
  label: string
  name: string
  value?: string
  type?: string
  required?: boolean
  maxLength?: number
  minLength?: number
  autoComplete?: string
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input name={name} type={type} defaultValue={value} required={required}
        maxLength={maxLength} minLength={minLength} autoComplete={autoComplete}
        className="input mt-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
    </label>
  )
}

function Login() {
  const [busy, setBusy] = useState(false)
  const [useEmailLink, setUseEmailLink] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(() =>
    new URLSearchParams(window.location.hash.slice(1)).has('error')
      ? 'Este link expirou ou já foi utilizado. Cada link funciona uma única vez. Entre com sua senha ou solicite outro link.'
      : null
  )

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email')).trim()
    setBusy(true)
    setError(null)
    setSent(false)
    try {
      const { error: authError } = useEmailLink
        ? await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
        })
        : await supabase.auth.signInWithPassword({ email, password: String(data.get('password')) })
      if (authError) throw authError
      if (useEmailLink) setSent(true)
    } catch (authError) {
      console.error('Erro ao solicitar acesso:', authError)
      setError(authErrorMessage(authError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 dark:bg-slate-900">
      <form onSubmit={submit} className={`${panelClass} w-full max-w-md space-y-5`}>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-700">LocaPrinter</p>
          <h1 className="mt-3 text-2xl">Acesse sua gestão</h1>
          <p className="mt-2 text-sm text-slate-500">Acesso restrito às contas autorizadas.</p>
        </div>
        <Field label="E-mail autorizado" name="email" type="email" autoComplete="username" required />
        {!useEmailLink && <Field label="Senha" name="password" type="password" autoComplete="current-password" required />}
        {useEmailLink && <p className="text-sm text-slate-500">Primeiro acesso ou recuperação: abra somente o link mais recente, uma única vez, no aparelho em que deseja entrar. Depois de entrar, você poderá definir sua senha.</p>}
        {sent && <p role="status" className="text-sm text-emerald-700">Se o e-mail estiver autorizado, você receberá um link. Confira também a pasta de spam e os limites de envio do provedor.</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" className={`${actionClass} w-full`} disabled={busy}>
          {busy ? 'Aguarde...' : useEmailLink ? 'Receber link de acesso' : 'Entrar'}
        </button>
        <button type="button" disabled={busy} className="w-full text-sm text-cyan-700 underline dark:text-cyan-300"
          onClick={() => { setUseEmailLink(value => !value); setError(null); setSent(false) }}>
          {useEmailLink ? 'Voltar para e-mail e senha' : 'Primeiro acesso ou esqueci minha senha'}
        </button>
      </form>
    </main>
  )
}

function PasswordForm({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password'))
    if (password !== data.get('confirmation')) {
      setError('As senhas não coincidem.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { error: authError } = await supabase.auth.updateUser({ password })
      if (authError) throw authError
      toast.success('Senha salva. Agora você pode entrar com e-mail e senha em outros aparelhos.')
      onClose()
    } catch (authError) {
      console.error('Erro ao definir senha:', authError)
      setError(authErrorMessage(authError))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section role="dialog" aria-modal="true" aria-labelledby="password-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4">
      <form onSubmit={submit} className={`${panelClass} mx-auto my-6 max-w-md space-y-4`}>
        <h2 id="password-title" className="text-xl">Definir ou alterar senha</h2>
        <p className="text-sm text-slate-500">Use pelo menos 12 caracteres. Não compartilhe sua senha.</p>
        <fieldset disabled={busy} className="space-y-4">
          <Field name="password" label="Nova senha" type="password" required minLength={12} maxLength={72} autoComplete="new-password" />
          <Field name="confirmation" label="Confirmar nova senha" type="password" required minLength={12} maxLength={72} autoComplete="new-password" />
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button className={actionClass} disabled={busy}>{busy ? 'Salvando...' : 'Salvar senha'}</button>
          <button type="button" disabled={busy} onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </section>
  )
}

function CompanyForm({ company, onSave, onClose }: {
  company: CompanyRecord | null
  onSave: (input: { name: string; cnpj: string }, id?: string) => Promise<void>
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const cnpj = String(data.get('cnpj')).replace(/\D/g, '')
    if (cnpj.length !== 14 || !String(data.get('name')).trim()) {
      toast.error('Informe o nome da empresa e um CNPJ com 14 dígitos.')
      return
    }
    setBusy(true)
    try {
      await onSave({ name: String(data.get('name')).trim(), cnpj }, company?.id)
      onClose()
    } catch (error) {
      reportError(error)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className={`${panelClass} space-y-4`}>
      <h2 className="text-lg">{company ? 'Editar empresa' : 'Nova empresa'}</h2>
      <Field name="name" label="Nome da empresa" value={company?.name} required maxLength={200} />
      <Field name="cnpj" label="CNPJ" value={company?.cnpj} required maxLength={18} />
      <div className="flex gap-3">
        <button className={actionClass} disabled={busy}>{busy ? 'Salvando...' : 'Salvar empresa'}</button>
        <button type="button" onClick={onClose} disabled={busy}>Cancelar</button>
      </div>
    </form>
  )
}

function ClientEditor({ companyId, client, onSaved, onClose }: {
  companyId: string
  client: ClientRecord | null
  onSaved: () => Promise<void>
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [personType, setPersonType] = useState<'PF' | 'PJ'>(client?.type ?? 'PJ')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = (key: string) => String(data.get(key) ?? '').trim()
    const document = text('document').replace(/\D/g, '')
    const zip = text('zip_code').replace(/\D/g, '')
    if (document.length !== (personType === 'PF' ? 11 : 14) || !text('name') || (zip && zip.length !== 8)) {
      toast.error('Preencha o nome, CPF/CNPJ com a quantidade correta de dígitos e CEP com 8 dígitos, se informado.')
      return
    }
    const input: ClientInput = {
      company_id: companyId, type: personType, document, name: text('name'),
      email: text('email'), phone: text('phone'), street: text('street'),
      number: text('number'), complement: text('complement'),
      neighborhood: text('neighborhood'), city: text('city'),
      state: text('state').toUpperCase(), zip_code: zip,
    }
    setBusy(true)
    try {
      await customerService.saveClient(input, client?.id)
      await onSaved()
      toast.success('Cliente salvo no banco.')
      onClose()
    } catch (error) {
      reportError(error)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section role="dialog" aria-modal="true" aria-labelledby="client-editor-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4">
      <form onSubmit={submit} className={`${panelClass} mx-auto my-6 max-w-2xl space-y-4`}>
        <h2 id="client-editor-title" className="text-xl">{client ? 'Editar cliente' : 'Novo cliente'}</h2>
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Tipo de pessoa
            <select className="input mt-1 dark:bg-slate-900" value={personType}
              onChange={(event) => setPersonType(event.target.value === 'PF' ? 'PF' : 'PJ')}>
              <option value="PJ">Pessoa jurídica</option><option value="PF">Pessoa física</option>
            </select>
          </label>
          <Field label={personType === 'PF' ? 'CPF' : 'CNPJ'} name="document" value={client?.document} required maxLength={18} />
          <Field label="Nome" name="name" value={client?.name} required maxLength={200} />
          <Field label="E-mail" name="email" type="email" value={client?.email} maxLength={254} />
          <Field label="Telefone" name="phone" value={client?.phone} maxLength={30} />
          <Field label="CEP" name="zip_code" value={client?.zip_code} maxLength={9} />
          <Field label="Rua" name="street" value={client?.street} maxLength={200} />
          <Field label="Número" name="number" value={client?.number} maxLength={30} />
          <Field label="Complemento" name="complement" value={client?.complement} maxLength={200} />
          <Field label="Bairro" name="neighborhood" value={client?.neighborhood} maxLength={100} />
          <Field label="Cidade" name="city" value={client?.city} maxLength={100} />
          <Field label="UF (2 letras)" name="state" value={client?.state} maxLength={2} />
        </fieldset>
        <div className="flex gap-3">
          <button className={actionClass} disabled={busy}>{busy ? 'Salvando...' : 'Salvar cliente'}</button>
          <button type="button" disabled={busy} onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </section>
  )
}

function OnlineClients({ company }: { company: CompanyRecord }) {
  const queryClient = useQueryClient()
  const key = ['online-clients', company.id]
  const query = useQuery({ queryKey: key, queryFn: () => customerService.clients(company.id) })
  const [editor, setEditor] = useState<{ client: ClientRecord | null } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  async function remove(client: ClientRecord) {
    if (!window.confirm(`Excluir o cliente ${client.name}? Esta ação não pode ser desfeita.`)) return
    setDeleting(client.id)
    try {
      await customerService.deleteClient(client.id, company.id)
      await queryClient.invalidateQueries({ queryKey: key })
      toast.success('Cliente excluído.')
    } catch (error) {
      reportError(error)
    } finally {
      setDeleting(null)
    }
  }
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl">Clientes</h1><p className="text-sm text-slate-500">{company.name}</p></div>
        <button className={actionClass} onClick={() => setEditor({ client: null })}>Novo cliente</button>
      </div>
      {query.isLoading && <p role="status">Carregando clientes...</p>}
      {query.isError && <div role="alert" className={panelClass}>Erro ao carregar clientes. <button onClick={() => void query.refetch()} className="text-cyan-700 underline">Tentar novamente</button></div>}
      {query.isSuccess && query.data.length === 0 && <p className={panelClass}>Nenhum cliente cadastrado nesta empresa.</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {query.data?.map(client => (
          <article key={client.id} className={panelClass}>
            <h2 className="text-lg">{client.name}</h2>
            <p className="text-sm text-slate-500">{client.type} · {client.document}</p>
            <p className="mt-3 break-all text-sm">{client.email}</p>
            <p className="text-sm">{client.phone}</p>
            <p className="text-sm">{client.city}{client.state ? ` / ${client.state}` : ''}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <button className="text-cyan-700 dark:text-cyan-300" onClick={() => setEditor({ client })}>Editar</button>
              <button className="text-red-600 disabled:opacity-50" disabled={deleting !== null} onClick={() => void remove(client)}>
                {deleting === client.id ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </article>
        ))}
      </div>
      {editor && <ClientEditor companyId={company.id} client={editor.client}
        onClose={() => setEditor(null)} onSaved={() => queryClient.invalidateQueries({ queryKey: key })} />}
    </section>
  )
}

function Workspace({ session, isDarkMode, onToggleDarkMode }: {
  session: Session
  isDarkMode: boolean
  onToggleDarkMode: () => void
}) {
  const queryClient = useQueryClient()
  const key = ['online-companies', session.user.id]
  const query = useQuery({ queryKey: key, queryFn: customerService.companies })
  const [selectedId, setSelectedId] = useState('')
  const [editor, setEditor] = useState<{ company: CompanyRecord | null } | null>(null)
  const [busy, setBusy] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const company = query.data?.find(item => item.id === selectedId) ?? query.data?.[0]
  async function saveCompany(input: { name: string; cnpj: string }, id?: string) {
    const saved = await customerService.saveCompany(input, id)
    await queryClient.invalidateQueries({ queryKey: key })
    setSelectedId(saved.id)
    toast.success('Empresa salva no banco.')
  }
  async function deleteCompany() {
    if (!company || !window.confirm(`Excluir a empresa ${company.name}? Empresas com clientes não podem ser excluídas.`)) return
    setBusy(true)
    try {
      await customerService.deleteCompany(company.id)
      await queryClient.invalidateQueries({ queryKey: key })
      setSelectedId('')
      toast.success('Empresa excluída.')
    } catch (error) {
      reportError(error)
    } finally {
      setBusy(false)
    }
  }
  async function logout() {
    setBusy(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      queryClient.clear()
    } catch (error) {
      reportError(error)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Navigation isDarkMode={isDarkMode} onToggleDarkMode={onToggleDarkMode} />
      <div className="min-h-screen bg-slate-50 pt-16 dark:bg-slate-900 md:pl-[260px] md:pt-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <span className="text-sm">Acesso privado · {session.user.email}</span>
          <div className="flex gap-4">
            <button disabled={busy} onClick={() => setPasswordOpen(true)} className="text-sm text-cyan-700 dark:text-cyan-300">Definir/alterar senha</button>
            <button disabled={busy} onClick={() => void logout()} className="text-sm text-cyan-700 dark:text-cyan-300">Sair</button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
          {query.isLoading && <p role="status">Carregando empresas...</p>}
          {query.isError && <div role="alert" className={panelClass}>Erro ao carregar empresas. <button onClick={() => void query.refetch()} className="text-cyan-700 underline">Tentar novamente</button></div>}
          {query.isSuccess && (
            <div className={`${panelClass} flex flex-wrap items-end gap-4`}>
              {company ? (
                <label className="min-w-0 flex-1 text-sm font-medium">Empresa atual
                  <select aria-label="Empresa atual" value={company.id} onChange={event => { setSelectedId(event.target.value); setEditor(null) }}
                    className="input mt-1 dark:bg-slate-900">
                    {query.data.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
                  </select>
                </label>
              ) : <p className="flex-1">Cadastre sua empresa para começar.</p>}
              <button className={actionClass} onClick={() => setEditor({ company: null })}>Nova empresa</button>
              {company && <>
                <button className="text-sm text-cyan-700 dark:text-cyan-300" onClick={() => setEditor({ company })}>Editar empresa</button>
                <button disabled={busy} className="text-sm text-red-600" onClick={() => void deleteCompany()}>Excluir empresa</button>
              </>}
            </div>
          )}
          {passwordOpen && <PasswordForm onClose={() => setPasswordOpen(false)} />}
          {editor && <CompanyForm key={editor.company?.id ?? 'new'} company={editor.company} onSave={saveCompany} onClose={() => setEditor(null)} />}
          <Routes>
            <Route path="/" element={<section className={panelClass}>
              <h1 className="text-2xl">Gestão online</h1>
              <p className="mt-3">Empresas cadastradas: {query.data?.length ?? '—'}</p>
              <p className="mt-2 text-sm text-slate-500">Empresas e clientes são salvos no banco e protegidos pelo seu login.</p>
              <Link className={`${actionClass} mt-5 inline-block`} to="/clients">Gerenciar clientes</Link>
            </section>} />
            <Route path="/clients" element={company ? <OnlineClients key={company.id} company={company} /> : <p>Selecione ou cadastre uma empresa para gerenciar os clientes.</p>} />
            <Route path="*" element={<section className={panelClass}><h1 className="text-xl">Módulo em preparação</h1><p className="mt-3">O uso real está disponível para empresas e clientes. Equipamentos, documentos e relatórios ainda não foram integrados ao novo banco.</p><Link to="/clients" className="mt-4 inline-block text-cyan-700 underline">Ir para clientes</Link></section>} />
          </Routes>
        </main>
      </div>
    </>
  )
}

export default function OnlineApp(props: { isDarkMode: boolean; onToggleDarkMode: () => void }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const queryClient = useQueryClient()
  useEffect(() => {
    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) {
        setSession(next)
        if (!next) queryClient.clear()
      }
    })
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) {
        console.error('Erro ao carregar sessão:', sessionError)
        setError(true)
      } else {
        setSession(data.session)
      }
      setLoading(false)
    }).catch(sessionError => {
      console.error('Erro ao carregar sessão:', sessionError)
      if (active) { setError(true); setLoading(false) }
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [queryClient])
  if (loading) return <p role="status" className="p-8">Verificando acesso...</p>
  if (error) return <div role="alert" className="p-8">Não foi possível verificar o acesso. <button className="underline" onClick={() => window.location.reload()}>Tentar novamente</button></div>
  if (!session) return <Login />
  return <Workspace key={session.user.id} session={session} {...props} />
}
