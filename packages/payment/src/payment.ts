import dayjs from 'dayjs';
import { eq } from 'drizzle-orm';
import {
  PaymentTable,
  createPaymentMean,
  createSubscription,
  db,
  getPaymentById,
  getSubscriptionById,
  getUserSubscriptionForWebCard,
  updateWebCard,
} from '@azzapp/data';
import { createId } from '@azzapp/data/helpers/createId';
import { login } from '#authent';
import client from './client';
import {
  calculateAmount,
  calculateNextPaymentIntervalInMinutes,
  calculateTaxes,
  generateRebillFailRule,
  getNextPaymentDate,
  type SubscriptionPlan,
} from './helpers';
import type { Customer } from '#types';

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

export const createPaymentRequest = async ({
  totalSeats,
  userId,
  webCardId,
  locale,
  plan,
  customer,
  redirectUrl,
}: {
  totalSeats: number;
  userId: string;
  webCardId: string;
  locale: string;
  plan: 'monthly' | 'yearly';
  redirectUrl: string;
  customer: Customer;
}) => {
  const ORDERID = createId();
  const TRANSACTION_HASH = createId();

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

  const result = await client.POST(
    '/api/client-payment-requests/create-from-legacy',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
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
        HASH: TRANSACTION_HASH,
        OPERATIONTYPE: 'payment',
        EXTRADATA: JSON.stringify({
          webCardId,
        }),
        CALLBACKURL: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/webhook/payment`,
        REDIRECTURL: redirectUrl,
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
        TRANSACTIONEXPIRATIONDATE: dayjs(tomorrow).format(
          'YYYY-MM-DD HH:mm:ss',
        ),
        PASSWORDCHANGEDATE: dayjs(tomorrow).format('YYYY-MM-DD'),
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

  await db.transaction(async trx => {
    await createPaymentMean(
      {
        userId,
        webCardId,
        id: ulid,
        maskedCard: '',
      },
      trx,
    );

    const subscription = await getUserSubscriptionForWebCard(userId, webCardId);

    if (subscription && subscription.status === 'active') {
      throw new Error('Subscription already active');
    }

    await createSubscription(
      {
        userId,
        webCardId,
        issuer: 'web',
        totalSeats,
        subscriberName: customer.name,
        subscriberEmail: customer.email,
        subscriberPhoneNumber: customer.phoneNumber,
        subscriberAddress: customer.address,
        subscriberCity: customer.city,
        subscriberZip: customer.zip,
        subscriberCountry: customer.country,
        subscriberCountryCode: customer.countryCode,
        subscriberVatNumber: customer.vatNumber,
        startAt: date,
        subscriptionId: createId(),
        subscriptionPlan,
        paymentMeanId: ulid,
        endAt: date,
        amount,
        taxes,
        rebillManagerId: null,
        status: 'waiting_payment',
      },
      trx,
    );

    await updateWebCard(webCardId, { isMultiUser: true });
  });

  return {
    clientRedirectUrl,
    amount,
    taxes,
  };
};

export const createSubscriptionRequest = async ({
  paymentMeanId,
  totalSeats,
  userId,
  webCardId,
  plan,
  customer,
}: {
  paymentMeanId: string;
  totalSeats: number;
  userId: string;
  webCardId: string;
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
        clientPaymentRequestUlid: paymentMeanId,
        rebill_manager_fail_rule: generateRebillFailRule(),
        rebill_manager_external_reference: subscriptionId,
        rebill_manager_callback_url: `${process.env.NEXT_PUBLIC_WEB_URL}/api/webhook/subscription`,
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
    webCardId,
    issuer: 'web' as const,
    totalSeats,
    subscriberName: customer.name,
    subscriberEmail: customer.email,
    subscriberPhoneNumber: customer.phoneNumber ?? null,
    subscriberAddress: customer.address,
    subscriberCity: customer.city,
    subscriberZip: customer.zip,
    subscriberCountry: customer.country,
    subscriberCountryCode: customer.countryCode,
    subscriberVatNumber: customer.vatNumber ?? null,
    startAt: date,
    subscriptionId,
    subscriptionPlan,
    paymentMeanId,
    endAt: nextPaymentDate,
    amount,
    taxes,
    rebillManagerId: rebillManager.data.rebillManagerId,
    revenueCatId: null,
    status: 'active' as const,
    canceledAt: null,
    freeSeats: 0,
  };
  const id = await db.transaction(async trx => {
    const id = await createSubscription(subscription, trx);
    await updateWebCard(webCardId, { isMultiUser: true });
    return id;
  });

  return { ...subscription, id };
};

export const createNewPaymentMean = async ({
  userId,
  webCardId,
  customer,
  locale,
  redirectUrl,
}: {
  userId: string;
  webCardId: string;
  locale: string;
  customer: Customer;
  redirectUrl: string;
}) => {
  const token = await login();
  const ORDERID = createId();
  const TRANSACTION_HASH = createId();

  const date = new Date();

  const tomorrow = new Date();
  tomorrow.setDate(date.getDate() + 1);

  const result = await client.POST(
    '/api/client-payment-requests/create-from-legacy',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        AMOUNT: 0,
        LANGUAGE: findLocale(locale),
        '3DSECURE': 'yes',
        '3DSECUREAUTHENTICATIONAMOUNT': 0,
        IDENTIFIER,
        ORDERID,
        VERSION: '3.0',
        DESCRIPTION: `New payment request for webCard ${webCardId}`,
        CLIENTIDENT: userId,
        CLIENTEMAIL: customer.email,
        CARDFULLNAME: customer.name,
        HIDECLIENTEMAIL: 'no',
        HASH: TRANSACTION_HASH,
        OPERATIONTYPE: 'payment',
        EXTRADATA: JSON.stringify({
          webCardId,
        }),
        REDIRECTURL: redirectUrl,
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
        TRANSACTIONEXPIRATIONDATE: dayjs(tomorrow).format(
          'YYYY-MM-DD HH:mm:ss',
        ),
        PASSWORDCHANGEDATE: dayjs(tomorrow).format('YYYY-MM-DD'),
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
    webCardId,
    id: result.data.ulid,
    maskedCard: '',
  });

  return result.data.clientRedirectUrl;
};

export const generateInvoice = async (webCardId: string, paymentId: string) => {
  const token = await login();

  const payment = await getPaymentById(paymentId);

  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.webCardId !== webCardId) {
    throw new Error('Payment does not match the webCard');
  }

  const subscription = await getSubscriptionById(payment.subscriptionId);

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (
    !payment.rebillManagerId ||
    !payment.paymentMeanId ||
    !payment.transactionId
  ) {
    throw new Error('Missing payment data');
  }

  const result = await client.POST(
    '/api/client-payment-requests/create-rebill-manager-invoice',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        clientPaymentRequestUlid: payment.paymentMeanId,
        rebillManagerId: payment.rebillManagerId,
        rebillManagerTransactionId: payment.transactionId,
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
        invoicedEmail: subscription.subscriberEmail ?? '',
        invoicedAddress1: subscription.subscriberAddress,
        invoicedAddress2: '',
        invoicedCity: subscription.subscriberCity ?? '',
        invoicedZip: subscription.subscriberZip ?? '',
        invoicedCountry: subscription.subscriberCountry ?? '',
        invoicedVat: subscription.subscriberVatNumber ?? '',
      },
    },
  );

  if (!result.data) {
    throw new Error('Invoice generation failed', { cause: result.error });
  }

  await db
    .update(PaymentTable)
    .set({
      invoiceId: result.data.invoiceId,
      invoicePdfUrl: result.data.invoicePdfPath,
    })
    .where(eq(PaymentTable.id, paymentId));

  return result.data.invoicePdfPath;
};
