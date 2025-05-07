import { GraphQLError } from 'graphql';
import {
  getPaymentById,
  getPaymentMeanById,
  getSubscriptionById,
} from '@azzapp/data';
import {
  createPaymentRequest,
  createSubscriptionRequest,
  createNewPaymentMean,
  estimate,
  generateInvoice,
  upgradePlan,
  endSubscription as endExistingSubscription,
  updateActiveSubscription,
  updateCustomer,
  renewUserSubscription,
  estimateUpdateSubscriptionForWebCard,
} from '@azzapp/payment';
import ERRORS from '@azzapp/shared/errors';
import { getSessionUser } from '#GraphQLContext';
import { checkWebCardProfileAdminRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#__generated__/types';
import type { GraphQLContext } from '#GraphQLContext';
import type { UserSubscription } from '@azzapp/data';

export const estimateSubscriptionCost: MutationResolvers['estimateSubscriptionCost'] =
  async (_, { totalSeats, plan, countryCode, vatNumber }) => {
    const cost = await estimate(
      totalSeats,
      plan,
      countryCode ?? undefined,
      vatNumber ?? undefined,
    );

    return { ...cost, amountAzzappPlus: 0, azzappPlusPerMonth: 0 };
  };

export const estimateUpdateSubscriptionCost: MutationResolvers['estimateUpdateSubscriptionCost'] =
  async (_, { subscriptionId: gqlSubscriptionId, totalSeats }) => {
    try {
      const subscriptionId = fromGlobalIdWithType(
        gqlSubscriptionId,
        'UserSubscription',
      );
      const { subscription } = await checkSubscription(subscriptionId);

      const result = await estimateUpdateSubscriptionForWebCard({
        totalSeats,
        subscription,
      });
      return {
        ...result,
        firstPayment: result.firstPayment
          ? {
              ...result.firstPayment,
              azzappPlusPerMonth: 0,
              amountAzzappPlus: 0,
            }
          : null,
        recurringCost: {
          ...result.recurringCost,
          azzappPlusPerMonth: 0,
          amountAzzappPlus: 0,
        },
      };
    } catch (err) {
      throw new GraphQLError(ERRORS.PAYMENT_ERROR, {
        originalError: err as Error,
      });
    }
  };

export const createPaymentIntent: MutationResolvers['createPaymentIntent'] =
  async (_, { intent }, context) => {
    const user = await getSessionUser();
    if (!user) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
    const webCardId = intent.webCardId
      ? fromGlobalIdWithType(intent.webCardId, 'WebCard')
      : undefined;
    if (webCardId) {
      await checkWebCardProfileAdminRight(webCardId);
    }

    try {
      const result = await createPaymentRequest({
        ...intent,
        webCardId,
        userId: user.id,
        paymentCallBackUrl: `${context.apiEndpoint}/webhook/payment`,
      });

      if (!result?.clientRedirectUrl) {
        throw new GraphQLError(ERRORS.PAYMENT_ERROR);
      }
      return result;
    } catch {
      throw new GraphQLError(ERRORS.PAYMENT_ERROR);
    }
  };

export const createSubscriptionFromPaymentMean: MutationResolvers['createSubscriptionFromPaymentMean'] =
  async (_, { intent, paymentMeanId }, context) => {
    const user = await getSessionUser();
    if (!user) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
    const paymentMean = await getPaymentMeanById(
      fromGlobalIdWithType(paymentMeanId, 'PaymentMean'),
    );

    if (paymentMean?.userId !== user.id) {
      throw new GraphQLError(ERRORS.FORBIDDEN);
    }

    const result = await createSubscriptionRequest({
      ...intent,
      paymentMean,
      userId: user.id,
      subscriptionCallBackUrl: `${context.apiEndpoint}/webhook/subscription`,
    });

    return result;
  };

export const createPaymentMean: MutationResolvers['createPaymentMean'] = async (
  _,
  { locale, redirectUrlSuccess, redirectUrlCancel, customer },
  context,
) => {
  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const result = await createNewPaymentMean({
    customer,
    userId: user.id,
    locale,
    redirectUrlSuccess,
    redirectUrlCancel,
    paymentCallBackUrl: `${context.apiEndpoint}/webhook/payment`,
  });

  if (!result) {
    throw new GraphQLError(ERRORS.PAYMENT_ERROR);
  }

  return result;
};

export const generatePaymentInvoice: MutationResolvers<GraphQLContext>['generatePaymentInvoice'] =
  async (_, { paymentId }, { intl }) => {
    const user = await getSessionUser();
    if (!user) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
    const payment = await getPaymentById(
      fromGlobalIdWithType(paymentId, 'Payment'),
    );

    if (!payment) {
      throw new GraphQLError(ERRORS.NOT_FOUND);
    }

    if (payment.userId !== user.id) {
      throw new GraphQLError(ERRORS.FORBIDDEN);
    }

    const result = await generateInvoice(
      payment,
      (userSubscription: UserSubscription) => {
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
                id: '85DMRR',
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
                id: 'P28o+6',
                description: 'Invoice description for monthly subscription',
              },
              {
                count: userSubscription.totalSeats,
              },
            );

          default:
            throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR, {
              originalError: new Error('Invalid subscription plan'),
            });
        }
      },
    );

    if (!result) {
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    return result;
  };

