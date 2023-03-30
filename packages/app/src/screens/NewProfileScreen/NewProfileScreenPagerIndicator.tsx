import { View, StyleSheet } from 'react-native';
import { colors } from '#theme';

type NewProfileScreenPagerIndicatorProps = {
  activeIndex: number;
};

const NUMBER_PAGE = 3;

const NewProfileScreenPagerIndicator = ({
  activeIndex,
}: NewProfileScreenPagerIndicatorProps) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: NUMBER_PAGE }).map((_, index) => {
        if (index < activeIndex) {
          return (
            <View
              accessibilityState={{ selected: false }}
              key={`NewProfilepager-${index}`}
              style={[
                styles.common,
                styles.smallCircle,
                { backgroundColor: colors.red400 },
              ]}
            />
          );
        } else if (index === activeIndex) {
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
            style={[
              styles.common,
              styles.smallCircle,
              { backgroundColor: '#D9D9D9' },
            ]}
          />
        );
      })}
      <View />
    </View>
  );
};

export default NewProfileScreenPagerIndicator;

const CIRCLE_POINT = 5;
const styles = StyleSheet.create({
  container: {
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  common: {
    height: CIRCLE_POINT,
    borderRadius: CIRCLE_POINT / 2,
    marginLeft: CIRCLE_POINT / 2,
    marginRight: CIRCLE_POINT / 2,
  },
  smallCircle: {
    width: CIRCLE_POINT,
  },
  selectedCircle: {
    width: 20,
    backgroundColor: colors.red400,
  },
});
