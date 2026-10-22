export type EquipmentStatus = 'active' | 'inactive';

export type EquipmentRecord = {
  id: string;
  company_id: string;
  client_id: string;
  name: string;
  brand: string;
  model: string;
  serial_number: string;
  initial_counter_date: string;
  initial_counter: number;
  price_per_page: number;
  loss_percentage: number;
  status: EquipmentStatus;
  created_at: string;
  updated_at: string;
};

export type EquipmentInput = Omit<
  EquipmentRecord,
  'id' | 'created_at' | 'updated_at'
>;

export type CounterReadingRecord = {
  id: string;
  company_id: string;
  equipment_id: string;
  measured_at: string;
  previous_counter: number;
  current_counter: number;
  loss_percentage: number;
  price_per_page: number;
  created_at: string;
};

export type CounterReadingInput = Pick<
  CounterReadingRecord,
  | 'company_id'
  | 'equipment_id'
  | 'measured_at'
  | 'current_counter'
  | 'loss_percentage'
  | 'price_per_page'
>;

export type EquipmentBilling = {
  pages: number;
  lostPages: number;
  billablePages: number;
  amount: number;
};

export function calculateEquipmentBilling(
  previousCounter: number,
  currentCounter: number,
  lossPercentage: number,
  pricePerPage: number
): EquipmentBilling {
  const pages = currentCounter - previousCounter;
  const lostPages = pages * (lossPercentage / 100);
  const billablePages = pages - lostPages;
  const amount = Math.round(billablePages * pricePerPage * 100) / 100;

  return { pages, lostPages, billablePages, amount };
}

export function formatPageCount(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}
