import { Linking, type View } from 'react-native';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  LINKS_BORDER_WIDTH,
  LINKS_ELEMENT_WRAPPER_MULTIPLER,
} from '@azzapp/shared/coverHelpers';
import {
  generateSocialLink,
  type SocialLinkId,
} from '@azzapp/shared/socialLinkHelpers';
import { shadow } from '#theme';
import { SocialIcon } from '#ui/Icon';
import { convertToBaseCanvasRatio } from '../coverDrawer/coverDrawerUtils';
import type PressableNative from '#ui/PressableNative';
import type {
  CardColors,
  CoverEditorLinksLayerItem,
  CoverEditorSocialLink,
} from '../coverEditorTypes';

type Props = Pick<CoverEditorLinksLayerItem, 'color' | 'shadow' | 'size'> & {
  as: typeof PressableNative | typeof View;
  viewWidth: number;
  cardColors?: Omit<CardColors, 'otherColors'> | null;
  link: CoverEditorSocialLink;
};
export const DynamicLinkRenderer = ({
  as,
  size,
  color,
  shadow: hasShadow,
  viewWidth,
  cardColors,
  link,
}: Props) => {
  const Component = as;

  const width =
    convertToBaseCanvasRatio(size, viewWidth) * LINKS_ELEMENT_WRAPPER_MULTIPLER;

  const height =
    convertToBaseCanvasRatio(size, viewWidth) * LINKS_ELEMENT_WRAPPER_MULTIPLER;

  const borderWidth = convertToBaseCanvasRatio(LINKS_BORDER_WIDTH, viewWidth);

  const borderRadius =
    (convertToBaseCanvasRatio(size, viewWidth) *
      LINKS_ELEMENT_WRAPPER_MULTIPLER) /
    2;

  const borderColor = swapColor(color, cardColors);

  return (
    <Component
      onPress={() => {
        Linking.openURL(
          generateSocialLink(link.socialId as SocialLinkId, link.link),
        );
      }}
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
    </Component>
  );
};
