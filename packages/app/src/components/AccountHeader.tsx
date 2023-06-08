import { graphql, useFragment } from 'react-relay';
import { useRouter } from '#PlatformEnvironment';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import CoverRenderer from './CoverRenderer';
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
        )
      }
    />
  );
};

export default AccountHeader;
