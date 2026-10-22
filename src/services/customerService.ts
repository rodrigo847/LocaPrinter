import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { ClientInput, CustomerDatabase } from '../types/customers'

// Reuse the authenticated client while the legacy schema is migrated separately.
const customers = supabase.schema('public') as ReturnType<SupabaseClient<CustomerDatabase>['schema']>

export const customerService = {
  async companies() {
    const { data, error } = await customers
      .from('companies').select('*').order('name')
    if (error) throw error
    return data
  },
  async saveCompany(input: { name: string; cnpj: string }, id?: string) {
    const query = id
      ? customers.from('companies').update(input).eq('id', id)
      : customers.from('companies').insert(input)
    const { data, error } = await query.select().single()
    if (error) throw error
    return data
  },
  async deleteCompany(id: string) {
    const { error } = await customers.from('companies').delete().eq('id', id).select('id').single()
    if (error) throw error
  },
  async clients(companyId: string) {
    const { data, error } = await customers
      .from('clients').select('*').eq('company_id', companyId).order('name')
    if (error) throw error
    return data
  },
  async saveClient(input: ClientInput, id?: string) {
    const query = id
      ? customers.from('clients').update(input).eq('id', id).eq('company_id', input.company_id)
      : customers.from('clients').insert(input)
    const { data, error } = await query.select().single()
    if (error) throw error
    return data
  },
  async deleteClient(id: string, companyId: string) {
    const { error } = await customers.from('clients').delete()
      .eq('id', id).eq('company_id', companyId).select('id').single()
    if (error) throw error
  },
}
