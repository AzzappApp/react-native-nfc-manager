import { Linking, ScrollView, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { SOCIAL_LINKS_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import { SocialIcon } from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import CardModuleBackground from './CardModuleBackground';
import type {
  SocialLink,
  SocialLinksEditionValue,
} from '#screens/SocialLinksEditionScreen/SocialLinksEditionScreenTypes';
import type { SocialIcons } from '#ui/Icon';
import type {
  SocialLinksRenderer_module$data,
  SocialLinksRenderer_module$key,
} from '@azzapp/relay/artifacts/SocialLinksRenderer_module.graphql';
import type { ViewProps } from 'react-native';

export type SocialLinksRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a SocialLinks module
   */
  module: SocialLinksRenderer_module$key;
};

/**
 * Render a SocialLinks module
 */
const SocialLinksRenderer = ({
  module,
  ...props
}: SocialLinksRendererProps) => {
  const data = useFragment(
    graphql`
      fragment SocialLinksRenderer_module on CardModule {
        id
        ... on CardModuleSocialLinks {
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
          background {
            id
            uri
          }
          backgroundStyle {
            backgroundColor
            patternColor
            opacity
          }
        }
      }
    `,
    module,
  );
  return <SocialLinksRendererRaw data={data} {...props} />;
};

export default SocialLinksRenderer;

export type SocialLinksRawData = Omit<
  SocialLinksRenderer_module$data,
  ' $fragmentType'
>;

type SocialLinksRendererRawProps = ViewProps & {
  /**
   * The data for the SocialLinks module
   */
  data: SocialLinksRawData;
};

/**
 * Raw implementation of the SocialLinks module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const SocialLinksRendererRaw = ({
  data,
  style,
  ...props
}: SocialLinksRendererRawProps) => {
  const {
    links,
    iconSize,
    iconColor,
    arrangement,
    borderWidth,
    columnGap,
    marginTop,
    marginBottom,
    background,
    backgroundStyle,
  } = Object.assign(
    {},
    SOCIAL_LINKS_DEFAULT_VALUES,
    data,
  ) as unknown as SocialLinksEditionValue;

  const linksOrdered = [...(links ?? [])].sort(
    (a, b) => a.position - b.position,
  );

  const onPressSocialLink = async (link: SocialLink) => {
    const url = SOCIAL_LINKS.find(l => l.id === link.socialId)?.mask;
    await Linking.openURL(`http://${url}${link.link}`);
  };

  return (
    <CardModuleBackground
      {...props}
      backgroundUri={background?.uri}
      backgroundOpacity={backgroundStyle?.opacity}
      backgroundColor={backgroundStyle?.backgroundColor}
      patternColor={backgroundStyle?.patternColor}
      style={style}
    >
      {arrangement === 'inline' ? (
        <ScrollView
          horizontal
          style={{
            marginTop,
            marginBottom,
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
                borderColor: iconColor,
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
                  tintColor: iconColor,
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
                borderColor: iconColor,
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
                  tintColor: iconColor,
                }}
              />
            </PressableOpacity>
          ))}
        </View>
      )}
    </CardModuleBackground>
  );
};

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
