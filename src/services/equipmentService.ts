import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { CustomerDatabase } from '../types/customers';
import type { CounterReadingInput, EquipmentInput } from '../types/equipment';

const equipmentDatabase = supabase.schema('public') as ReturnType<
  SupabaseClient<CustomerDatabase>['schema']
>;

export const equipmentService = {
  async equipments(companyId: string) {
    const { data, error } = await equipmentDatabase
      .from('equipment')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    if (error) throw error;
    return data;
  },

  async saveEquipment(input: EquipmentInput, id?: string) {
    const query = id
      ? equipmentDatabase
          .from('equipment')
          .update(input)
          .eq('id', id)
          .eq('company_id', input.company_id)
      : equipmentDatabase.from('equipment').insert(input);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },

  async deleteEquipment(id: string, companyId: string) {
    const { error } = await equipmentDatabase
      .from('equipment')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)
      .select('id')
      .single();
    if (error) throw error;
  },

  async readings(companyId: string) {
    const { data, error } = await equipmentDatabase
      .from('counter_readings')
      .select('*')
      .eq('company_id', companyId)
      .order('measured_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async saveReading(input: CounterReadingInput) {
    const { data, error } = await equipmentDatabase
      .from('counter_readings')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
