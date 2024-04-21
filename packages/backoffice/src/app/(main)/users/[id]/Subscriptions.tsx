'use client';

import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import { useTransition } from 'react';
import { setLifetimeSubscription } from './subscriptionActions';
import type { User, UserSubscription } from '@azzapp/data';

export const Subscriptions = ({
  user,
  userSubscriptions,
}: {
  user: User;
  userSubscriptions: UserSubscription[];
}) => {
  const [pending, startTransition] = useTransition();

  const onSetLifetimeSubscription = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    startTransition(async () => {
      await setLifetimeSubscription(user.id, event.target.checked);
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
    <Box>
      <Typography variant="h4" component="h1" sx={{ mt: 5, mb: 5 }}>
        Subscriptions
      </Typography>

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
  );
};
