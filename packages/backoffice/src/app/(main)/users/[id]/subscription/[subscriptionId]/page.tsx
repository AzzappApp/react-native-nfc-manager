import { AccountCircle } from '@mui/icons-material';
import {
  Stack,
  Paper,
  Typography,
  Breadcrumbs,
  Link,
  Box,
} from '@mui/material';

import { notFound } from 'next/navigation';
import {
  getPaymentsBySubscriptionId,
  getSubscriptionById,
  getUserById,
} from '@azzapp/data';
import { PaymentList } from './PaymentList';

const SubscriptionPage = async ({
  params: { id: userId, subscriptionId },
}: {
  params: {
    id: string;
    subscriptionId: string;
  };
}) => {
  const user = await getUserById(userId);
  if (!user) {
    return notFound();
  }

  const subscription = await getSubscriptionById(subscriptionId);

  if (!subscription) {
    return notFound();
  }

  const payments = await getPaymentsBySubscriptionId(subscriptionId);

  return (
    <Stack spacing={4} p={4} maxHeight="100%">
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
        /
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href={`/users/${userId}`}
        >
          {user.phoneNumber ?? user.email}
        </Link>
      </Breadcrumbs>
      <Box display="flex" gap={2}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6">User Info</Typography>
          <Typography>
            <Typography component="span" fontWeight="bold">
              Email:
            </Typography>
            &nbsp;
            {user.email}
          </Typography>
          <Typography>
            <Typography component="span" fontWeight="bold">
              Phone:
            </Typography>
            &nbsp;
            {user.phoneNumber}
          </Typography>
          <Typography>
            <Typography component="span" fontWeight="bold">
              Free Scans:
            </Typography>
            &nbsp;
            {user.nbFreeScans}
          </Typography>
          {user.note && (
            <Typography>
              <Typography component="span" fontWeight="bold">
                Note:
              </Typography>
              &nbsp;
              {user.note}
            </Typography>
          )}
        </Paper>

        <Paper elevation={3} sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6">Subscription Info</Typography>
          <Typography>
            <Typography component="span" fontWeight="bold">
              Plan:
            </Typography>
            &nbsp;
            {subscription.subscriptionPlan}
          </Typography>
          <Typography>
            <Typography component="span" fontWeight="bold">
              Status:
            </Typography>
            &nbsp;
            {subscription.status}
          </Typography>
          <Typography>
            <Typography component="span" fontWeight="bold">
              Start At:
            </Typography>
            &nbsp;
            {new Date(subscription.startAt).toLocaleDateString()}
          </Typography>
          <Typography>
            <Typography component="span" fontWeight="bold">
              End At:
            </Typography>
            &nbsp;
            {new Date(subscription.endAt).toLocaleDateString()}
          </Typography>
          {subscription.canceledAt && (
            <Typography>
              <Typography component="span" fontWeight="bold">
                Canceled At:
              </Typography>
              &nbsp;
              {new Date(subscription.canceledAt).toLocaleDateString()}
            </Typography>
          )}
        </Paper>
      </Box>

      <PaymentList payments={payments} subscription={subscription} />
    </Stack>
  );
};

export default SubscriptionPage;
