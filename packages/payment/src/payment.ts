import dayjs from 'dayjs';
import {
  createPaymentMean,
  createSubscription,
  getSubscriptionById,
  transaction,
  updatePayment,
  createId,
  getUserWebSubscription,
} from '@azzapp/data';
import { login } from '#authent';
import client from './client';
import {
  calculateAmount,
  calculateNextPaymentIntervalInMinutes,
  calculateTaxes,
  generateRebillFailRule,
  getNextPaymentDate,
  signature,
  type SubscriptionPlan,
} from './helpers';
import type { Customer } from '#types';
import type { Payment, PaymentMean, UserSubscription } from '@azzapp/data';

const IDENTIFIER = 'POOL_AZZAP';

/**
 * Supported locales for payment request
 */
const SUPPORTED_LOCALES = [
  'fr',
  'en',
  'de',
  'es',
  'it',
  'nl',
  'zh',
  'ru',
  'pt',
  'sk',
] as const;

type Locale = (typeof SUPPORTED_LOCALES)[number];

const findLocale = (locale: string): Locale => {
  if (SUPPORTED_LOCALES.includes(locale as Locale)) {
    return locale as Locale;
  }
  return 'en';
};

export const getPaymentRequest = async (ulid: string) => {
  const token = await login();

  const result = await client.GET('/api/client-payment-requests/ulid/{ulid}', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      path: {
        ulid,
      },
    },
  });

  if (!result.data) {
    throw new Error('Payment request not found', { cause: result.error });
  }

  return result.data;
};

