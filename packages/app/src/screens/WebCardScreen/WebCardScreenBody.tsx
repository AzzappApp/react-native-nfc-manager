import { memo, useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import CardModuleRenderer from '#components/cardModules/CardModuleRenderer';
import { useModulesData } from '#components/cardModules/ModuleData';
import { useSuspendUntilAppear } from '#components/NativeRouter';
import useScreenDimensions from '#hooks/useScreenDimensions';
import WebCardBlockContainer from './WebCardBlockContainer';
import type {
  CardModuleRendererProps,
  ModuleRenderInfo,
} from '#components/cardModules/CardModuleRenderer';
import type { WebCardScreenBody_webCard$key } from '#relayArtifacts/WebCardScreenBody_webCard.graphql';
import type { LayoutChangeEvent, Animated as RNAnimated } from 'react-native';

export type WebCardScreenBodyProps = {
  /**
   * The card to display
   */
  webCard: WebCardScreenBody_webCard$key;
  /**
   * An Animated value representing the scroll position of the screen
   */
  scrollPosition: RNAnimated.Value;
  /**
   * Whether the card is being edited
   */
  editing: boolean;
};

/**
 * The body of the webCard screen
 * It display the modules of the card
 */
const WebCardScreenBody = ({
  webCard,
  scrollPosition,
  editing,
}: WebCardScreenBodyProps): any => {
  // #region Relay
  const { cardModules, cardColors, cardStyle, coverBackgroundColor } =
    useFragment(
      graphql`
        fragment WebCardScreenBody_webCard on WebCard {
          coverBackgroundColor
          cardModules {
            id
            visible
            ...ModuleData_cardModules
          }
          cardColors {
            primary
            light
            dark
          }
          cardStyle {
            borderColor
            borderRadius
            buttonRadius
            borderWidth
            buttonColor
            fontFamily
            fontSize
            gap
            titleFontFamily
            titleFontSize
          }
        }
      `,
      webCard,
    );

  useSuspendUntilAppear(Platform.OS === 'android');

  const modulesData = useModulesData(cardModules);

  return modulesData.map(module => {
    return (
      <ModuleContainer
        id={module.id}
        key={module.id}
        module={module}
        colorPalette={cardColors}
        cardStyle={cardStyle}
        coverBackgroundColor={coverBackgroundColor}
        scrollPosition={scrollPosition}
        displayMode="mobile"
        visible={module.visible}
        canPlay={!editing}
      />
    );
  });
};

const ModuleContainer = <T extends ModuleRenderInfo>({
  id,
  visible,
  canPlay,
  ...props
}: Omit<CardModuleRendererProps<T>, 'dimension' | 'modulePosition'> & {
  id: string;
  visible: boolean;
  canPlay: boolean;
}) => {
  const { width: windowWith, height } = useScreenDimensions();
  const [modulePosition, setModulePosition] = useState(
    windowWith / COVER_RATIO,
  );
  const onLayout = useCallback(
    (layoutChangeEvent: LayoutChangeEvent) => {
      setModulePosition(layoutChangeEvent.nativeEvent.layout.y);
    },
    [setModulePosition],
  );

  return (
    <WebCardBlockContainer
      id={id}
      onLayout={onLayout}
      style={
        !visible && {
          zIndex: -1,
          height: 0,
          opacity: 0,
        }
      }
    >
      <CardModuleRenderer
        {...props}
        modulePosition={modulePosition}
        canPlay={canPlay}
        dimension={{ width: windowWith, height }}
      />
    </WebCardBlockContainer>
  );
};

export default memo(WebCardScreenBody);
