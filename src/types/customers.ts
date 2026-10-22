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
}

export type CustomerDatabase = {
  public: {
    Tables: CustomerTables
    Views: {}
    Functions: {}
    Enums: {}
  }
}
