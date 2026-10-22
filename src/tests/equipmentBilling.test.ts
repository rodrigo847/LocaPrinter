import { calculateEquipmentBilling, formatPageCount } from '../types/equipment';

describe('cálculo de leitura e cobrança do equipamento', () => {
  it('aplica o percentual sem arredondar páginas antes do valor cobrado', () => {
    expect(calculateEquipmentBilling(1_289_204, 1_291_727, 3, 0.7)).toEqual({
      pages: 2523,
      lostPages: 75.69,
      billablePages: 2447.31,
      amount: 1713.12,
    });
    expect(calculateEquipmentBilling(1_291_727, 1_293_960, 3, 0.7)).toEqual({
      pages: 2233,
      lostPages: 66.99,
      billablePages: 2166.01,
      amount: 1516.21,
    });
  });

  it('formata páginas fracionadas e inteiras em pt-BR', () => {
    expect(formatPageCount(2523)).toBe('2.523');
    expect(formatPageCount(2447.31)).toBe('2.447,31');
  });
});
