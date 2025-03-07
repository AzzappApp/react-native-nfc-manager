import * as Sentry from '@sentry/nextjs';
import {
  getPaymentById,
  getUserById,
  type UserSubscription,
} from '@azzapp/data';
import { DEFAULT_LOCALE, isSupportedLocale } from '@azzapp/i18n';
import { generateInvoice } from '@azzapp/payment';
import { SUPPORT_EMAIL } from '@azzapp/shared/emailHelpers';
import { sendTemplateEmail } from './emailHelpers';
import { getServerIntl } from './i18nHelpers';

export const sendInvoice = async ({
  paymentId,
  subscription,
}: {
  paymentId: string;
  subscription?: UserSubscription | null;
}) => {
  const user = subscription ? await getUserById(subscription.userId) : null;
  const locale = isSupportedLocale(user?.locale)
    ? user?.locale
    : DEFAULT_LOCALE;
  const intl = getServerIntl(locale);

  const payment = await getPaymentById(paymentId);
  if (payment) {
    try {
      const result =
        payment.invoicePdfUrl ??
        (await generateInvoice(payment, userSubscription => {
          const subscriptionPlan = userSubscription.subscriptionPlan;

          switch (subscriptionPlan) {
            case 'web.yearly':
              return intl.formatMessage(
                {
                  defaultMessage: `Annual azzapp+ subscription for {count, plural,
              =0 {0 seats}
              =1 {1 seat}
              other {{count} seats}
            }`,
                  id: '1Qjxt6',
                  description: 'Invoice description for yearly subscription',
                },
                {
                  count: userSubscription.totalSeats,
                },
              );
            case 'web.monthly':
              return intl.formatMessage(
                {
                  defaultMessage: `Monthly azzapp+ subscription for {count, plural,
              =0 {0 seats}
              =1 {1 seat}
              other {{count} seats}
            }`,
                  id: 'OjofpP',
                  description: 'Invoice description for monthly subscription',
                },
                {
                  count: userSubscription.totalSeats,
                },
              );

            default:
              throw new Error('Invalid subscription plan');
          }
        }));

      if (result) {
        const to = subscription?.subscriberEmail ?? user?.email;
        if (to) {
          const subject = intl.formatMessage(
            {
              defaultMessage: 'Your receipt for {receiptDate}',
              id: 'SYKef1',
              description: 'Email subject for invoice',
            },
            {
              receiptDate: payment.createdAt.toLocaleDateString(locale, {
                month: 'long',
                year: 'numeric',
              }),
            },
          );

          await sendTemplateEmail({
            recipients: [
              {
                to,
                dynamicTemplateData: {
                  subject,
                  title: subject,
                  dear: intl.formatMessage(
                    {
                      defaultMessage: 'Dear {name},',
                      description: 'Email body for invoice - dear',
                      id: 'ms4wF7',
                    },
                    {
                      name: subscription?.subscriberName ?? '',
                    },
                  ),

                  subscription: intl.formatMessage(
                    {
                      defaultMessage:
                        'Here are your billing details for your {plan} subscription. Please find your receipt attached in the link below. ',
                      description: 'Email body for invoice - plan',
                      id: '4nkcc9',
                    },
                    {
                      plan:
                        subscription?.subscriptionPlan === 'web.yearly'
                          ? 'yearly'
                          : 'monthly',
                    },
                  ),
                  question: intl.formatMessage({
                    defaultMessage:
                      'If you have any questions, please do not hesitate to contact us at',
                    description: 'Email body for invoice - question',
                    id: 'DdSP0U',
                  }),
                  address: SUPPORT_EMAIL,
                  thrilled: intl.formatMessage({
                    defaultMessage:
                      'We are thrilled to have you as a part of the azzapp+ family!',
                    description:
                      'Email body for invoice - part of azzapp+ family',
                    id: 'hpS7cf',
                  }),
                  regards: intl.formatMessage({
                    defaultMessage: 'Warm regards,',
                    description: 'Email body for invoice - regards',
                    id: '5n/vS1',
                  }),
                  team: intl.formatMessage({
                    defaultMessage: 'The Azzapp team',
                    description: 'Email body for invoice - team',
                    id: 'MHw1+e',
                  }),
                  downloadUrl: result,
                  download: intl.formatMessage({
                    defaultMessage: 'Download your receipt',
                    description: 'Email body for invoice - download',
                    id: 'JBgTaz',
                  }),
                  userMgmtUrl: process.env.NEXT_PUBLIC_USER_MGMT_URL,
                  manage: intl.formatMessage({
                    defaultMessage: 'Manage your team',
                    description:
                      'Email body for invoice - user management link',
                    id: 'ss/om+',
                  }),
                  year: payment.createdAt.getFullYear(),
                },
              },
            ],
            templateId: 'd-e7162e7dfcf3412482adbfc0720dd300',
          });
        }
      }
    } catch (e) {
      console.error(e);
      Sentry.captureException(e);
    }
  }
};
