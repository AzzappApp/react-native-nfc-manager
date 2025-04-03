import {
  calculateAmountForSeats,
  calculateTaxes,
  getPricePerSeat,
} from '#helpers';

export const estimate = async (
  totalSeats: number,
  interval: 'monthly' | 'yearly',
  countryCode?: string,
  vatNumber?: string,
) => {
  const subscriptionPlan = `web.${interval}` as const;

  const amountForSeats = calculateAmountForSeats(totalSeats, subscriptionPlan);

  const amount = amountForSeats;

  const { rate: taxRate, amount: taxes } = await calculateTaxes(
    amount,
    countryCode,
    vatNumber,
  );

  return {
    amount,
    amountForSeats,
    pricePerSeat: getPricePerSeat(subscriptionPlan),
    taxes,
    taxRate,
  };
};