export const createPaymentRequest = async ({
  totalSeats,
  userId,
  locale,
  plan,
  customer,
  redirectUrlSuccess,
  redirectUrlCancel,
}: {
  totalSeats: number;
  userId: string;
  locale: string;
  plan: 'monthly' | 'yearly';
  redirectUrlSuccess: string;
  redirectUrlCancel: string;
  customer: Customer;
}) => {
  const ORDERID = createId();

  const subscriptionPlan: SubscriptionPlan = `web.${plan}`;

  const amount = calculateAmount(totalSeats, subscriptionPlan);

  const { amount: taxes } = await calculateTaxes(
    amount,
    customer.countryCode,
    customer.vatNumber ?? undefined,
  );

  const token = await login();

  const date = new Date();

  const tomorrow = new Date();
  tomorrow.setDate(date.getDate() + 1);
  const expirationDate = new Date(date.getTime() + 5 * 60000);

  const requestBody = {
    AMOUNT: amount + taxes,
    LANGUAGE: findLocale(locale),
    '3DSECURE': 'yes',
    '3DSECUREAUTHENTICATIONAMOUNT': 0,
    IDENTIFIER,
    ORDERID,
    VERSION: '3.0',
    DESCRIPTION: `Payment for ${plan} subscription`,
    CLIENTIDENT: userId,
    CLIENTEMAIL: customer.email,
    CARDFULLNAME: customer.name,
    HIDECLIENTEMAIL: 'no',
    OPERATIONTYPE: 'payment',
    EXTRADATA: JSON.stringify({
      userId,
    }),
    CALLBACKURL: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/webhook/payment`,
    REDIRECTURLSUCCESS: redirectUrlSuccess,
    REDIRECTURLCANCEL: redirectUrlCancel,
    BILLINGADDRESS: customer.address,
    BILLINGCITY: customer.city,
    BILLINGPOSTALCODE: customer.zip,
    BILLINGCOUNTRY: customer.country,
    DELIVERYTIMEFRAME: 'electronic',
    SHIPTOADDRESS: customer.address,
    SHIPTOADDRESSTYPE: 'billing',
    SHIPTOCITY: customer.city,
    SHIPTOPOSTALCODE: customer.zip,
    SHIPTOCOUNTRY: customer.country,
    ACCOUNTCREATIONDATE: dayjs(date).format('YYYY-MM-DD'),
    ACCOUNTCHANGEDATE: dayjs(date).format('YYYY-MM-DD'),
    TIMEZONE: 'UTC',
    TRANSACTIONEXPIRATIONDATE: dayjs(expirationDate).format(
      'YYYY-MM-DD HH:mm:ss',
    ),
    PASSWORDCHANGEDATE: dayjs(tomorrow).format('YYYY-MM-DD'),
  } as const;

  const result = await client.POST(
    '/api/client-payment-requests/create-from-legacy',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        ...requestBody,
        HASH: await signature(requestBody),
      },
    },
  );

  if (!result.data) {
    throw new Error('Payment request creation failed', { cause: result.error });
  }

  if (!result.data.ulid) {
    throw new Error('Payment request creation failed');
  }

  const { clientRedirectUrl, ulid } = result.data;

  await transaction(async () => {
    await createPaymentMean({
      userId,
      id: ulid,
      maskedCard: '',
    });

    const subscription = await getUserWebSubscription(userId);

    if (subscription && subscription.status === 'active') {
      throw new Error('Subscription already active');
    }
    const subscriptionId = createId();

    await createSubscription({
      id: subscriptionId,
      subscriptionId,
      userId,
      issuer: 'web',
      totalSeats,
      subscriberName: customer.name,
      subscriberEmail: customer.email,
      subscriberPhoneNumber: customer.phone,
      subscriberAddress: customer.address,
      subscriberCity: customer.city,
      subscriberZip: customer.zip,
      subscriberCountry: customer.country,
      subscriberCountryCode: customer.countryCode,
      subscriberVatNumber: customer.vatNumber,
      startAt: date,
      subscriptionPlan,
      paymentMeanId: ulid,
      endAt: expirationDate,
      amount,
      taxes,
      rebillManagerId: null,
      status: 'waiting_payment',
    });
  });

  return {
    clientRedirectUrl,
    amount,
    taxes,
  };
};

export const createSubscriptionRequest = async ({
  paymentMean,
  totalSeats,
  userId,
  plan,
  customer,
}: {
  paymentMean: PaymentMean;
  totalSeats: number;
  userId: string;
  plan: 'monthly' | 'yearly';
  customer: Customer;
}) => {
  const subscriptionPlan: SubscriptionPlan = `web.${plan}`;

  const amount = calculateAmount(totalSeats, subscriptionPlan);
  const { amount: taxes } = await calculateTaxes(
    amount,
    customer.countryCode,
    customer.vatNumber ?? undefined,
  );

  const token = await login();

  const date = new Date();

  const nextPaymentDate = getNextPaymentDate(subscriptionPlan);

  const intervalInMinutes =
    calculateNextPaymentIntervalInMinutes(subscriptionPlan);

  const subscriptionId = createId();

  const rebillManager = await client.POST(
    '/api/client-payment-requests/create-rebill-manager',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        billing_description: `Subscription ${subscriptionPlan} for ${totalSeats} seats`,
        rebill_manager_initial_type: 'PAID',
        rebill_manager_initial_price_cnts: `${amount}`,
        rebill_manager_initial_duration_min: `${intervalInMinutes}`,
        rebill_manager_rebill_price_cnts: `${amount}`,
        rebill_manager_rebill_duration_mins: `0`,
        rebill_manager_rebill_period_mins: `${intervalInMinutes}`,
        clientPaymentRequestUlid: paymentMean.id,
        rebill_manager_fail_rule: generateRebillFailRule(),
        rebill_manager_external_reference: subscriptionId,
        rebill_manager_callback_url: `${process.env.NEXT_PUBLIC_URL}api/webhook/subscription`,
      },
    },
  );

  if (!rebillManager.data) {
    throw new Error('Rebill manager creation failed', {
      cause: rebillManager.error,
    });
  }

  if ((rebillManager.data.status as string) !== 'CREATED') {
    throw new Error(
      rebillManager.data.reason || 'Failed to create rebill manager',
    );
  }
  const subscription = {
    userId,
    issuer: 'web' as const,
    totalSeats,
    subscriberName: customer.name,
    subscriberEmail: customer.email,
    subscriberPhoneNumber: customer.phone ?? null,
    subscriberAddress: customer.address,
    subscriberCity: customer.city,
    subscriberZip: customer.zip,
    subscriberCountry: customer.country,
    subscriberCountryCode: customer.countryCode,
    subscriberVatNumber: customer.vatNumber ?? null,
    startAt: date,
    subscriptionId,
    subscriptionPlan,
    paymentMeanId: paymentMean.id,
    endAt: nextPaymentDate,
    amount,
    taxes,
    rebillManagerId: rebillManager.data.rebillManagerId,
    revenueCatId: null,
    status: 'active' as const,
    canceledAt: null,
    freeSeats: 0,
    lastPaymentError: false,
    invalidatedAt: null,
  };

  const id = await createSubscription(subscription);

  return { ...subscription, id };
};

export const createNewPaymentMean = async ({
  userId,
  customer,
  locale,
  redirectUrlSuccess,
  redirectUrlCancel,
}: {
  userId: string;
  locale: string;
  customer: Customer;
  redirectUrlSuccess: string;
  redirectUrlCancel: string;
}) => {
  const token = await login();
  const ORDERID = createId();

  const date = new Date();

  const tomorrow = new Date();
  tomorrow.setDate(date.getDate() + 1);

  const requestBody = {
    AMOUNT: 0,
    LANGUAGE: findLocale(locale),
    '3DSECURE': 'yes',
    '3DSECUREAUTHENTICATIONAMOUNT': 0,
    IDENTIFIER,
    ORDERID,
    VERSION: '3.0',
    DESCRIPTION: `New payment request for user ${userId}`,
    CLIENTIDENT: userId,
    CLIENTEMAIL: customer.email,
    CARDFULLNAME: customer.name,
    HIDECLIENTEMAIL: 'no',
    OPERATIONTYPE: 'payment',
    EXTRADATA: JSON.stringify({
      userId,
    }),
    REDIRECTURLSUCCESS: redirectUrlSuccess,
    REDIRECTURLCANCEL: redirectUrlCancel,
    CALLBACKURL: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/webhook/payment`,
    BILLINGADDRESS: customer.address,
    BILLINGCITY: customer.city,
    BILLINGPOSTALCODE: customer.zip,
    BILLINGCOUNTRY: customer.country,
    DELIVERYTIMEFRAME: 'electronic',
    SHIPTOADDRESS: customer.address,
    SHIPTOADDRESSTYPE: 'billing',
    SHIPTOCITY: customer.city,
    SHIPTOPOSTALCODE: customer.zip,
    SHIPTOCOUNTRY: customer.country,
    ACCOUNTCREATIONDATE: dayjs(date).format('YYYY-MM-DD'),
    ACCOUNTCHANGEDATE: dayjs(date).format('YYYY-MM-DD'),
    TIMEZONE: 'Europe/Paris',
    TRANSACTIONEXPIRATIONDATE: dayjs(tomorrow).format('YYYY-MM-DD HH:mm:ss'),
    PASSWORDCHANGEDATE: dayjs(tomorrow).format('YYYY-MM-DD'),
  } as const;

  const result = await client.POST(
    '/api/client-payment-requests/create-from-legacy',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        ...requestBody,
        HASH: await signature(requestBody),
      },
    },
  );

  if (!result.data) {
    throw new Error('Payment mean creation failed', { cause: result.error });
  }

  if (!result.data.ulid) {
    throw new Error('Payment mean creation failed');
  }

  await createPaymentMean({
    userId,
    id: result.data.ulid,
    maskedCard: '',
  });

  return result.data.clientRedirectUrl;
};

