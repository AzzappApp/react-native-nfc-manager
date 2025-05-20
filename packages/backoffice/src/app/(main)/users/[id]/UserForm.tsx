'use client';

import {
  Box,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Card,
  Switch,
  CardHeader,
  CardContent,
  FormGroup,
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
    <Box display="flex" flexDirection="column" sx={{ gap: 5 }}>
      <Box
        style={{
          display: 'flex',
          gap: 20,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" component="h1">
          <b>User id:</b> {user.id}
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
      </Box>

      <Card>
        <CardHeader
          title={`Webcards: ${profiles.filter(({ profile: { invited } }) => !invited).length} / ${profiles.filter(({ profile: { invited } }) => invited).length} (invited)`}
        />
        <CardContent
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            padding: 2,
            maxHeight: 500,
            overflow: 'auto',
            gap: 2,
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
        </CardContent>
      </Card>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          width: '100%',
        }}
      >
        <TextField
          sx={{ flex: 1 }}
          value={user.email}
          label="Email"
          slotProps={{
            htmlInput: {
              readOnly: true,
            },
          }}
          disabled={!user.email}
        />
        <TextField
          sx={{ flex: 1 }}
          value={user.phoneNumber || ''}
          label="Phone Number"
          slotProps={{
            htmlInput: {
              readOnly: true,
            },
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

      <Card>
        <CardHeader title="Roles management" />
        <CardContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select the roles for this user.
          </Typography>
          <FormGroup>
            {Object.values(ROLES).map(role => (
              <FormControlLabel
                key={role}
                control={
                  <Checkbox
                    name={role}
                    checked={user.roles?.includes(role) ?? false}
                    onChange={() => onToggleRole(role)}
                  />
                }
                label={role}
                disabled={loading}
              />
            ))}
          </FormGroup>
        </CardContent>
      </Card>

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
