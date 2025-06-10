import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import useScreenInsets from '#hooks/useScreenInsets';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import CoverRenderer from './CoverRenderer';
import { useRouter } from './NativeRouter';
import type { AccountHeader_webCard$key } from '#relayArtifacts/AccountHeader_webCard.graphql';
import type { IconButtonProps } from '#ui/IconButton';

const COVER_WIDTH = 29;

const AccountHeader = ({
  webCard: webCardKey,
  title,
  leftIcon = 'arrow_left',
}: {
  webCard?: AccountHeader_webCard$key | null;
  title?: React.ReactNode;
  leftIcon?: IconButtonProps['icon'] | null;
}) => {
  const webCard = useFragment(
    graphql`
      fragment AccountHeader_webCard on WebCard {
        ...CoverRenderer_webCard
      }
    `,
    webCardKey,
  );

  const router = useRouter();

  const insets = useScreenInsets();

  const intl = useIntl();

  return (
    <Header
      leftElement={
        leftIcon === null ? undefined : (
          <IconButton
            icon={leftIcon}
            onPress={router.back}
            iconSize={28}
            variant="icon"
          />
        )
      }
      middleElement={title}
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
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          height: HEADER_HEIGHT + insets.top + HEADER_PADDING_BOTTOM,
        },
      ]}
    />
  );
};

export const HEADER_PADDING_BOTTOM = 15;

const styles = StyleSheet.create({
  header: {
    paddingBottom: HEADER_PADDING_BOTTOM,
    zIndex: 1,
  },
});

export default AccountHeader;
