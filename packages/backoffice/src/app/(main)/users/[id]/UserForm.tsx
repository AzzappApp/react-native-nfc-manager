'use client';

import {
  Box,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Card,
} from '@mui/material';
import * as Sentry from '@sentry/nextjs';
import { useTransition } from 'react';
import * as ROLES from '#roles';
import { toggleRole, removeWebcard } from './userActions';
import WebcardCover from './WebcardCover';
import type { User, WebCard } from '@azzapp/data';

type UserFormProps = {
  user: User;
  webCards: WebCard[];
};

const UserForm = ({ user, webCards }: UserFormProps) => {
  const [loading, startTransition] = useTransition();
  const onToggleRole = (role: string) => {
    startTransition(async () => {
      await toggleRole(user.id, role).catch(e => {
        Sentry.captureException(e);
      });
    });
  };

  return (
    <Box display="flex" flexDirection="column">
      <Typography variant="h4" component="h1" sx={{ mb: 5 }}>
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
    </Box>
  );
};

export default UserForm;
