import {
  AZZAPP_PLUS_PRICE,
  calculateAmountForSeats,
  calculateAzzappPlusPrice,
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

  const amountAzzappPlus = calculateAzzappPlusPrice(subscriptionPlan);

  const amount = amountForSeats + amountAzzappPlus;

  const { rate: taxRate, amount: taxes } = await calculateTaxes(
    amount,
    countryCode,
    vatNumber,
  );

  return {
    amount,
    amountForSeats,
    azzappPlusPerMonth: AZZAPP_PLUS_PRICE,
    amountAzzappPlus: calculateAzzappPlusPrice(subscriptionPlan),
    pricePerSeat: getPricePerSeat(subscriptionPlan),
    taxes,
    taxRate,
  };
};
