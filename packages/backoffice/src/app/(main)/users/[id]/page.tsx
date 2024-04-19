import { notFound } from 'next/navigation';
import {
  getUserById,
  getProfilesOfUser,
  getSubscriptionsOfUser,
} from '@azzapp/data';
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
    <UserForm
      user={user}
      webCards={profiles.map(({ WebCard }) => WebCard)}
      userSubscriptions={subscriptions}
    />
  );
};

export default UserPage;
