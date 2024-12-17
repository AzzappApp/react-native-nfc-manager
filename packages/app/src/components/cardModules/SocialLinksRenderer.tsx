import { useEffect, useMemo } from 'react';
import {
  LayoutAnimation,
  Linking,
  Platform,
  UIManager,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  getModuleDataValues,
  SOCIAL_LINKS_DEFAULT_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
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
  /**
   * The data for the SocialLinks module
   */
  data: SocialLinksRendererData;
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
  coverBackgroundColor,
  ...props
}: SocialLinksRendererProps) => {
  const {
    links,
    iconColor,
    arrangement,
    background,
    backgroundStyle,
    borderWidth,
    columnGap,
    iconSize,
    marginBottom,
    marginHorizontal,
    marginTop,
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
    let linkUrl = link.link;
    if (link.socialId === 'phone') linkUrl = `tel:${link.link}`;
    if (link.socialId === 'sms') linkUrl = `sms:${link.link}`;
    if (link.socialId === 'mail') linkUrl = `mailto:${link.link}`;

    await Linking.openURL(linkUrl);
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

  const scrollViewStyle = useMemo(() => {
    return {
      marginTop: marginTop ?? 0,
      marginBottom: marginBottom ?? 0,
    };
  }, [marginTop, marginBottom]);

  const scrollViewContentStyle = useMemo(() => {
    return {
      columnGap: columnGap ?? undefined,
    };
  }, [columnGap]);

  const pressableStyle = useMemo(() => {
    return {
      width: iconSize ?? 0,
      height: iconSize ?? 0,
      borderWidth: borderWidth ?? 0,
      borderRadius: (iconSize ?? 0) / 2,
    };
  }, [iconSize, borderWidth]);

  const iconStyle = useMemo(() => {
    return {
      width: (iconSize ?? 0) - 22,
      height: (iconSize ?? 0) - 22,
    };
  }, [iconSize]);

  const animatedMultiLinestyle = useMemo(() => {
    return {
      marginTop: marginTop ?? 0,
      marginBottom: marginBottom ?? 0,
      paddingLeft: marginHorizontal ?? 0,
      paddingRight: marginHorizontal ?? 0,
      columnGap: columnGap ?? undefined,
      rowGap: columnGap ?? undefined,
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
        <ScrollView
          horizontal
          style={scrollViewStyle}
          showsHorizontalScrollIndicator={false}
        >
          <View
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
                marginHorizontal={marginHorizontal}
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <View
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
        </View>
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
  marginHorizontal?: number;
}) => {
  const animatedPressableStyle = useMemo(() => {
    return {
      marginLeft: first ? marginHorizontal : 0,
      marginRight: last ? marginHorizontal : 0,
    };
  }, [first, last, marginHorizontal]);

  return (
    <PressableOpacity style={[style, animatedPressableStyle]} {...props}>
      <SocialIcon icon={icon} style={iconStyle} />
    </PressableOpacity>
  );
};

export default SocialLinksRenderer;
