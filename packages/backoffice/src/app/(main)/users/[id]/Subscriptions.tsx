'use client';

import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import * as Sentry from '@sentry/nextjs';
import { useTransition } from 'react';
import Subscription from './Subscription';
import { setLifetimeSubscription } from './subscriptionActions';
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
    <Box sx={{ mt: 5, mb: 5 }}>
      <Typography variant="h4" component="h1" sx={{ mt: 5, mb: 5 }}>
        Subscriptions
      </Typography>

      <Box display="flex" flexDirection="column" gap={2}>
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

        {userSubscriptions.map(subscription => (
          <Subscription key={subscription.id} userSubscription={subscription} />
        ))}
      </Box>
    </Box>
  );
};
