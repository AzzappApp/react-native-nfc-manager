import { View } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { ColorSchemeName } from 'react-native';

type PageProgressProps = {
  nbPages: number;
  currentPage: number;
  appearance?: ColorSchemeName;
};

export const PageProgress = ({
  nbPages,
  currentPage,
  appearance,
}: PageProgressProps) => {
  const styles = useStyleSheet(styleSheet, appearance);

  return (
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
  );
};

const CIRCLE_SIZE = 5;

const styleSheet = createStyleSheet(appearance => ({
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
