import UserScreen, {
  userScreenByIdQuery,
  userScreenByNameQuery,
} from '@azzapp/app/lib/UserScreen';
import type {
  UserScreenByIdQuery,
  UserScreenByUserNameQuery,
} from '@azzapp/app/lib/UserScreen';
import type { Options } from 'react-native-navigation';

type UserMobileScreenProps = {
  data: UserScreenByIdQuery['response'] | UserScreenByUserNameQuery['response'];
  componentId: string;
  params: { userName: string; userId?: string; useSharedAnimation?: boolean };
};

const UserMobileScreen = ({ data }: UserMobileScreenProps) => (
  <UserScreen user={data.user} viewer={data.viewer} />
);

export default UserMobileScreen;

export { userScreenByIdQuery, userScreenByNameQuery };

UserMobileScreen.screenOptions = ({
  params: { userName, useSharedAnimation },
}: UserMobileScreenProps): Options | null => {
  if (useSharedAnimation === false) {
    return null;
  }
  return {
    animations: {
      push: {
        sharedElementTransitions: [
          {
            fromId: `cover-${userName}-image`,
            toId: `cover-${userName}-image`,
            interpolation: { type: 'spring' },
            duration: 300,
          },
          {
            fromId: `cover-${userName}-text`,
            toId: `cover-${userName}-text`,
            interpolation: { type: 'spring' },
            duration: 300,
          },
        ],
      },
      pop: {
        sharedElementTransitions: [
          {
            fromId: `cover-${userName}-image`,
            toId: `cover-${userName}-image`,
            interpolation: { type: 'spring' },
            duration: 300,
          },
          {
            fromId: `cover-${userName}-text`,
            toId: `cover-${userName}-text`,
            interpolation: { type: 'spring' },
            duration: 300,
          },
        ],
      },
    },
  };
};
