import { Linking, View } from 'react-native';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_LINK_SIZE_TO_BORDER_RATIO,
  LINKS_ELEMENT_WRAPPER_MULTIPLER,
  convertToBaseCanvasRatio,
} from '@azzapp/shared/coverHelpers';
import {
  generateSocialLink,
  type SocialLinkId,
} from '@azzapp/shared/socialLinkHelpers';
import { shadow } from '#theme';
import { SocialIcon } from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import type {
  CardColors,
  CoverEditorLinksLayerItem,
  CoverEditorSocialLink,
} from './CoverEditor/coverEditorTypes';

type SocialLinkRendererProps = Pick<
  CoverEditorLinksLayerItem,
  'color' | 'shadow' | 'size'
> & {
  viewWidth: number;
  cardColors?: Omit<CardColors, 'otherColors'> | null;
  link: CoverEditorSocialLink;
  disabled?: boolean;
};

export const SocialLinkRenderer = ({
  size,
  color,
  shadow: hasShadow,
  viewWidth,
  cardColors,
  link,
  disabled,
}: SocialLinkRendererProps) => {
  const width =
    convertToBaseCanvasRatio(size, viewWidth) * LINKS_ELEMENT_WRAPPER_MULTIPLER;

  const height =
    convertToBaseCanvasRatio(size, viewWidth) * LINKS_ELEMENT_WRAPPER_MULTIPLER;

  const borderWidth = convertToBaseCanvasRatio(
    size / COVER_LINK_SIZE_TO_BORDER_RATIO,
    viewWidth,
  );

  const borderRadius =
    (convertToBaseCanvasRatio(size, viewWidth) *
      LINKS_ELEMENT_WRAPPER_MULTIPLER) /
    2;

  const borderColor = swapColor(color, cardColors);

  return (
    <PressableNative
      onPress={() => {
        Linking.openURL(
          generateSocialLink(link.socialId as SocialLinkId, link.link),
        );
      }}
      disabled={disabled}
      disabledOpacity={1}
    >
      <View
        style={[
          {
            display: 'flex',
            width,
            height,
            borderStyle: 'solid',
            borderWidth,
            borderRadius,
            borderColor,
            alignItems: 'center',
            justifyContent: 'center',
          },
          hasShadow ? shadow('dark') : undefined,
        ]}
      >
        <SocialIcon
          style={{
            height: convertToBaseCanvasRatio(size, viewWidth),
            width: convertToBaseCanvasRatio(size, viewWidth),
            tintColor: swapColor(color, cardColors),
          }}
          icon={link.socialId as SocialLinkId}
        />
      </View>
    </PressableNative>
  );
};
