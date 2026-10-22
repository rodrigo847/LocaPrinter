import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { customerService } from '../services/customerService';
import { equipmentService } from '../services/equipmentService';
import type { ClientRecord, CompanyRecord } from '../types/customers';
import type {
  CounterReadingRecord,
  EquipmentInput,
  EquipmentRecord,
} from '../types/equipment';
import { calculateEquipmentBilling, formatPageCount } from '../types/equipment';

const actionClass =
  'rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50';
const panelClass =
  'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950';
const inputClass =
  'input mt-1 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

function todayLocal() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function nextDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(year, month - 1, day + 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

function daysBetween(start: string, end: string) {
  const startTime = new Date(`${start}T00:00:00Z`).getTime();
  const endTime = new Date(`${end}T00:00:00Z`).getTime();
  return Math.floor((endTime - startTime) / 86_400_000);
}

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function errorMessage(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? error.code
      : null;
  if (code === '23505') {
    return 'Já existe um equipamento com esse número de série ou uma leitura nesta data.';
  }
  if (code === '23503') {
    return 'Não foi possível excluir: este equipamento possui histórico de leituras.';
  }
  if (error instanceof Error && error.message.includes('data da leitura')) {
    return error.message;
  }
  if (error instanceof Error && error.message.includes('contador atual')) {
    return error.message;
  }
  return 'Não foi possível salvar. Verifique os dados e tente novamente.';
}

function EquipmentEditor({
  companyId,
  clients,
  equipment,
  hasReadings,
  onClose,
  onSave,
}: {
  companyId: string;
  clients: ClientRecord[];
  equipment: EquipmentRecord | null;
  hasReadings: boolean;
  onClose: () => void;
  onSave: (input: EquipmentInput, id?: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    client_id: equipment?.client_id ?? clients[0]?.id ?? '',
    name: equipment?.name ?? '',
    brand: equipment?.brand ?? '',
    model: equipment?.model ?? '',
    serial_number: equipment?.serial_number ?? '',
    initial_counter_date: equipment?.initial_counter_date ?? todayLocal(),
    initial_counter: String(equipment?.initial_counter ?? 0),
    price_per_page: String(equipment?.price_per_page ?? '0.70'),
    loss_percentage: String(equipment?.loss_percentage ?? 3),
    status: equipment?.status ?? 'active',
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const initialCounter = Number(form.initial_counter);
    const pricePerPage = Number(form.price_per_page);
    const lossPercentage = Number(form.loss_percentage);
    if (!Number.isSafeInteger(initialCounter) || initialCounter < 0) {
      setError('Informe um contador inicial inteiro e não negativo.');
      return;
    }
    if (!Number.isFinite(pricePerPage) || pricePerPage < 0) {
      setError('Informe um valor por página válido e não negativo.');
      return;
    }
    if (
      !Number.isFinite(lossPercentage) ||
      lossPercentage < 0 ||
      lossPercentage > 100
    ) {
      setError('O percentual de perdas deve estar entre 0 e 100.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave(
        {
          company_id: companyId,
          client_id: form.client_id,
          name: form.name.trim(),
          brand: form.brand.trim(),
          model: form.model.trim(),
          serial_number: form.serial_number.trim(),
          initial_counter_date: form.initial_counter_date,
          initial_counter: initialCounter,
          price_per_page: pricePerPage,
          loss_percentage: lossPercentage,
          status: form.status as EquipmentInput['status'],
        },
        equipment?.id
      );
      onClose();
    } catch (saveError) {
      console.error('Erro ao salvar equipamento:', saveError);
      setError(errorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="equipment-editor-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4"
    >
      <form
        onSubmit={submit}
        className={`${panelClass} mx-auto my-6 max-w-3xl space-y-5`}
      >
        <div>
          <h2 id="equipment-editor-title" className="text-xl font-semibold">
            {equipment ? 'Editar equipamento' : 'Cadastrar equipamento'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre cada impressora separadamente, mesmo quando o cliente tem
            mais de um equipamento.
          </p>
        </div>
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">
            Cliente
            <select
              aria-label="Cliente"
              required
              value={form.client_id}
              disabled={hasReadings}
              onChange={event =>
                setForm({ ...form, client_id: event.target.value })
              }
              className={inputClass}
            >
              {clients.map(client => (
                <option value={client.id} key={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {hasReadings && (
              <span className="mt-1 block text-xs text-slate-500">
                O cliente não pode ser alterado após o registro de leituras.
              </span>
            )}
          </label>
          <label className="text-sm font-medium">
            Descrição do equipamento
            <input
              required
              maxLength={200}
              value={form.name}
              onChange={event => setForm({ ...form, name: event.target.value })}
              className={inputClass}
              placeholder="Ex.: Konica do setor financeiro"
            />
          </label>
          <label className="text-sm font-medium">
            Marca
            <input
              value={form.brand}
              onChange={event =>
                setForm({ ...form, brand: event.target.value })
              }
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            Modelo
            <input
              value={form.model}
              onChange={event =>
                setForm({ ...form, model: event.target.value })
              }
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            Número de série
            <input
              value={form.serial_number}
              onChange={event =>
                setForm({ ...form, serial_number: event.target.value })
              }
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            Data do contador inicial
            <input
              type="date"
              required
              disabled={hasReadings}
              value={form.initial_counter_date}
              onChange={event =>
                setForm({ ...form, initial_counter_date: event.target.value })
              }
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            Contador inicial
            <input
              type="number"
              min="0"
              step="1"
              required
              disabled={hasReadings}
              value={form.initial_counter}
              onChange={event =>
                setForm({ ...form, initial_counter: event.target.value })
              }
              className={inputClass}
            />
            {hasReadings && (
              <span className="mt-1 block text-xs text-slate-500">
                O contador inicial não pode ser alterado após a primeira
                leitura.
              </span>
            )}
          </label>
          <label className="text-sm font-medium">
            Valor por página (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.price_per_page}
              onChange={event =>
                setForm({ ...form, price_per_page: event.target.value })
              }
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            Perdas (%)
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              required
              value={form.loss_percentage}
              onChange={event =>
                setForm({ ...form, loss_percentage: event.target.value })
              }
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            Situação
            <select
              value={form.status}
              onChange={event =>
                setForm({
                  ...form,
                  status: event.target.value as EquipmentInput['status'],
                })
              }
              className={inputClass}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </label>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={actionClass}
            disabled={busy || clients.length === 0}
          >
            {busy ? 'Salvando...' : 'Salvar equipamento'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ReadingEditor({
  equipment,
  previousCounter,
  previousDate,
  onClose,
  onSave,
}: {
  equipment: EquipmentRecord;
  previousCounter: number;
  previousDate: string;
  onClose: () => void;
  onSave: (input: {
    measured_at: string;
    current_counter: number;
    loss_percentage: number;
    price_per_page: number;
  }) => Promise<void>;
}) {
  const [measuredAt, setMeasuredAt] = useState(todayLocal());
  const [currentCounter, setCurrentCounter] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const currentValue = Number(currentCounter);
  const validCounter =
    currentCounter !== '' &&
    Number.isSafeInteger(currentValue) &&
    currentValue >= previousCounter;
  const billing = validCounter
    ? calculateEquipmentBilling(
        previousCounter,
        currentValue,
        equipment.loss_percentage,
        equipment.price_per_page
      )
    : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validCounter) return;
    setBusy(true);
    setError('');
    try {
      await onSave({
        measured_at: measuredAt,
        current_counter: currentValue,
        loss_percentage: equipment.loss_percentage,
        price_per_page: equipment.price_per_page,
      });
      onClose();
    } catch (saveError) {
      console.error('Erro ao salvar leitura:', saveError);
      setError(errorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reading-editor-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4"
    >
      <form
        onSubmit={submit}
        className={`${panelClass} mx-auto my-6 max-w-xl space-y-5`}
      >
        <div>
          <h2 id="reading-editor-title" className="text-xl font-semibold">
            Lançar leitura · {equipment.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Período desde{' '}
            {new Date(`${previousDate}T00:00:00`).toLocaleDateString('pt-BR')} ·
            {` ${daysBetween(previousDate, measuredAt)} dias aproximados.`} O
            contador anterior é preenchido pela última leitura salva.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Data da leitura
            <input
              type="date"
              required
              min={previousDate ? nextDate(previousDate) : undefined}
              value={measuredAt}
              onChange={event => setMeasuredAt(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="text-sm font-medium">
            Contador anterior
            <input
              type="text"
              readOnly
              value={formatPageCount(previousCounter)}
              className={`${inputClass} bg-slate-100 dark:bg-slate-800`}
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Contador atual
            <input
              type="number"
              min={previousCounter}
              step="1"
              required
              value={currentCounter}
              onChange={event => setCurrentCounter(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        {billing && (
          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-900">
            <dt>Páginas no período</dt>
            <dd className="text-right font-medium">
              {formatPageCount(billing.pages)}
            </dd>
            <dt>Perdas ({equipment.loss_percentage}%)</dt>
            <dd className="text-right font-medium">
              {formatPageCount(billing.lostPages)}
            </dd>
            <dt>Páginas faturáveis</dt>
            <dd className="text-right font-medium">
              {formatPageCount(billing.billablePages)}
            </dd>
            <dt>Valor por página</dt>
            <dd className="text-right font-medium">
              {currency(equipment.price_per_page)}
            </dd>
            <dt className="font-semibold">Total da leitura</dt>
            <dd className="text-right font-semibold text-emerald-700 dark:text-emerald-400">
              {currency(billing.amount)}
            </dd>
          </dl>
        )}
        {!validCounter && currentCounter !== '' && (
          <p className="text-sm text-red-600">
            O contador atual deve ser um número inteiro igual ou maior que o
            anterior.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button className={actionClass} disabled={busy || !validCounter}>
            {busy ? 'Salvando...' : 'Salvar leitura'}
          </button>
        </div>
      </form>
    </div>
  );
}

function readingBilling(reading: CounterReadingRecord) {
  return calculateEquipmentBilling(
    reading.previous_counter,
    reading.current_counter,
    reading.loss_percentage,
    reading.price_per_page
  );
}

export function OnlineEquipment({ company }: { company: CompanyRecord }) {
  const queryClient = useQueryClient();
  const key = ['online-equipment', company.id];
  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const [equipments, clients, readings] = await Promise.all([
        equipmentService.equipments(company.id),
        customerService.clients(company.id),
        equipmentService.readings(company.id),
      ]);
      return { equipments, clients, readings };
    },
  });
  const [editor, setEditor] = useState<EquipmentRecord | null | undefined>();
  const [readingEquipment, setReadingEquipment] =
    useState<EquipmentRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function saveEquipment(input: EquipmentInput, id?: string) {
    await equipmentService.saveEquipment(input, id);
    await queryClient.invalidateQueries({ queryKey: key });
    toast.success(id ? 'Equipamento atualizado.' : 'Equipamento cadastrado.');
  }

  async function saveReading(
    equipment: EquipmentRecord,
    input: {
      measured_at: string;
      current_counter: number;
      loss_percentage: number;
      price_per_page: number;
    }
  ) {
    await equipmentService.saveReading({
      ...input,
      company_id: company.id,
      equipment_id: equipment.id,
    });
    await queryClient.invalidateQueries({ queryKey: key });
    toast.success('Leitura e cálculo da cobrança salvos.');
  }

  async function removeEquipment(equipment: EquipmentRecord) {
    if (
      !window.confirm(
        `Excluir ${equipment.name}? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }
    setBusyId(equipment.id);
    try {
      await equipmentService.deleteEquipment(equipment.id, company.id);
      await queryClient.invalidateQueries({ queryKey: key });
      toast.success('Equipamento excluído.');
    } catch (error) {
      console.error('Erro ao excluir equipamento:', error);
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  if (query.isLoading) return <p role="status">Carregando equipamentos...</p>;
  if (query.isError) {
    return (
      <div role="alert" className={panelClass}>
        Erro ao carregar equipamentos.{' '}
        <button
          onClick={() => void query.refetch()}
          className="text-cyan-700 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const { equipments, clients, readings } = query.data;
  const clientsById = new Map(clients.map(client => [client.id, client]));
  const readingsByEquipment = new Map<string, CounterReadingRecord[]>();
  readings.forEach(reading => {
    const list = readingsByEquipment.get(reading.equipment_id) ?? [];
    list.push(reading);
    readingsByEquipment.set(reading.equipment_id, list);
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl">Equipamentos dos clientes</h1>
          <p className="text-sm text-slate-500">
            Cadastre cada equipamento dentro do cliente que o utiliza.
          </p>
        </div>
        <button
          className={actionClass}
          disabled={clients.length === 0}
          onClick={() => setEditor(null)}
        >
          Novo equipamento
        </button>
      </div>
      {clients.length === 0 && (
        <p className={panelClass}>
          Cadastre um cliente antes de associar equipamentos.
        </p>
      )}
      {equipments.length === 0 && clients.length > 0 && (
        <p className={panelClass}>
          Nenhum equipamento cadastrado nesta empresa.
        </p>
      )}
      <div className="grid gap-5 xl:grid-cols-2">
        {equipments.map(equipment => {
          const equipmentReadings = readingsByEquipment.get(equipment.id) ?? [];
          const latest = equipmentReadings[0];
          const previousCounter =
            latest?.current_counter ?? equipment.initial_counter;
          const previousDate =
            latest?.measured_at ?? equipment.initial_counter_date;
          const client = clientsById.get(equipment.client_id);

          return (
            <article key={equipment.id} className={`${panelClass} space-y-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{equipment.name}</h2>
                  <p className="text-sm text-slate-500">
                    {client?.name ?? 'Cliente não encontrado'}
                    {equipment.brand && ` · ${equipment.brand}`}
                    {equipment.model && ` ${equipment.model}`}
                  </p>
                  {equipment.serial_number && (
                    <p className="mt-1 text-xs text-slate-500">
                      Série: {equipment.serial_number}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    equipment.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {equipment.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-900">
                <dt>Último contador</dt>
                <dd className="text-right font-medium">
                  {formatPageCount(previousCounter)}
                </dd>
                <dt>Última leitura</dt>
                <dd className="text-right font-medium">
                  {new Date(`${previousDate}T00:00:00`).toLocaleDateString(
                    'pt-BR'
                  )}
                </dd>
                <dt>Valor por página</dt>
                <dd className="text-right font-medium">
                  {currency(equipment.price_per_page)}
                </dd>
                <dt>Perdas</dt>
                <dd className="text-right font-medium">
                  {equipment.loss_percentage}%
                </dd>
              </dl>

              <div className="flex flex-wrap gap-3 text-sm">
                <button
                  className="text-cyan-700 dark:text-cyan-300"
                  onClick={() => setReadingEquipment(equipment)}
                  disabled={equipment.status !== 'active'}
                >
                  Lançar leitura
                </button>
                <button
                  className="text-cyan-700 dark:text-cyan-300"
                  onClick={() => setEditor(equipment)}
                >
                  Editar
                </button>
                {equipmentReadings.length === 0 && (
                  <button
                    className="text-red-600 disabled:opacity-50"
                    disabled={busyId !== null}
                    onClick={() => void removeEquipment(equipment)}
                  >
                    {busyId === equipment.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                )}
              </div>

              {equipmentReadings.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-sm font-medium">
                    Histórico de leituras ({equipmentReadings.length})
                  </summary>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-xs">
                      <thead className="text-slate-500">
                        <tr>
                          <th className="py-2 pr-3">Data</th>
                          <th className="py-2 pr-3">Anterior</th>
                          <th className="py-2 pr-3">Atual</th>
                          <th className="py-2 pr-3">Páginas</th>
                          <th className="py-2 pr-3">Perdas</th>
                          <th className="py-2 pr-3">Faturáveis</th>
                          <th className="py-2 pr-3">R$/página</th>
                          <th className="py-2 pr-3">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipmentReadings.map(reading => {
                          const billing = readingBilling(reading);
                          return (
                            <tr
                              key={reading.id}
                              className="border-t border-slate-100 dark:border-slate-800"
                            >
                              <td className="py-2 pr-3">
                                {new Date(
                                  `${reading.measured_at}T00:00:00`
                                ).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-2 pr-3">
                                {formatPageCount(reading.previous_counter)}
                              </td>
                              <td className="py-2 pr-3">
                                {formatPageCount(reading.current_counter)}
                              </td>
                              <td className="py-2 pr-3">
                                {formatPageCount(billing.pages)}
                              </td>
                              <td className="py-2 pr-3">
                                {formatPageCount(billing.lostPages)} (
                                {reading.loss_percentage}%)
                              </td>
                              <td className="py-2 pr-3">
                                {formatPageCount(billing.billablePages)}
                              </td>
                              <td className="py-2 pr-3">
                                {currency(reading.price_per_page)}
                              </td>
                              <td className="py-2 pr-3 font-semibold">
                                {currency(billing.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </article>
          );
        })}
      </div>

      {editor !== undefined && (
        <EquipmentEditor
          key={editor?.id ?? 'new-equipment'}
          companyId={company.id}
          clients={clients}
          equipment={editor}
          hasReadings={Boolean(
            editor && (readingsByEquipment.get(editor.id)?.length ?? 0) > 0
          )}
          onClose={() => setEditor(undefined)}
          onSave={saveEquipment}
        />
      )}
      {readingEquipment && (
        <ReadingEditor
          equipment={readingEquipment}
          previousCounter={
            readingsByEquipment.get(readingEquipment.id)?.[0]
              ?.current_counter ?? readingEquipment.initial_counter
          }
          previousDate={
            readingsByEquipment.get(readingEquipment.id)?.[0]?.measured_at ??
            readingEquipment.initial_counter_date
          }
          onClose={() => setReadingEquipment(null)}
          onSave={input => saveReading(readingEquipment, input)}
        />
      )}
    </section>
  );
}
