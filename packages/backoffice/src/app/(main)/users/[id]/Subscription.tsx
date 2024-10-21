'use client';

import {
  Backdrop,
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { useDebounce } from 'use-debounce';
import { updateFreeSeatsAction } from './actions';
import { toggleSubscriptionStatusAction } from './subscriptionActions';
import type { SubscriptionWithProfilesCount } from './page';

export const Subscription = ({
  userSubscription,
}: {
  userSubscription: SubscriptionWithProfilesCount;
}) => {
  const [freeSeats, setFreeSeats] = useState(userSubscription.freeSeats || 0);
  const [debouncedSeats] = useDebounce(freeSeats, 300);
  const [pending, startTransition] = useTransition();

  const toggleSubscriptionStatus = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const status = event.target.checked;
    startTransition(async () => {
      try {
        await toggleSubscriptionStatusAction(
          userSubscription.userId,
          userSubscription.id,
          userSubscription.subscriptionPlan,
          status ? 'active' : 'canceled',
        );
      } catch (e) {
        console.error(e);
      }
    });
  };

  const updateFreeSeats = useCallback(async () => {
    try {
      await updateFreeSeatsAction(userSubscription.id, debouncedSeats);
    } catch (e) {
      console.error(e);
    }
  }, [debouncedSeats, userSubscription.id]);

  const onUpdateFreeSeats = (e: any) => {
    setFreeSeats(e.target.value as number);
  };

  useEffect(() => {
    if (debouncedSeats !== userSubscription.freeSeats) {
      updateFreeSeats();
    }
  }, [debouncedSeats, updateFreeSeats, userSubscription.freeSeats]);

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <TextField
        sx={{ width: 250 }}
        value={userSubscription.issuer}
        label="Platform"
        inputProps={{
          readOnly: true,
        }}
        disabled
      />

      <Typography variant="subtitle1" color="GrayText" sx={{ mt: 5, mb: 5 }}>
        Subscription started at {userSubscription.startAt.toDateString()}
      </Typography>

      <Box display="flex" gap={2}>
        <TextField
          sx={{ width: 250 }}
          value={userSubscription.webCardId}
          label="Webcard"
          inputProps={{
            readOnly: true,
          }}
          disabled
        />
        <TextField
          sx={{ width: 250 }}
          value={`${(((userSubscription.amount || 0) + (userSubscription.taxes || 0)) / 100).toFixed(2)}€ (${userSubscription.totalSeats} users)`}
          label="Billed for (+taxes)"
          inputProps={{
            readOnly: true,
          }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={userSubscription.status === 'active'}
              color="success"
              onChange={toggleSubscriptionStatus}
            />
          }
          label={`${userSubscription.status.replace('_', ' ')}`}
          style={{
            textTransform: 'capitalize',
          }}
        />
      </Box>
      <Box display="flex" gap={2}>
        <FormControl sx={{ width: 250 }}>
          <InputLabel id="type">Type</InputLabel>
          <Select
            labelId="type"
            id="type"
            value={userSubscription.subscriptionPlan}
            label="Type"
            onChange={() => {}}
          >
            <MenuItem value={'web.monthly'}>Monthly</MenuItem>
            <MenuItem value={'web.yearly'}>Yearly</MenuItem>
            <MenuItem value={'web.lifetime'}>LifeTime</MenuItem>
          </Select>
        </FormControl>
        <TextField
          sx={{ width: 250 }}
          value={freeSeats || 0}
          label="Additional seats"
          type="number"
          disabled={userSubscription.subscriptionPlan === 'web.monthly'}
          onChange={onUpdateFreeSeats}
        />
        {userSubscription.canceledAt && (
          <TextField
            sx={{ width: 250 }}
            value={userSubscription.canceledAt.toDateString()}
            label="Canceled at"
            inputProps={{
              readOnly: true,
              style: {
                color: 'red',
              },
            }}
          />
        )}
        <TextField
          sx={{ width: 250 }}
          value={userSubscription.endAt.toDateString()}
          label="End at"
          inputProps={{
            readOnly: true,
            style: {
              color: new Date() > userSubscription.endAt ? 'red' : 'black',
            },
          }}
        />
      </Box>
      <Backdrop
        sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}
        open={pending}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default Subscription;
