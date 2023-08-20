import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import { TRANSITION_DURATION } from './newProfileScreenHelpers';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type PagerHeaderProps = Omit<ViewProps, 'children'> & {
  title: React.ReactNode;
  currentPage: number;
  nbPages: number;
  onBack: () => void;
};

const PagerHeader = ({
  onBack,
  title,
  nbPages,
  currentPage,
  style,
  ...props
}: PagerHeaderProps) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <View {...props} style={[styles.root, style]}>
      <View style={styles.header}>
        <View style={styles.headerSegment}>
          <IconButton
            icon={currentPage === 0 ? 'arrow_down' : 'arrow_left'}
            onPress={onBack}
            iconSize={28}
            variant="icon"
            style={styles.backIcon}
          />
        </View>
        <Animated.View
          key={currentPage}
          style={styles.titleTextContainer}
          exiting={FadeOutDown.duration(TRANSITION_DURATION)}
          entering={FadeInDown.duration(TRANSITION_DURATION)}
        >
          <Text variant="xlarge" style={styles.titleText}>
            {title}
          </Text>
        </Animated.View>
        <View style={styles.headerSegment} />
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

export const PAGER_HEADER_HEIGHT = 102;

const styleSheet = createStyleSheet(appearance => ({
  root: {
    height: PAGER_HEADER_HEIGHT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    flex: 1,
  },
  headerSegment: {
    width: 40,
  },
  backIcon: {
    height: 17,
    width: 10,
  },
  titleTextContainer: {
    flex: 1,
    alingSelft: 'stretch',
  },
  titleText: {
    textAlign: 'center',
    paddingTop: 0,
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
