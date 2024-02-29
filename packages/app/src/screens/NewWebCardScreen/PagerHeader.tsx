import { Platform, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import { TRANSITION_DURATION } from './WizardTransitioner';
import type { Icons } from '#ui/Icon';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type PagerHeaderProps = Omit<ViewProps, 'children'> & {
  title: React.ReactNode;
  currentPage: number;
  nbPages: number;
  backIcon?: Icons;
  onBack: () => void;
  rightElement?: React.ReactNode;
  rightElementWidth?: number;
};

const PagerHeader = ({
  onBack,
  title,
  nbPages,
  currentPage,
  style,
  backIcon = 'arrow_left',
  rightElement,
  rightElementWidth = 40,
  ...props
}: PagerHeaderProps) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <View {...props} style={[styles.root, style]}>
      <View style={styles.header}>
        <View style={styles.headerSegment}>
          <IconButton
            icon={backIcon}
            onPress={onBack}
            iconSize={28}
            variant="icon"
            style={[styles.backIcon, { minWidth: rightElementWidth }]}
          />
        </View>
        <Animated.View
          key={currentPage}
          style={[styles.titleTextContainer]}
          exiting={FadeOutDown.duration(TRANSITION_DURATION)}
          entering={FadeInDown.duration(TRANSITION_DURATION)}
        >
          <Text variant="large" style={styles.titleText}>
            {title}
          </Text>
        </Animated.View>
        <View
          style={[styles.headerSegment, { minWidth: rightElementWidth }]}
          collapsable={false}
        >
          {rightElement}
        </View>
      </View>
      <View style={styles.pagerContainer}>
        {Array.from({ length: nbPages }).map((_, index) => {
          if (index < currentPage) {
            return (
              <View
                accessibilityState={{ selected: false }}
                key={`NewProfilepager-${index}`}
                style={[styles.common, styles.previousCircle]}
              />
            );
          } else if (index === currentPage) {
            return (
              <View
                accessibilityRole="none"
                accessibilityState={{ selected: true }}
                key={`NewProfilepager-${index}`}
                style={[styles.common, styles.selectedCircle]}
              />
            );
          }
          return (
            <View
              accessibilityState={{ selected: false }}
              key={`NewProfilepager-${index}`}
              style={[styles.common, styles.smallCircle]}
            />
          );
        })}
        <View />
      </View>
    </View>
  );
};

export default PagerHeader;

const CIRCLE_SIZE = 5;

export const PAGER_HEADER_HEIGHT = Platform.OS === 'android' ? 90 : 85;

const styleSheet = createStyleSheet(appearance => ({
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
  pagerContainer: {
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  common: {
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    marginLeft: CIRCLE_SIZE / 2,
    marginRight: CIRCLE_SIZE / 2,
  },
  previousCircle: {
    width: CIRCLE_SIZE,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
  },
  selectedCircle: {
    width: 20,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
  },
  smallCircle: {
    width: CIRCLE_SIZE,
    backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey800,
  },
}));
