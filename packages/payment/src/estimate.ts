import { calculateAmount, calculateTaxes } from '#helpers';

export const estimate = async (
  totalSeats: number,
  interval: 'monthly' | 'yearly',
  countryCode?: string,
  vatNumber?: string,
) => {
  const amount = calculateAmount(totalSeats, `web.${interval}`);

  const { rate: taxRate, amount: taxes } = await calculateTaxes(
    amount,
    countryCode,
    vatNumber,
  );

  return {
    amount,
    taxes,
    taxRate,
  };
};