export const updateSubscription: MutationResolvers['updateSubscription'] =
  async (
    _,
    {
      paymentMeanId: gqlPaymentMeanId,
      subscriptionId: gqlSubscriptionId,
      totalSeats,
    },
    context,
  ) => {
    const subscriptionId = fromGlobalIdWithType(
      gqlSubscriptionId,
      'UserSubscription',
    );

    const { subscription } = await checkSubscription(subscriptionId);

    return updateActiveSubscription({
      subscription,
      totalSeats,
      paymentMeanId: gqlPaymentMeanId
        ? fromGlobalIdWithType(gqlPaymentMeanId, 'PaymentMean')
        : null,
      subscriptionCallBackUrl: `${context.apiEndpoint}/webhook/subscription`,
    });
  };

export const upgradeSubscriptionPlan: MutationResolvers['upgradeSubscriptionPlan'] =
  async (_, { subscriptionId: gqlSubscriptionId }, context) => {
    const subscriptionId = fromGlobalIdWithType(
      gqlSubscriptionId,
      'UserSubscription',
    );

    const { subscription } = await checkSubscription(subscriptionId);

    return upgradePlan(
      subscription,
      `${context.apiEndpoint}/webhook/subscription`,
    );
  };

export const endSubscription: MutationResolvers['endSubscription'] = async (
  _,
  { subscriptionId: gqlSubscriptionId },
) => {
  const subscriptionId = fromGlobalIdWithType(
    gqlSubscriptionId,
    'UserSubscription',
  );

  const { subscription } = await checkSubscription(subscriptionId);

  const result = await endExistingSubscription(subscription);

  if (!result) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return result;
};

export const updateSubscriptionCustomer: MutationResolvers['updateSubscriptionCustomer'] =
  async (_, { subscriptionId: gqlSubscriptionId, customer }) => {
    const subscriptionId = fromGlobalIdWithType(
      gqlSubscriptionId,
      'UserSubscription',
    );

    const { subscription } = await checkSubscription(subscriptionId);

    return updateCustomer(subscription, customer);
  };

export const renewSubscription: MutationResolvers['renewSubscription'] = async (
  _,
  { subscriptionId: gqlSubscriptionId },
) => {
  const subscriptionId = fromGlobalIdWithType(
    gqlSubscriptionId,
    'UserSubscription',
  );

  const { subscription, userId } = await checkSubscription(subscriptionId);

  return renewUserSubscription(subscription, userId);
};

const checkSubscription = async (subscriptionId: string) => {
  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  const subscription = await getSubscriptionById(subscriptionId);

  if (!subscription) {
    throw new GraphQLError(ERRORS.NOT_FOUND);
  }

  if (subscription.userId !== user.id) {
    throw new GraphQLError(ERRORS.FORBIDDEN);
  }
  return { subscription, userId: user.id };
};
