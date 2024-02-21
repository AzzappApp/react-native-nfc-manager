import { useEffect } from 'react';
import { LayoutAnimation, Linking, Platform, UIManager } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
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

const animatedProps = [
  'iconSize',
  'borderWidth',
  'columnGap',
  'marginTop',
  'marginBottom',
  'marginHorizontal',
] as const;

type AnimatedProps = (typeof animatedProps)[number];

export type SocialLinksViewRendererData = Omit<
  SocialLinksRenderer_module$data,
  ' $fragmentType'
>;

export type SocialLinksRendererData = NullableFields<
  Omit<SocialLinksViewRendererData, AnimatedProps>
>;

type SocialLinksRendererAnimatedData = {
  [K in AnimatedProps]:
    | SharedValue<SocialLinksViewRendererData[K]>
    | SocialLinksViewRendererData[K];
};

export type SocialLinksRendererProps = ViewProps & {
  /**
   * The data for the SocialLinks module
   */
  data: SocialLinksRendererData;
  /**
   * The animated data for the SocialLinks module
   */
  animatedData: SocialLinksRendererAnimatedData;
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

export type SocialLinksViewRendererProps = Omit<
  SocialLinksRendererProps,
  'animatedData' | 'data'
> & {
  data: SocialLinksViewRendererData;
};

export const SocialLinksViewRenderer = ({
  data,
  ...rest
}: SocialLinksViewRendererProps) => {
  const {
    borderWidth,
    columnGap,
    marginTop,
    marginBottom,
    marginHorizontal,
    iconSize,
    ...restData
  } = data;

  return (
    <SocialLinksRenderer
      {...rest}
      data={restData}
      animatedData={{
        iconSize,
        borderWidth,
        columnGap,
        marginTop,
        marginBottom,
        marginHorizontal,
      }}
    />
  );
};

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
  disabled,
  ...props
}: SocialLinksRendererProps) => {
  const { links, iconColor, arrangement, background, backgroundStyle } =
    getModuleDataValues({
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

  const {
    iconSize,
    borderWidth,
    columnGap,
    marginTop,
    marginBottom,
    marginHorizontal,
  } = props.animatedData;

  const scrollViewStyle = useAnimatedStyle(
    () => ({
      marginTop:
        typeof marginTop === 'number'
          ? marginTop
          : marginTop?.value ?? undefined,
      marginBottom:
        typeof marginBottom === 'number'
          ? marginBottom
          : marginBottom?.value ?? undefined,
    }),
    [marginTop, marginBottom],
  );

  const scrollViewContentStyle = useAnimatedStyle(
    () => ({
      columnGap:
        typeof columnGap === 'number'
          ? columnGap
          : columnGap?.value ?? SOCIAL_LINKS_DEFAULT_VALUES.columnGap,
      flexGrow: 1,
      justifyContent: 'center',
      flexDirection: 'row',
    }),
    [columnGap],
  );

  const pressableStyle = useAnimatedStyle(() => {
    const iconSizeValue =
      typeof iconSize === 'number'
        ? iconSize
        : iconSize?.value ?? SOCIAL_LINKS_DEFAULT_VALUES.iconSize;
    return {
      width: iconSizeValue,
      height: iconSizeValue,
      borderWidth:
        typeof borderWidth === 'number'
          ? borderWidth
          : borderWidth?.value ?? SOCIAL_LINKS_DEFAULT_VALUES.borderWidth,
      borderRadius: iconSizeValue / 2,
    };
  }, [iconSize, borderWidth]);

  const iconStyle = useAnimatedStyle(() => {
    const iconSizeValue =
      typeof iconSize === 'number'
        ? iconSize
        : iconSize?.value ?? SOCIAL_LINKS_DEFAULT_VALUES.iconSize;
    return {
      width: iconSizeValue - 22,
      height: iconSizeValue - 22,
    };
  }, [iconSize]);

  const multiLineAnimatedStyle = useAnimatedStyle(() => {
    const marginHorizontalValue =
      typeof marginHorizontal === 'number'
        ? marginHorizontal
        : marginHorizontal?.value ??
          SOCIAL_LINKS_DEFAULT_VALUES.marginHorizontal;

    const columnGapValue =
      typeof columnGap === 'number'
        ? columnGap
        : columnGap?.value ?? SOCIAL_LINKS_DEFAULT_VALUES.columnGap;

    return {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginTop:
        typeof marginTop === 'number'
          ? marginTop
          : marginTop?.value ?? SOCIAL_LINKS_DEFAULT_VALUES.marginTop,
      marginBottom:
        typeof marginBottom === 'number'
          ? marginBottom
          : marginBottom?.value ?? SOCIAL_LINKS_DEFAULT_VALUES.marginBottom,
      paddingLeft: marginHorizontalValue,
      paddingRight: marginHorizontalValue,
      columnGap: columnGapValue,
      rowGap: columnGapValue,
    };
  }, [marginTop, marginBottom, marginHorizontal, columnGap]);

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
          <Animated.View style={scrollViewContentStyle}>
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
                marginHorizontal={marginHorizontal}
              />
            ))}
          </Animated.View>
        </AnimatedScrollView>
      ) : (
        <Animated.View style={[multiLineAnimatedStyle, multilineStyle]}>
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
  marginHorizontal?: SharedValue<number | null> | number | null;
}) => {
  const pressableStyle = useAnimatedStyle(() => {
    const marginHorizontalValue =
      typeof marginHorizontal === 'number'
        ? marginHorizontal
        : marginHorizontal?.value ?? undefined;
    return {
      //padding on scrollview mess the display with contentContainerStyle, to keep the "centered" effect we need to add margin to the first and last element to keep the same "centered effect
      marginLeft: first ? marginHorizontalValue : 0,
      marginRight: last ? marginHorizontalValue : 0,
    };
  }, [first, last, marginHorizontal]);

  return (
    <PressableOpacity style={[style, pressableStyle]} {...props}>
      <SocialIcon icon={icon} style={iconStyle} />
    </PressableOpacity>
  );
};

export default SocialLinksRenderer;
