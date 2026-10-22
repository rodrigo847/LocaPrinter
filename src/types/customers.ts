import type {
  CounterReadingRecord,
  EquipmentRecord,
} from './equipment'

export type CompanyRecord = {
  id: string
  owner_id: string
  name: string
  cnpj: string
  created_at: string
  updated_at: string
}

export type ClientRecord = {
  id: string
  company_id: string
  type: 'PF' | 'PJ'
  document: string
  name: string
  email: string
  phone: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  created_at: string
  updated_at: string
}

export type ClientInput = Omit<ClientRecord, 'id' | 'created_at' | 'updated_at'>

export type EquipmentTables = {
  equipment: {
    Row: EquipmentRecord
    Insert: Omit<EquipmentRecord, 'id' | 'created_at' | 'updated_at'> &
      Partial<Pick<EquipmentRecord, 'id' | 'created_at' | 'updated_at'>>
    Update: Partial<Omit<EquipmentRecord, 'id' | 'created_at' | 'updated_at'>>
    Relationships: []
  }
  counter_readings: {
    Row: CounterReadingRecord
    Insert: Omit<CounterReadingRecord, 'id' | 'created_at' | 'previous_counter'> &
      Partial<Pick<CounterReadingRecord, 'id' | 'created_at' | 'previous_counter'>>
    Update: never
    Relationships: []
  }
}

export type CustomerTables = {
  companies: {
    Row: CompanyRecord
    Insert: Pick<CompanyRecord, 'name' | 'cnpj'> &
      Partial<Pick<CompanyRecord, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>
    Update: Partial<Pick<CompanyRecord, 'name' | 'cnpj'>>
    Relationships: []
  }

  clients: {
    Row: ClientRecord
    Insert: ClientInput & Partial<Pick<ClientRecord, 'id' | 'created_at' | 'updated_at'>>
    Update: Partial<ClientInput>
    Relationships: []
  }
} & EquipmentTables

export type CustomerDatabase = {
  public: {
    Tables: CustomerTables
    Views: {}
    Functions: {}
    Enums: {}
  }
}
