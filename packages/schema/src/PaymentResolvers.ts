import { idResolver } from './utils';
import type {
  PaymentMeanResolvers,
  PaymentResolvers,
} from '#__generated__/types';

export const Payment: PaymentResolvers = {
  id: idResolver('Payment'),
};

export const PaymentMean: PaymentMeanResolvers = {
  id: idResolver('PaymentMean'),
};
