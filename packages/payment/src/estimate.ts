import { calculateAmount } from '#helpers';

export const estimate = (
  totalSeats: number,
  interval: 'monthly' | 'yearly',
) => {
  const amount = calculateAmount(totalSeats, `web.${interval}`); //TODO manage taxes

  return amount;
};
