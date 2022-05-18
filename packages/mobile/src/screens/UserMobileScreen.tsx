import UserScreen, {
  userScreenByIdQuery,
  userScreenByNameQuery,
} from '@azzapp/app/lib/UserScreen';
import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { Navigation } from 'react-native-navigation';
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

const UserMobileScreen = ({ data, componentId }: UserMobileScreenProps) => {
  const [canPlay, setCanPlay] = useState(false);
  useEffect(() => {
    const componentWillAppearListener =
      Navigation.events().registerComponentWillAppearListener(event => {
        if (event.componentId === componentId) {
          setCanPlay(true);
        }
      });
    return () => {
      componentWillAppearListener.remove();
    };
  }, [componentId]);

  return <UserScreen user={data.user} viewer={data.viewer} canPlay={canPlay} />;
};

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
        content: {
          alpha: {
            from: 0,
            to: 1,
            duration: 220,
            interpolation: { type: 'overshoot' },
          },
        },
        sharedElementTransitions: [
          {
            fromId: `cover-${userName}-image-0`,
            toId: `cover-${userName}-image-0`,
            duration: 220,
            interpolation: { type: 'decelerate' },
          },
          {
            fromId: `cover-${userName}-text`,
            toId: `cover-${userName}-text`,
            duration: 220,
            interpolation: { type: 'decelerate' },
          },
          {
            fromId: `cover-${userName}-overlay`,
            toId: `cover-${userName}-overlay`,
            duration: 220,
            interpolation: { type: 'decelerate' },
          },
          {
            fromId: `cover-${userName}-qrCode`,
            toId: `cover-${userName}-qrCode`,
            duration: 220,
            interpolation: { type: 'decelerate' },
          },
        ],
      },
      pop: {
        content: {
          translationY: {
            from: 0,
            to: Dimensions.get('window').height,
            duration: 150,
            interpolation: { type: 'accelerate' },
          },
        },
      },
    },
  };
};
