import { useIntl } from 'react-intl';
import { graphql, useFragment } from 'react-relay';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import CoverRenderer from './CoverRenderer';
import { useRouter } from './NativeRouter';
import type { AccountHeader_webCard$key } from '#relayArtifacts/AccountHeader_webCard.graphql';

const COVER_WIDTH = 29;

const AccountHeader = ({
  webCard: webCardKey,
  title,
}: {
  webCard: AccountHeader_webCard$key | null;
  title: React.ReactNode;
}) => {
  const webCard = useFragment(
    graphql`
      fragment AccountHeader_webCard on WebCard {
        cardColors {
          primary
        }
        ...CoverRenderer_webCard
      }
    `,
    webCardKey,
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
        webCard && (
          <PressableNative
            onPress={router.back}
            accessibilityRole="link"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Go back',
              description: 'Go back button in account header',
            })}
          >
            <CoverRenderer width={COVER_WIDTH} webCard={webCard} />
          </PressableNative>
        )
      }
    />
  );
};

export default AccountHeader;