export const generateInvoice = async (
  payment: Payment,
  formatProduct: (subscription: UserSubscription) => string,
) => {
  const token = await login();

  const subscription = await getSubscriptionById(payment.subscriptionId);

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (!payment.paymentMeanId || !payment.transactionId) {
    throw new Error('Missing payment data');
  }

  const invoiceBody = {
    clientPaymentRequestUlid: payment.paymentMeanId,
    invoicingCompany: process.env.INVOICING_COMPANY ?? 'APPCORP',
    invoicingEmail: process.env.INVOICING_EMAIL ?? 'contact@azzapp.com',
    invoicingAddress1:
      process.env.INVOICING_ADDRESS ?? '3-5 avenue des Citronniers',
    invoicingAddress2: '',
    invoicingCity: process.env.INVOICING_CITY ?? 'Monaco',
    invoicingZip: process.env.INVOICING_ZIP ?? '98000',
    invoicingCountry: process.env.INVOICING_COUNTRY ?? 'France',
    invoicingVat: process.env.INVOICING_VAT ?? 'FR68923096283',
    invoicedCompany: subscription.subscriberName ?? '',
    invoicedFirstname: '',
    invoicedLastname: '',
    invoicedEmail: subscription.subscriberEmail ?? '',
    invoicedAddress1: subscription.subscriberAddress,
    invoicedAddress2: '',
    invoicedCity: subscription.subscriberCity ?? '',
    invoicedZip: subscription.subscriberZip ?? '',
    invoicedCountry: subscription.subscriberCountry ?? '',
    invoicedVat: subscription.subscriberVatNumber ?? '',
    invoicedPhone: subscription.subscriberPhoneNumber ?? '',
    invoicedProduct: formatProduct(subscription),
    hasVat: payment.taxes > 0 ? '1' : '0',
    vatRate: `${Math.round((payment.taxes / payment.amount) * 100)}`,
  };

  let result;
  if (payment.rebillManagerId) {
    const rebillManager = await client.POST(
      '/api/client-payment-requests/check-rebill-manager',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          rebillManagerId: payment.rebillManagerId,
          clientPaymentRequestUlid: payment.paymentMeanId,
        },
      },
    );

    const foundTransaction = rebillManager.data?.transactions?.find(
      transaction => transaction.transaction_id === payment.transactionId,
    );

    result = await client.POST(
      '/api/client-payment-requests/create-rebill-manager-invoice',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          ...invoiceBody,
          rebillManagerId: payment.rebillManagerId,
          rebillManagerTransactionId:
            foundTransaction?.rebill_manager_transaction_id ?? '',
        } as any, //hasVat and vatRate types does not match the API,
      },
    );
  } else {
    result = await client.POST(
      '/api/client-payment-requests/create-bill-invoice',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { ...invoiceBody, transactionId: payment.transactionId } as any, //hasVat and vatRate types does not match the API,
      },
    );
  }

  if (!result.data) {
    throw new Error('Invoice generation failed', { cause: result.error });
  }

  await updatePayment(payment.id, {
    invoiceId: result.data.invoiceId,
    invoicePdfUrl: result.data.invoicePdfPath,
  });

  return result.data.invoicePdfPath;
};
