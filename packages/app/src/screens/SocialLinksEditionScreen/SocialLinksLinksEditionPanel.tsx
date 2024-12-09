import { FormattedMessage, useIntl } from 'react-intl';
import { View, ScrollView } from 'react-native';
import { colors } from '#theme';
import { SocialLinkIconButton } from '#components/ui/SocialLinkIconButton';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import TitleWithLine from '#ui/TitleWithLine';
import type { SocialLinkItem } from '@azzapp/shared/socialLinkHelpers';
import type { ViewProps, StyleProp, ViewStyle } from 'react-native';
// import type { PanGesture } from 'react-native-gesture-handler';

type SocialLinksLinksEditionPanelProps = ViewProps & {
  /**
   * The links currently set on the module
   */
  links: SocialLinkItem[];
  /**
   * A callback called when the user update the links
   */
  onDeleteLink: (links: SocialLinkItem) => void;
  onItemPress: (link: SocialLinkItem) => void;
  onAddLink: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  ignoreKeyboard?: boolean;
  showTitleWithLineHeader?: boolean;
  maxLink?: number;
};

/**
 * A Panel to edit the Links of the SocialLinks edition screen
 */
const SocialLinksLinksEditionPanel = ({
  links,
  onDeleteLink,
  onAddLink,
  onItemPress,
  style,
  contentContainerStyle,
  ignoreKeyboard,
  showTitleWithLineHeader,
  maxLink = -1,
  ...props
}: SocialLinksLinksEditionPanelProps) => {
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);

  //   return consolidatedLinks.sort((a, b) => {
  //     if (a.position !== b.position) {
  //       return a.position - b.position;
  //     }
  //     return 0;
  //   });
  // }, [intl, links]);

  // const onChangeOrder = (
  //   arr: Array<{
  //     id: string;
  //     link?: string | undefined;
  //     position: number;
  //     mask: string;
  //   }>,
  // ) => {
  //   //update the position of items in link
  //   const newLinks = links.map(link => {
  //     const item = arr.find(item => item.id === link?.socialId);
  //     if (item && link) {
  //       return {
  //         ...link,
  //         position: item.position,
  //       };
  //     }
  //     return link;
  //   });
  //   onLinksChange(newLinks);
  // };

  return (
    <View style={[styles.root, style]} {...props}>
      {showTitleWithLineHeader ? (
        <TitleWithLine
          title={intl.formatMessage({
            defaultMessage: 'Links',
            description: 'Title of the Links section in SocialLinks edition',
          })}
        />
      ) : undefined}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: maxLink <= 0 ? 60 : 0,
        }}
        style={styles.scrollView}
        showsHorizontalScrollIndicator={false}
        horizontal
      >
        {links.map(link => {
          return (
            <SocialLinkIconButton
              key={`${link.socialId}${link.position}`}
              item={link}
              onPress={onItemPress}
              showDelete
              onDeletePress={onDeleteLink}
            />
          );
        })}
      </ScrollView>
      {maxLink > 0 && (
        <Text variant="medium" style={styles.linksPreviewCount}>
          <FormattedMessage
            defaultMessage="{links}/{maxLink} links"
            description="CoverEditorLinksModal - Links count"
            values={{ links: links.length, maxLink }}
          />
        </Text>
      )}
      <View style={styles.iconContainer}>
        <IconButton
          icon="add"
          onPress={onAddLink}
          disabled={maxLink > 0 && links.length >= maxLink}
        />
      </View>
    </View>
  );
};

export default SocialLinksLinksEditionPanel;

const styleSheet = createStyleSheet(appearance => ({
  root: {
    paddingHorizontal: 20,
    rowGap: 15,
    justifyContent: 'flex-start',
  },
  iconContainer: {
    width: '100%',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flexGrow: 0,
    width: '100%',
    paddingHorizontal: 5,
    paddingTop: 20,
    overflow: 'visible',
  },
  pressableSocialIcon: {
    paddingHorizontal: 5,
  },
  linksPreviewCount: {
    textAlign: 'center',
    color: appearance === 'light' ? colors.grey400 : colors.grey600,
  },
}));

export const SOCIAL_LINK_PANEL_ITEM_HEIGHT = 56;
