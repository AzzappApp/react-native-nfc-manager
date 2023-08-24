import { Linking, ScrollView, View } from 'react-native';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  SOCIAL_LINKS_DEFAULT_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import { SocialIcon } from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import CardModuleBackground from './CardModuleBackground';
import type { SocialIcons } from '#ui/Icon';
import type {
  SocialLinksRenderer_module$data,
  SocialLinksRenderer_module$key,
} from '@azzapp/relay/artifacts/SocialLinksRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
import type { ViewProps } from 'react-native';

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

type SocialLinksRendererProps = ViewProps & {
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
};

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
    await Linking.openURL(`http://${url}${link.link}`);
  };

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
                icon={link.socialId as SocialIcons}
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
          style={{
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
          }}
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
                icon={link.socialId as SocialIcons}
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

export const SOCIAL_LINKS: Array<{ id: SocialIcons; mask: string }> = [
  { id: 'behance', mask: 'behance.net/' },
  { id: 'dev', mask: 'dev.to/' },
  { id: 'discord', mask: 'discord.gg/' },
  { id: 'dribbble', mask: 'dribbble.com/' },
  { id: 'facebook', mask: 'facebook.com/' },
  { id: 'figma', mask: 'figma.com/' },
  { id: 'github', mask: 'github.com/' },
  { id: 'gitlab', mask: 'gitlab.com/' },
  { id: 'glassdoor', mask: 'glassdoor.com/' },
  { id: 'google', mask: 'google.com/' },
  { id: 'hashnode', mask: 'hashnode.com/' },
  { id: 'instagram', mask: 'instagram.com/' },
  { id: 'kult', mask: 'kult.cc/' },
  { id: 'letterboxd', mask: 'letterboxd.com/' },
  { id: 'linkedin', mask: 'linkedin.com/in/' },
  { id: 'mastodon', mask: 'mastodon.social/' },
  { id: 'messenger', mask: 'm.me/' },
  { id: 'npm', mask: 'npmjs.com/' },
  { id: 'patreon', mask: 'patreon.com/' },
  { id: 'pinterest', mask: 'pinterest.com/' },
  { id: 'snapchat', mask: 'snapchat.com/add/' },
  { id: 'telegram', mask: 't.me/' },
  { id: 'tiktok', mask: 'tiktok.com/@' },
  { id: 'tripadvisor', mask: 'tripadvisor.com/' },
  { id: 'twitch', mask: 'twitch.tv/' },
  { id: 'twitter', mask: 'twitter.com/' },
  { id: 'typefully', mask: 'typefully.app/' },
  { id: 'whatsapp', mask: 'wa.me/' },
  { id: 'yelp', mask: 'yelp.com/' },
  { id: 'youtube', mask: 'youtube.com/channel/' },
];
