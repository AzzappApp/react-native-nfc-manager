'use client';

import {
  Box,
  CardHeader,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
} from '@mui/material';
import * as Sentry from '@sentry/nextjs';
import { useTransition } from 'react';
import Subscription from './Subscription';
import {
  setLifetimeSubscription,
  updateFreeEnrichments,
} from './subscriptionActions';
import type { SubscriptionWithProfilesCount } from './page';
import type { User } from '@azzapp/data';

export const Subscriptions = ({
  user,
  userSubscriptions,
}: {
  user: User;
  userSubscriptions: SubscriptionWithProfilesCount[];
}) => {
  const [pending, startTransition] = useTransition();

  const onSetLifetimeSubscription = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    startTransition(async () => {
      try {
        await setLifetimeSubscription(user.id, event.target.checked);
      } catch (e) {
        Sentry.captureException(e);
      }
    });
  };

  const onSetFreeEnrichments = (event: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(async () => {
      try {
        await updateFreeEnrichments(user.id, event.target.checked);
      } catch (e) {
        Sentry.captureException(e);
      }
    });
  };

  const isAlreadySubscribed = userSubscriptions.some(
    subscription =>
      subscription.endAt > new Date() &&
      subscription.status === 'active' &&
      subscription.subscriptionPlan !== 'web.lifetime',
  );

  const hasLifetimeSubscription = userSubscriptions.some(
    subscription =>
      subscription.subscriptionPlan === 'web.lifetime' &&
      subscription.status === 'active',
  );

  return (
    <Card>
      <CardHeader title="Subscriptions" />

      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Box>
          <FormControlLabel
            control={
              <Switch
                name="freeEnrichments"
                checked={user.freeEnrichments}
                onChange={onSetFreeEnrichments}
              />
            }
            label="Free contact enrichment"
            disabled={pending}
          />
        </Box>
        <Box>
          <FormControlLabel
            control={
              <Switch
                name="lifeTimeSubscription"
                checked={hasLifetimeSubscription}
                onChange={onSetLifetimeSubscription}
              />
            }
            label="Free & unlimited access"
            disabled={isAlreadySubscribed || pending}
          />
        </Box>

        {userSubscriptions.map(subscription => (
          <Subscription key={subscription.id} userSubscription={subscription} />
        ))}
      </CardContent>
    </Card>
  );
};
