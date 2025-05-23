import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { Icons } from '#ui/Icon';
import type { ContactDetailEnrichState } from './ContactDetailsBody';

export const ContactDetailItem = ({
  onPress,
  icon,
  label,
  content,
  iconComponent,
  isEnrichedItem,
  state,
  onRemoveField,
}: {
  onPress?: () => void;
  icon?: Icons;
  label?: string;
  content?: string;
  iconComponent?: JSX.Element;
  isEnrichedItem?: boolean;
  state?: ContactDetailEnrichState;
  onRemoveField?: () => void;
}) => {
  const styles = useStyleSheet(stylesheet);

  const isEnrichmentOngoing = state === 'waitingApproval' && isEnrichedItem;

  return (
    <View style={styles.item}>
      {isEnrichmentOngoing && (
        <LinearGradient
          // Button Linear Gradient
          colors={['#B02EFB', '#1E6BCF', '#1962C1', '#23CFCC']}
          locations={[0, 0.2, 0.8, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.linearGradient}
        />
      )}
      <View style={styles.itemContainer}>
        <View style={styles.pressableContainer}>
          <PressableNative onPress={onPress} style={styles.pressable}>
            <View style={styles.label}>
              {iconComponent ? (
                iconComponent
              ) : icon ? (
                <Icon
                  icon={icon}
                  style={
                    isEnrichmentOngoing ? styles.tintColorWhite : undefined
                  }
                />
              ) : undefined}
              <Text
                variant="smallbold"
                style={isEnrichmentOngoing ? styles.colorWhite : undefined}
              >
                {label}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.itemText,
                isEnrichmentOngoing ? styles.colorWhite : undefined,
              ]}
            >
              {content}
            </Text>
          </PressableNative>
        </View>
        {isEnrichedItem && (
          <Icon
            size={18}
            style={[
              styles.enrichIcon,
              isEnrichmentOngoing ? styles.tintColorWhite : undefined,
            ]}
            icon="filters_ai_light"
          />
        )}
        {isEnrichmentOngoing && (
          <IconButton
            icon="close"
            size={20}
            iconSize={14}
            style={styles.close}
            onPress={onRemoveField}
          />
        )}
      </View>
    </View>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  item: {
    width: '100%',
    height: 52,

    backgroundColor: appearance === 'dark' ? colors.grey900 : colors.white,
  },
  itemContainer: { flex: 1 },
  pressableContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadow({ appearance, direction: 'center' }),
  },
  pressable: {
    padding: 14,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  itemText: {
    flex: 1,
    textAlign: 'right',
  },
  enrichIcon: {
    position: 'absolute',
    top: 7,
    right: 2,
    flex: 1,
    alignSelf: 'flex-end',
  },
  close: {
    backgroundColor: appearance === 'dark' ? colors.black : colors.white,
    position: 'absolute',
    borderRadius: 30,
    top: -10,
    right: -10,
  },
  linearGradient: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    position: 'absolute',
  },
  tintColorWhite: { tintColor: colors.white },
  colorWhite: { color: colors.white },
}));
