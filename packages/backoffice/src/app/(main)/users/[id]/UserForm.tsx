'use client';

import {
  Box,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Card,
  Switch,
} from '@mui/material';
import * as Sentry from '@sentry/nextjs';
import { useEffect, useState, useTransition } from 'react';
import { useDebounce } from 'use-debounce';
import * as ROLES from '#roles';
import ConfirmDialog from '#components/ConfirmDialog';
import {
  toggleRole,
  removeWebCard,
  toggleUserActive,
  updateNote,
  toggleStar,
} from './userActions';
import WebCardCover from './WebcardCover';
import type { User, Profile, WebCard } from '@azzapp/data';
import type { ChangeEvent } from 'react';

type UserFormProps = {
  user: User;
  profiles: Array<{
    profile: Profile;
    webCard: WebCard;
  }>;
};

const UserForm = ({ user, profiles }: UserFormProps) => {
  const [loading, startTransition] = useTransition();
  const [currentNote, setCurrentNote] = useState(user.note ?? '');
  const [debouncedNote] = useDebounce(currentNote, 300);
  const [confirm, setConfirm] = useState(false);

  const onToggleRole = (role: string) => {
    startTransition(async () => {
      await toggleRole(user.id, role).catch(e => {
        Sentry.captureException(e);
      });
    });
  };

  const onToggleUserActive = async () => {
    startTransition(async () => {
      setConfirm(false);
      await toggleUserActive(user.id);
    });
  };

  const onNoteChange = async ({
    target: { value },
  }: ChangeEvent<HTMLInputElement>) => {
    setCurrentNote(value);
  };

  useEffect(() => {
    startTransition(async () => {
      await updateNote(user.id, debouncedNote);
    });
  }, [debouncedNote, user.id]);

  return (
    <Box display="flex" flexDirection="column">
      <Typography variant="h4" component="h1" sx={{ mb: 5 }}>
        User {user.id}
      </Typography>
      <FormControlLabel
        control={
          <Switch
            name="active"
            checked={!user.deleted}
            onChange={() => {
              setConfirm(true);
            }}
          />
        }
        label="Active"
        disabled={loading}
      />

      <Typography variant="h5" sx={{ mb: 5, mt: 5 }}>
        {`Webcards: ${profiles.filter(({ profile: { invited } }) => !invited).length} / ${profiles.filter(({ profile: { invited } }) => invited).length} (invited)`}
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
        {profiles.map(({ webCard, profile: { profileRole } }) => {
          if (!webCard?.userName) {
            return undefined;
          }
          return (
            <WebCardCover
              key={webCard.id}
              webcard={webCard}
              role={profileRole}
              onRemoveWebCard={() => removeWebCard(user.id, webCard.id)}
              onToggleStar={() => {
                toggleStar(user.id, webCard.id);
              }}
            />
          );
        })}
      </Card>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          width: '100%',
          marginTop: 2,
          marginBottom: 2,
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
      <TextField
        id="note"
        label="Note"
        multiline
        rows={4}
        maxRows={8}
        value={user.note}
        onChange={onNoteChange}
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
      <ConfirmDialog
        open={confirm}
        onClose={() => {
          setConfirm(false);
        }}
        onConfirm={onToggleUserActive}
      />
    </Box>
  );
};

export default UserForm;
