import { View } from 'react-native';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import Skeleton from '#components/Skeleton';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Container from '#ui/Container';
import { TOP_PANEL_PADDING } from './coverEditionConstants';
import CoverEditionBottomMenu from './CoverEditionScreenBottomMenut';
import CoverEditionScreenHeader from './CoverEditionScreenHeader';
import { CameraButton, CropButton } from './CoverEditionScreensButtons';
import CoverModelsEditionPanelFallback from './CoverModelsEditionPanelFallback';
import useCoverEditionLayout from './useCoverEditionLayout';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type CoverEditionScreenFallbackProps = {
  isCreation?: boolean;
  style?: ViewProps['style'];
};

const CoverEditionScreenFallback = ({
  isCreation = false,
  style,
}: CoverEditionScreenFallbackProps) => {
  const {
    windowWidth,
    insetTop,
    topPanelHeight,
    coverHeight,
    topPanelButtonsTop,
    insetBottom,
  } = useCoverEditionLayout();

  const coverBorderRadius = COVER_CARD_RADIUS * coverHeight * COVER_RATIO;

  const styles = useStyleSheet(stylesheet);
  return (
    <Container style={[{ flex: 1, paddingTop: insetTop }, style]}>
      <CoverEditionScreenHeader
        isCreation={isCreation ?? true}
        canSave={false}
        cropEditionMode={false}
      />
      <View
        style={{
          height: topPanelHeight,
          paddingTop: TOP_PANEL_PADDING,
          alignItems: 'center',
        }}
      >
        <Skeleton
          style={[
            {
              aspectRatio: COVER_RATIO,
              height: coverHeight,
              borderRadius: coverBorderRadius,
            },
            styles.coverShadow,
          ]}
        />
        {!isCreation && (
          <CropButton
            style={{
              position: 'absolute',
              top: topPanelButtonsTop,
              end: 22.5,
            }}
          />
        )}

        <CameraButton
          style={{
            position: 'absolute',
            top: topPanelButtonsTop,
            start: 22.5,
          }}
        />
      </View>
      <CoverModelsEditionPanelFallback />
      <CoverEditionBottomMenu
        currentTab="models"
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          bottom: insetBottom,
          width: windowWidth - 20,
        }}
      />
    </Container>
  );
};

export default CoverEditionScreenFallback;

const stylesheet = createStyleSheet(appearance => ({
  coverShadow: {
    shadowColor: appearance === 'light' ? colors.black : colors.white,
    shadowOpacity: 0.11,
    shadowOffset: { width: 0, height: 4.69 },
    shadowRadius: 18.75,
  },
}));
