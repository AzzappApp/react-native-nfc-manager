'use client';

import {
  Box,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useTransition } from 'react';
import * as ROLES from '#roles';
import { toggleRole } from './userActions';
import type { User } from '@azzapp/data';

type UserFormProps = {
  user: User;
};

const UserForm = ({ user }: UserFormProps) => {
  const [loading, startTransition] = useTransition();
  const onToggleRole = (role: string) => {
    startTransition(async () => {
      await toggleRole(user.id, role).catch(console.error);
    });
  };
  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 10 }}>
        User {user.id}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          padding: 2,
        }}
        maxWidth={500}
      >
        <TextField
          value={user.email}
          label="Email"
          inputProps={{
            readOnly: true,
          }}
          disabled={!user.email}
        />
        <TextField
          value={user.phoneNumber}
          label="Phone Number"
          inputProps={{
            readOnly: true,
          }}
          disabled={!user.phoneNumber}
        />
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
    </>
  );
};

export default UserForm;
