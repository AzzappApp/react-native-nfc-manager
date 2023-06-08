import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';

import Container from '#ui/Container';

type NewProfileScreenPagerIndicatorProps = {
  activeIndex: number;
};

const NUMBER_PAGE = 3;

const NewProfileScreenPagerIndicator = ({
  activeIndex,
}: NewProfileScreenPagerIndicatorProps) => {
  const styles = useStyleSheet(styleSheet);

  return (
    <Container style={styles.container}>
      {Array.from({ length: NUMBER_PAGE }).map((_, index) => {
        if (index < activeIndex) {
          return (
            <View
              accessibilityState={{ selected: false }}
              key={`NewProfilepager-${index}`}
              style={[styles.common, styles.previousCircle]}
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
            style={[styles.common, styles.smallCircle]}
          />
        );
      })}
      <View />
    </Container>
  );
};

export default NewProfileScreenPagerIndicator;

const CIRCLE_POINT = 5;

const styleSheet = createStyleSheet(appearance => ({
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
  previousCircle: {
    width: CIRCLE_POINT,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
  },
  selectedCircle: {
    width: 20,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
  },
  smallCircle: {
    width: CIRCLE_POINT,
    backgroundColor: appearance === 'light' ? colors.grey200 : colors.grey800,
  },
}));
