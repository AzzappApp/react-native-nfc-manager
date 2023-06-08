import { View } from 'react-native';
import { TITLE_POSITIONS } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';

export const TitlePositionIcon = ({ value }: { value: string }) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <View style={styles.iconContainer}>
      {TITLE_POSITIONS.map(position => (
        <View
          key={position}
          style={[
            styles.iconButton,
            position === value && styles.iconButtonSelected,
          ]}
        />
      ))}
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  iconButton: {
    backgroundColor: appearance === 'light' ? colors.grey900 : colors.grey200,
    opacity: 0.2,
    width: 6.5,
    height: 5.33,
    borderRadius: 1,
  },
  iconButtonSelected: {
    opacity: 1,
    backgroundColor: appearance === 'light' ? colors.grey900 : colors.grey200,
  },
  iconContainer: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    flexWrap: 'wrap',
  },
}));
