import { memoize } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { LayoutAnimation, Linking, Platform, UIManager } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  getModuleDataValues,
  getSocialLinksDefaultValues,
} from '@azzapp/shared/cardModuleHelpers';
import { SOCIAL_LINKS } from '@azzapp/shared/socialLinkHelpers';
import { SocialIcon } from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import CardModuleBackground from './CardModuleBackground';

import type {
  SocialLinksRenderer_module$data,
  SocialLinksRenderer_module$key,
} from '#relayArtifacts/SocialLinksRenderer_module.graphql';
import type { PressableOpacityProps } from '#ui/PressableOpacity';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';
import type { ImageStyle, StyleProp, ViewProps, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

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

type AnimatedProps =
  | 'borderWidth'
  | 'columnGap'
  | 'iconSize'
  | 'marginBottom'
  | 'marginHorizontal'
  | 'marginTop';

export type SocialLinksRendererData = NullableFields<
  Omit<SocialLinksRenderer_module$data, ' $fragmentType'>
>;

type SocialLinksRendererAnimatedData = {
  [K in AnimatedProps]: SharedValue<NonNullable<SocialLinksRendererData[K]>>;
};

export type SocialLinksRendererProps = ViewProps & {
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
  /**
   * The cover background color
   */
  coverBackgroundColor?: string | null | undefined;
} & (
    | {
        /**
         * The data for the SocialLinks module
         */
        data: Omit<SocialLinksRendererData, AnimatedProps>;
        /**
         * The animated data for the SocialLinks module
         */
        animatedData: SocialLinksRendererAnimatedData;
      }
    | {
        /**
         * The data for the SocialLinks module
         */
        data: SocialLinksRendererData;
        /**
         * The animated data for the SocialLinks module
         */
        animatedData: null;
      }
  );
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

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
  animatedData,
  disabled,
  coverBackgroundColor,
  ...props
}: SocialLinksRendererProps) => {
  const {
    links,
    iconColor,
    arrangement,
    background,
    backgroundStyle,
    ...rest
  } = getModuleDataValues({
    data,
    cardStyle,
    defaultValues: getSocialLinksDefaultValues(coverBackgroundColor),
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

  const scrollViewStyle = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('marginTop' in rest) {
        return {
          marginTop: rest.marginTop ?? 0,
          marginBottom: rest.marginBottom ?? 0,
        };
      }
      return {};
    }

    return {
      marginTop: animatedData.marginTop.value,
      marginBottom: animatedData.marginBottom.value,
    };
  });

  const scrollViewContentStyle = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('columnGap' in rest) {
        return {
          columnGap: rest.columnGap ?? undefined,
        };
      }
      return {};
    }

    return {
      columnGap: animatedData.columnGap.value ?? undefined,
    };
  });

  const pressableStyle = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('iconSize' in rest) {
        return {
          width: rest.iconSize ?? 0,
          height: rest.iconSize ?? 0,
          borderWidth: rest.borderWidth ?? 0,
          borderRadius: (rest.iconSize ?? 0) / 2,
        };
      }
      return {};
    }

    return {
      width: animatedData.iconSize.value,
      height: animatedData.iconSize.value,
      borderWidth: animatedData.borderWidth.value ?? 0,
      borderRadius: (animatedData.iconSize.value ?? 0) / 2,
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('iconSize' in rest) {
        return {
          width: (rest.iconSize ?? 0) - 22,
          height: (rest.iconSize ?? 0) - 22,
        };
      }
      return {};
    }

    return {
      width: (animatedData.iconSize.value ?? 0) - 22,
      height: (animatedData.iconSize.value ?? 0) - 22,
    };
  });

  const animatedMultiLinestyle = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('marginTop' in rest) {
        return {
          marginTop: rest.marginTop ?? 0,
          marginBottom: rest.marginBottom ?? 0,
          paddingLeft: rest.marginHorizontal ?? 0,
          paddingRight: rest.marginHorizontal ?? 0,
          columnGap: rest.columnGap ?? undefined,
          rowGap: rest.columnGap ?? undefined,
        };
      }
      return {};
    }
    return {
      marginTop: animatedData.marginTop.value,
      marginBottom: animatedData.marginBottom.value,
      paddingLeft: animatedData.marginHorizontal.value,
      paddingRight: animatedData.marginHorizontal.value,
      columnGap: animatedData.columnGap.value ?? undefined,
      rowGap: animatedData.columnGap.value ?? undefined,
    };
  });

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
        <AnimatedScrollView
          horizontal
          style={scrollViewStyle}
          showsHorizontalScrollIndicator={false}
        >
          <Animated.View
            style={[
              scrollViewContentStyle,
              { flexGrow: 1, justifyContent: 'center', flexDirection: 'row' },
            ]}
          >
            {linksOrdered.map((link, index) => (
              <SocialLinkRenderer
                key={index}
                style={[
                  pressableStyle,
                  {
                    borderColor: swapColor(iconColor, colorPalette),
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
                onPress={() => onPressSocialLink(link)}
                first={index === 0}
                last={index === linksOrdered.length - 1}
                iconStyle={[
                  { tintColor: swapColor(iconColor, colorPalette) },
                  iconStyle,
                ]}
                icon={link.socialId as SocialLinkId}
                marginHorizontal={
                  animatedData === null
                    ? data.marginHorizontal
                    : animatedData.marginHorizontal
                }
              />
            ))}
          </Animated.View>
        </AnimatedScrollView>
      ) : (
        <Animated.View
          style={[
            {
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'center',
              flexWrap: 'wrap',
            },
            animatedMultiLinestyle,
            multilineStyle,
          ]}
        >
          {linksOrdered.map((link, index) => (
            <SocialLinkRenderer
              key={index}
              style={[
                pressableStyle,
                {
                  borderColor: swapColor(iconColor, colorPalette),
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
              onPress={() => onPressSocialLink(link)}
              disabled={disabled}
              disabledOpacity={1}
              icon={link.socialId as SocialLinkId}
              iconStyle={[
                { tintColor: swapColor(iconColor, colorPalette) },
                iconStyle,
              ]}
            />
          ))}
        </Animated.View>
      )}
    </CardModuleBackground>
  );
};

const SocialLinkRenderer = ({
  style,
  iconStyle,
  first,
  last,
  icon,
  marginHorizontal,
  ...props
}: PressableOpacityProps & {
  style: StyleProp<ViewStyle>;
  iconStyle: StyleProp<ImageStyle>;
  first?: boolean;
  last?: boolean;
  icon: SocialLinkId;
  marginHorizontal?: SharedValue<number> | number | null;
}) => {
  const animatedPressableStyle = useAnimatedStyle(() => {
    if (typeof marginHorizontal === 'number') {
      return {
        marginLeft: first ? marginHorizontal : 0,
        marginRight: last ? marginHorizontal : 0,
      };
    }

    return {
      //padding on scrollview mess the display with contentContainerStyle, to keep the "centered" effect we need to add margin to the first and last element to keep the same "centered effect
      marginLeft: first ? marginHorizontal?.value : 0,
      marginRight: last ? marginHorizontal?.value : 0,
    };
  });

  return (
    <PressableOpacity style={[style, animatedPressableStyle]} {...props}>
      <SocialIcon icon={icon} style={iconStyle} />
    </PressableOpacity>
  );
};

export default SocialLinksRenderer;
