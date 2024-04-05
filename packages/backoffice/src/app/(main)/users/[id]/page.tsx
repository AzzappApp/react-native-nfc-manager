import { notFound } from 'next/navigation';
import { getUserById, getProfilesOfUser } from '@azzapp/data';
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

  return (
    <UserForm user={user} webCards={profiles.map(({ WebCard }) => WebCard)} />
  );
};

export default UserPage;
