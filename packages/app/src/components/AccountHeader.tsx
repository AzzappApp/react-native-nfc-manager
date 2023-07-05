import { useIntl } from 'react-intl';
import { graphql, useFragment } from 'react-relay';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import CoverRenderer from './CoverRenderer';
import { useRouter } from './NativeRouter';
import type { AccountHeader_profile$key } from '@azzapp/relay/artifacts/AccountHeader_profile.graphql';

const COVER_WIDTH = 29;

const AccountHeader = ({
  profile: profileKey,
  userName,
  title,
}: {
  profile: AccountHeader_profile$key | null;
  userName?: string;
  title: string;
}) => {
  const profile = useFragment(
    graphql`
      fragment AccountHeader_profile on Profile {
        card {
          backgroundColor
          cover {
            ...CoverRenderer_cover
          }
        }
      }
    `,
    profileKey,
  );

  const router = useRouter();

  const intl = useIntl();

  return (
    <Header
      leftElement={
        <IconButton
          icon="arrow_left"
          onPress={router.back}
          iconSize={28}
          variant="icon"
        />
      }
      middleElement={<Text variant="large">{title}</Text>}
      rightElement={
        profile && (
          <PressableNative
            onPress={router.back}
            accessibilityRole="link"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Go back to account screen',
              description: 'Shortcut to go back to account screen',
            })}
          >
            <CoverRenderer
              width={COVER_WIDTH}
              userName={userName ?? ''}
              cover={profile.card?.cover}
              style={
                profile.card?.backgroundColor != null && {
                  backgroundColor: profile.card?.backgroundColor,
                }
              }
            />
          </PressableNative>
        )
      }
    />
  );
};

export default AccountHeader;
