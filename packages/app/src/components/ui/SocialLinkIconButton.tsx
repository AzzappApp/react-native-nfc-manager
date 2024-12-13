import { View } from 'react-native';
import {
  SOCIAL_LINKS,
  socialLinkWebsite,
  type SocialLinkItem,
  type SocialLinkItemType,
} from '@azzapp/shared/socialLinkHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { useSocialMediaName } from '#hooks/ui/useSocialMediaName';
import { SocialIcon } from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';

type SocialLinkIconButtonAlowedProps = SocialLinkItem | SocialLinkItemType;

type SocialLinkIconButtonProps<T extends SocialLinkIconButtonAlowedProps> = {
  // Item to show, accespt either SocialLinkItem or SocialLinkItemType
  item: T;
  // On button press callback
  onPress: (arg: T) => void;
  // Show top right delete button
  showDelete?: boolean;
  // On delete buttion pressed callback
  onDeletePress?: (arg: T) => void;
};

/*
 * Shows the square Social link button with text description
 */
export const SocialLinkIconButton = <
  T extends SocialLinkIconButtonAlowedProps,
>({
  item,
  onPress,
  showDelete,
  onDeletePress,
}: SocialLinkIconButtonProps<T>) => {
  const styles = useStyleSheet(styleSheet);

  const onDeletePressInner = onDeletePress
    ? () => {
        onDeletePress(item);
      }
    : undefined;

  // retrieve generic type and fallback on waebsite if not found
  const genericSocialType: SocialLinkItemType | undefined =
    ('socialId' in item
      ? SOCIAL_LINKS.find(s => s.id === item.socialId)
      : item) || socialLinkWebsite;

  const label = useSocialMediaName(genericSocialType);

  const onItemPressInner = () => onPress(item);

  return (
    <PressableOpacity
      style={styles.mainPressableStyle}
      onPress={onItemPressInner}
    >
      <View style={styles.containtContainer}>
        <SocialIcon icon={genericSocialType.id} style={styles.socialIcon} />
        <View style={styles.textContainer}>
          <Text style={styles.text} ellipsizeMode="tail" numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>
      {showDelete ? (
        <IconButton
          icon="close"
          size={20}
          style={styles.close}
          onPress={onDeletePressInner}
        />
      ) : undefined}
    </PressableOpacity>
  );
};
export const SOCIAL_LINK_ICON_BUTTON_HEIGHT = 72;
const styleSheet = createStyleSheet(appearance => ({
  containtContainer: {
    height: 72,
    width: 72,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: 6,
    alignItems: 'center',
  },
  socialIcon: {
    height: 24,
    width: 24,
    tintColor: appearance === 'light' ? colors.black : colors.white,
  },
  textContainer: {
    borderRadius: 28,
    marginTop: 8,
    height: 17,
    width: 52,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
  text: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-SemiBold',
    textAlign: 'center',
    top: 2,
  },
  close: {
    position: 'absolute',
    left: 60,
    top: -8,
    height: 20,
    width: 20,
    borderColor: appearance === 'light' ? colors.grey100 : colors.grey800,
  },
  mainPressableStyle: {
    height: SOCIAL_LINK_ICON_BUTTON_HEIGHT,
    paddingHorizontal: 5,
  },
}));
