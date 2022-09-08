import { TITLE_POSITIONS } from '@azzapp/shared/lib/cardHelpers';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../theme';

export const TitlePositionIcon = ({ value }: { value: string }) => (
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

const styles = StyleSheet.create({
  iconContainer: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    flexWrap: 'wrap',
  },
  iconButton: {
    width: 6.5,
    height: 5.33,
    borderRadius: 1,
    backgroundColor: colors.lightGrey,
  },
  iconButtonSelected: {
    backgroundColor: '#45444C',
  },
});
