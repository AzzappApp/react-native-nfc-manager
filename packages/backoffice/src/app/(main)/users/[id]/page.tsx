import { AccountCircle } from '@mui/icons-material';
import { Box, Breadcrumbs, Link } from '@mui/material';
import { notFound } from 'next/navigation';
import {
  getUserById,
  getProfilesOfUser,
  getSubscriptionsOfUser,
} from '@azzapp/data';
import { Subscriptions } from './Subscriptions';
import UserForm from './UserForm';

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
  const profiles = await getProfilesOfUser(user.id);

  const subscriptions = await getSubscriptionsOfUser(user.id);

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
      <UserForm user={user} webCards={profiles.map(({ WebCard }) => WebCard)} />
      <Subscriptions user={user} userSubscriptions={subscriptions} />
    </Box>
  );
};

export default UserPage;
