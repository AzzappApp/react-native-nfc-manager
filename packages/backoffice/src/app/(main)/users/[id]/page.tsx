import { AccountCircle } from '@mui/icons-material';
import { Box, Breadcrumbs, Link } from '@mui/material';
import { notFound } from 'next/navigation';
import {
  getUserById,
  getUserProfilesWithWebCard,
  getTotalMultiUser,
  getUserSubscriptions,
} from '@azzapp/data';
import { Subscriptions } from './Subscriptions';
import UserForm from './UserForm';
import type { UserSubscription } from '@azzapp/data';

export type SubscriptionWithProfilesCount = UserSubscription & {
  profilesCount: number;
};

type UserPageProps = {
  params: {
    id: string;
  };
};

const UserPage = async ({ params: { id } }: UserPageProps) => {
  const user = await getUserById(id);
  if (!user) {
    return notFound();
  }
  const profiles = await getUserProfilesWithWebCard(user.id);

  const subscriptions = await getUserSubscriptions({ userIds: [user.id] });
  const userSubscriptions: SubscriptionWithProfilesCount[] = await Promise.all(
    subscriptions.map(async s => {
      const totalUsed = await getTotalMultiUser(s.userId);
      return { ...s, profilesCount: totalUsed };
    }),
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
      <UserForm user={user} profiles={profiles} />

      <Subscriptions
        user={user}
        userSubscriptions={userSubscriptions.sort(
          ({ startAt: a }, { startAt: b }) => b.getTime() - a.getTime(),
        )}
      />
    </Box>
  );
};

export default UserPage;
