import { View, StyleSheet } from 'react-native';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type { Icons } from '#ui/Icon';
import type { ViewProps } from 'react-native';

export type WizardPagerHeaderProps = Omit<ViewProps, 'children'> & {
  title: React.ReactNode;
  backIcon?: Icons;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  rightElementWidth?: number;
};

const WizardPagerHeader = ({
  onBack,
  title,
  style,
  backIcon,
  rightElement,
  rightElementWidth = 40,
  ...props
}: WizardPagerHeaderProps) => {
  return (
    <View {...props} style={[styles.root, style]}>
      <View style={styles.header}>
        <View style={styles.headerSegment}>
          {backIcon && (
            <IconButton
              icon={backIcon}
              onPress={onBack}
              iconSize={28}
              variant="icon"
              style={[styles.backIcon, { minWidth: rightElementWidth }]}
            />
          )}
        </View>
        <View
          style={[
            styles.titleTextContainer,
            !backIcon && { marginLeft: rightElementWidth },
          ]}
        >
          {typeof title === 'string' ? (
            <Text variant="large" style={styles.titleText}>
              {title}
            </Text>
          ) : (
            title
          )}
        </View>
        <View
          style={[styles.headerSegment, { minWidth: rightElementWidth }]}
          collapsable={false}
        >
          {rightElement}
        </View>
      </View>
    </View>
  );
};

export const PAGER_HEADER_HEIGHT = 30;

const styles = StyleSheet.create({
  root: {
    height: PAGER_HEADER_HEIGHT,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerSegment: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    height: 17,
    width: 10,
  },
  titleTextContainer: {
    alignSelf: 'center',
  },
  titleText: {
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});

export default WizardPagerHeader;
