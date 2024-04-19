'use client';

import { AccountCircle } from '@mui/icons-material';
import {
  Box,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Card,
  Breadcrumbs,
  Link,
  Switch,
} from '@mui/material';
import { useTransition } from 'react';
import * as ROLES from '#roles';
import {
  toggleRole,
  removeWebcard,
  toggleLifeTimeSubscription,
} from './userActions';
import WebcardCover from './WebcardCover';
import type { User, UserSubscription, WebCard } from '@azzapp/data';

type UserFormProps = {
  user: User;
  webCards: WebCard[];
  userSubscriptions: UserSubscription[];
};

const UserForm = ({ user, webCards, userSubscriptions }: UserFormProps) => {
  const [loading, startTransition] = useTransition();
  const onToggleRole = (role: string) => {
    startTransition(async () => {
      await toggleRole(user.id, role).catch(console.error);
    });
  };

  const onSetLifetimeSubscription = () => {
    startTransition(async () => {
      await toggleLifeTimeSubscription(user.id).catch(console.error);
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
    <Box display="flex" flexDirection="column">
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href="/users"
        >
          <AccountCircle sx={{ mr: 0.5 }} fontSize="inherit" />
          Users
        </Link>
      </Breadcrumbs>

      <Typography variant="h4" component="h1" sx={{ mb: 10 }}>
        User {user.id}
      </Typography>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Webcards: {webCards.length}
      </Typography>
      <Card
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-around',
          padding: 2,
          height: 500,
          overflow: 'auto',
        }}
      >
        {webCards.map(webCard => (
          <WebcardCover
            key={webCard.id}
            webcard={webCard}
            onRemoveWebcard={removeWebcard}
          />
        ))}
      </Card>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          width: '100%',
          marginTop: 2,
        }}
      >
        <TextField
          sx={{ flex: 1 }}
          value={user.email}
          label="Email"
          inputProps={{
            readOnly: true,
          }}
          disabled={!user.email}
        />
        <TextField
          sx={{ flex: 1 }}
          value={user.phoneNumber || ''}
          label="Phone Number"
          inputProps={{
            readOnly: true,
          }}
          disabled={!user.phoneNumber}
        />
      </Box>
      {Object.values(ROLES).map(role => (
        <FormControlLabel
          key={role}
          control={
            <Checkbox
              name={role}
              checked={user.roles?.includes(role)}
              onChange={() => onToggleRole(role)}
            />
          }
          label={role}
          disabled={loading}
        />
      ))}

      <Typography variant="h4" component="h1" sx={{ mt: 5, mb: 5 }}>
        Subscriptions
      </Typography>

      <FormControlLabel
        control={
          <Switch
            disabled={isAlreadySubscribed || loading}
            checked={hasLifetimeSubscription}
            onChange={onSetLifetimeSubscription}
          />
        }
        label="Free & unlimited access"
      />
    </Box>
  );
};

export default UserForm;
