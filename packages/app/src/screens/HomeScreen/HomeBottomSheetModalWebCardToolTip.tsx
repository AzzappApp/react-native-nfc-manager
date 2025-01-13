import { Image } from 'expo-image';
import { memo, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { View, Pressable } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import BottomSheetPopup from '#components/popup/BottomSheetPopup';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import Text from '#ui/Text';
import { useHomeBottomSheetModalToolTipContext } from './HomeBottomSheetModalToolTip';
import type { HomeBottomSheetModalWebCardToolTip_profile$key } from '#relayArtifacts/HomeBottomSheetModalWebCardToolTip_profile.graphql';

type WebCardTooltipProp = {
  coverWidth: number;
  isLeft: boolean;
  header: React.ReactNode;
  description: React.ReactNode;
};

// from spec
const arrowSize = {
  height: 13,
  width: 28,
};

const tooltipWidth = 210;

const WebCardToolTip = ({
  coverWidth,
  isLeft,
  header,
  description,
}: WebCardTooltipProp) => {
  const { top } = useScreenInsets();
  const { width: screenWidth } = useScreenDimensions();
  const styles = useStyleSheet(stylesheet);

  // compute
  const offsetFromCenter = coverWidth / 2 - 24;
  const tooltipStyle = {
    width: tooltipWidth,
    left:
      screenWidth / 2 -
      tooltipWidth / 2 +
      (isLeft ? -offsetFromCenter : offsetFromCenter),
    top: coverWidth / COVER_RATIO + top + 94 + arrowSize.height,
    borderRadius: 10,
    backgroundColor: colors.white,
    padding: 10,
  };

  const arrowStyle = {
    top: -9 - arrowSize.height,
    left: -10 + tooltipWidth / 2 - arrowSize.width / 2,
    height: arrowSize.height,
    width: arrowSize.width,
  };

  return (
    <>
      <View style={tooltipStyle}>
        <Image
          source={require('#assets/tooltip_arrow.svg')}
          style={arrowStyle}
        />
        <View style={styles.contentContainer}>
          <Text variant="large" style={styles.contentHeader} appearance="light">
            {header}
          </Text>
          <Text
            variant="medium"
            style={styles.contentDescription}
            appearance="light"
          >
            {description}
          </Text>
        </View>
      </View>
    </>
  );
};

type HomeWebCardToolTipLeftRightProps = Pick<WebCardTooltipProp, 'coverWidth'>;

export const HomeWebCardToolTipMultiUser = ({
  coverWidth,
}: HomeWebCardToolTipLeftRightProps) => {
  return (
    <WebCardToolTip
      coverWidth={coverWidth}
      isLeft={false}
      header={
        <FormattedMessage
          defaultMessage="Multi-user"
          description="Tooltip / Multi-user tooltip header"
        />
      }
      description={
        <FormattedMessage
          defaultMessage="Invite team members to join your WebCard and offer a ContactCard to everyone."
          description="Tooltip / Multi-user tooltip description"
        />
      }
    />
  );
};

export const HomeWebCardToolTipEdit = ({
  coverWidth,
}: HomeWebCardToolTipLeftRightProps) => {
  return (
    <WebCardToolTip
      coverWidth={coverWidth}
      isLeft
      header={
        <FormattedMessage
          defaultMessage="Customize your WebCard"
          description="Tooltip / Edit tooltip header"
        />
      }
      description={
        <FormattedMessage
          defaultMessage="Your WebCard is an online digital profile that enhances your ContactCard by providing a richer content."
          description="Tooltip / Edit tooltip description"
        />
      }
    />
  );
};

type HomeBottomSheetModalWebCardToolTipProps = {
  user?: HomeBottomSheetModalWebCardToolTip_profile$key | null;
};

const HomeBottomSheetModalWebCardToolTipComponent = ({
  user: userKey,
}: HomeBottomSheetModalWebCardToolTipProps) => {
  const { height: screenHeight, width: screenWidth } = useScreenDimensions();
  const styles = useStyleSheet(stylesheet);

  const profile = useFragment(
    graphql`
      fragment HomeBottomSheetModalWebCardToolTip_profile on Profile {
        id
        webCard {
          id
          isMultiUser
          webCardKind
          userName
        }
      }
    `,
    userKey,
  );

  const {
    tooltipId,
    setTooltipId,
    itemWidth: coverWidth,
  } = useHomeBottomSheetModalToolTipContext();

  const isMultiUser =
    !!tooltipId &&
    (profile?.webCard?.isMultiUser ||
      profile?.webCard?.webCardKind === 'business');

  const onCloseToolTip = useCallback(() => {
    setTooltipId(!isMultiUser || tooltipId === 2 ? 0 : 2);
  }, [isMultiUser, setTooltipId, tooltipId]);

  return (
    <BottomSheetPopup
      animationDuration={500}
      visible={!!tooltipId}
      backgroundOpacity={0.1}
      fullScreen
    >
      <Pressable
        style={{
          width: screenWidth,
          height: screenHeight,
        }}
        onPress={onCloseToolTip}
      >
        <View style={styles.container}>
          {tooltipId === 1 ? (
            <HomeWebCardToolTipEdit coverWidth={coverWidth} />
          ) : tooltipId === 2 ? (
            <HomeWebCardToolTipMultiUser coverWidth={coverWidth} />
          ) : undefined}
        </View>
      </Pressable>
    </BottomSheetPopup>
  );
};

export const HomeBottomSheetModalWebCardToolTip = memo(
  HomeBottomSheetModalWebCardToolTipComponent,
);

export const stylesheet = createStyleSheet(() => ({
  container: { width: '100%', height: '100%' },
  contentContainer: { paddingBottom: 10 },
  contentHeader: {
    paddingBottom: 10,
    textAlign: 'center',
    textColor: colors.black,
  },
  contentDescription: { textAlign: 'center' },
}));
