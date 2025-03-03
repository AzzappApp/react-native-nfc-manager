import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  MODULES_DEFAULT_VALUES,
  MODULES_STYLES_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import { isCustomModule } from '#helpers/webcardModuleHelpers';
import type { WebCardBackgroundPreview_webCard$key } from '#relayArtifacts/WebCardBackgroundPreview_webCard.graphql';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { ViewProps } from 'react-native';

type WebCardBackgroundProps = ViewProps & {
  webCard: WebCardBackgroundPreview_webCard$key;
  overrideCardStyle?: CardStyle | null | undefined;
  overrideLastModule?:
    | {
        kind: ModuleKind;
        data: any;
      }
    | null
    | undefined;
};

const WebCardBackgroundPreview = ({
  webCard,
  overrideCardStyle,
  overrideLastModule,
  ...props
}: WebCardBackgroundProps) => {
  const { cardColors, cardStyle, coverBackgroundColor, cardModules } =
    useFragment(
      graphql`
        fragment WebCardBackgroundPreview_webCard on WebCard {
          id
          cardColors {
            dark
            light
            primary
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
          coverBackgroundColor
          cardModules {
            id
            kind
            ... on CardModuleBlockText {
              backgroundStyle {
                backgroundColor
              }
            }
            ... on CardModuleCarousel {
              backgroundStyle {
                backgroundColor
              }
            }
            ... on CardModuleHorizontalPhoto {
              backgroundStyle {
                backgroundColor
              }
            }
            ... on CardModuleLineDivider {
              colorBottom
            }
            ... on CardModulePhotoWithTextAndTitle {
              backgroundStyle {
                backgroundColor
              }
            }
            ... on CardModuleSimpleButton {
              backgroundStyle {
                backgroundColor
              }
            }
            ... on CardModuleSimpleText {
              backgroundStyle {
                backgroundColor
              }
            }
            ... on CardModuleSimpleTitle {
              backgroundStyle {
                backgroundColor
              }
            }
            ... on CardModuleSocialLinks {
              backgroundStyle {
                backgroundColor
              }
            }
            ... on CardModuleMedia {
              cardModuleColor {
                background
              }
            }
            ... on CardModuleMediaText {
              cardModuleColor {
                background
              }
            }
            ... on CardModuleMediaTextLink {
              cardModuleColor {
                background
              }
            }
            ... on CardModuleTitleText {
              cardModuleColor {
                background
              }
            }
          }
        }
      `,
      webCard,
    );
  const firstColor =
    swapColor(coverBackgroundColor, cardColors) ?? cardColors?.light ?? '#fff';
  const lastModule = cardModules ? cardModules.at(-1) : undefined;

  let lastColor = firstColor;
  const kind = overrideLastModule?.kind ?? lastModule?.kind;
  const lastModuleData = overrideLastModule?.data ?? lastModule ?? {};

  if (__DEV__ && cardModules.length && !lastModuleData.cardModuleColor) {
    console.warn(
      'Error no cardModuleColor defined for your module, You have an issue here',
    );
  }
  if (lastModule && kind && kind in MODULES_STYLES_VALUES) {
    const stylesMap =
      MODULES_STYLES_VALUES[kind as keyof typeof MODULES_STYLES_VALUES];
    const defaultValues =
      MODULES_DEFAULT_VALUES[kind as keyof typeof MODULES_STYLES_VALUES];
    if (isCustomModule(kind)) {
      const lasModuleData = getModuleDataValues({
        data: lastModuleData,
        defaultValues,
        cardStyle: overrideCardStyle ?? cardStyle,
        styleValuesMap: stylesMap,
      });
      lastColor = swapColor(
        lasModuleData.backgroundStyle?.backgroundColor ??
          lasModuleData.colorBottom,
        cardColors,
      );
    } else {
      lastColor = swapColor(
        lastModuleData.cardModuleColor?.background,
        cardColors,
      );
    }
  }

  return (
    <View {...props}>
      <View
        testID="WebCardBackgroundPreviewFirstColor"
        style={{ backgroundColor: firstColor, flex: 1 }}
      />
      <View
        testID="WebCardBackgroundPreviewLastColor"
        style={{ backgroundColor: lastColor, flex: 1 }}
      />
    </View>
  );
};

export default WebCardBackgroundPreview;
