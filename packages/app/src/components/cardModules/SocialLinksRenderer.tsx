import { useEffect } from 'react';
import {
  LayoutAnimation,
  Linking,
  Platform,
  ScrollView,
  UIManager,
  View,
} from 'react-native';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  SOCIAL_LINKS_DEFAULT_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import { SOCIAL_LINKS } from '@azzapp/shared/socialLinkHelpers';
import { SocialIcon } from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import CardModuleBackground from './CardModuleBackground';

import type {
  SocialLinksRenderer_module$data,
  SocialLinksRenderer_module$key,
} from '#relayArtifacts/SocialLinksRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

/**
 * Render a SocialLinks module
 */
const SocialLinksRendererFragment = graphql`
  fragment SocialLinksRenderer_module on CardModuleSocialLinks @inline {
    links {
      socialId
      link
      position
    }
    iconColor
    iconSize
    arrangement
    borderWidth
    columnGap
    marginTop
    marginBottom
    marginHorizontal
    background {
      id
      uri
      resizeMode
    }
    backgroundStyle {
      backgroundColor
      patternColor
    }
  }
`;

export const readSocialLinksData = (module: SocialLinksRenderer_module$key) =>
  readInlineData(SocialLinksRendererFragment, module);

export type SocialLinksRendererData = NullableFields<
  Omit<SocialLinksRenderer_module$data, ' $fragmentType'>
>;

export type SocialLinksRendererProps = ViewProps & {
  /**
   * The data for the SocialLinks module
   */
  data: SocialLinksRendererData;
  /**
   * the color palette
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * the card style
   */
  cardStyle: CardStyle | null | undefined;
  /**
   * The wrapped content style
   */
  multilineStyle?: StyleProp<ViewStyle>;

  /**
   * Whether the social links are disabled
   */
  disabled?: boolean;
};
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
/**
 *  implementation of the SocialLinks module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
const SocialLinksRenderer = ({
  data,
  colorPalette,
  cardStyle,
  style,
  multilineStyle,
  disabled,
  ...props
}: SocialLinksRendererProps) => {
  const {
    links,
    iconSize,
    iconColor,
    arrangement,
    borderWidth,
    columnGap,
    marginTop,
    marginBottom,
    marginHorizontal,
    background,
    backgroundStyle,
  } = getModuleDataValues({
    data,
    cardStyle,
    defaultValues: SOCIAL_LINKS_DEFAULT_VALUES,
    styleValuesMap: null,
  });

  const linksOrdered = [...(links ?? [])].sort(
    (a, b) => a.position - b.position,
  );

  const onPressSocialLink = async (link: {
    readonly link: string;
    readonly position: number;
    readonly socialId: string;
  }) => {
    const url = SOCIAL_LINKS.find(l => l.id === link.socialId)?.mask;

    const linkIncludeMethod =
      link.link?.startsWith('http://') || link.link?.startsWith('https://');
    let method = linkIncludeMethod ? '' : 'http://';

    if (link.socialId === 'phone') method = `tel:`;
    if (link.socialId === 'sms') method = 'sms:';
    if (link.socialId === 'mail') method = 'mailto:';

    await Linking.openURL(`${method}${url}${link.link}`);
  };

  useEffect(() => {
    LayoutAnimation.configureNext({
      duration: 100, // duration in milliseconds
      update: {
        type: LayoutAnimation.Types.linear,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  }, [arrangement]);

  return (
    <CardModuleBackground
      {...props}
      backgroundUri={background?.uri}
      backgroundColor={swapColor(
        backgroundStyle?.backgroundColor,
        colorPalette,
      )}
      patternColor={swapColor(backgroundStyle?.patternColor, colorPalette)}
      resizeMode={background?.resizeMode}
      style={style}
    >
      {arrangement === 'inline' ? (
        <ScrollView
          horizontal
          style={{
            marginTop,
            marginBottom,
            paddingLeft: marginHorizontal,
            paddingRight: marginHorizontal,
          }}
          contentContainerStyle={{
            columnGap,
            flexGrow: 1,
            justifyContent: 'center',
          }}
          showsHorizontalScrollIndicator={false}
        >
          {linksOrdered.map((link, index) => (
            <PressableOpacity
              key={index}
              style={{
                width: iconSize,
                height: iconSize,
                borderWidth,
                borderRadius: iconSize / 2,
                borderColor: swapColor(iconColor, colorPalette),
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => onPressSocialLink(link)}
            >
              <SocialIcon
                icon={link.socialId as SocialLinkId}
                style={{
                  width: iconSize - 22,
                  height: iconSize - 22,
                  tintColor: swapColor(iconColor, colorPalette),
                }}
              />
            </PressableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View
          style={[
            {
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop,
              marginBottom,
              paddingLeft: marginHorizontal,
              paddingRight: marginHorizontal,
              columnGap,
              rowGap: columnGap,
            },
            multilineStyle,
          ]}
        >
          {linksOrdered.map((link, index) => (
            <PressableOpacity
              key={index}
              style={{
                width: iconSize,
                height: iconSize,
                borderWidth,
                borderRadius: iconSize / 2,
                borderColor: swapColor(iconColor, colorPalette),
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => onPressSocialLink(link)}
              disabled={disabled}
              disabledOpacity={1}
            >
              <SocialIcon
                icon={link.socialId as SocialLinkId}
                style={{
                  width: iconSize - 22,
                  height: iconSize - 22,
                  tintColor: swapColor(iconColor, colorPalette),
                }}
              />
            </PressableOpacity>
          ))}
        </View>
      )}
    </CardModuleBackground>
  );
};

export default SocialLinksRenderer;
