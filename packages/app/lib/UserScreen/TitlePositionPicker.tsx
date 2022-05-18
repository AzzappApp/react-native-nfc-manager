import { TITLE_POSITIONS } from '@azzapp/shared/lib/cardHelpers';
import { Pressable, StyleSheet, View } from 'react-native';
import BottomSheetModal from '../components/BottomSheetModal';

const TitlePositionPicker = ({
  value,
  onChange,
  visible,
  height,
  onRequestClose,
}: {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  height: number;
  onRequestClose: () => void;
}) => (
  <BottomSheetModal
    visible={visible}
    onRequestClose={onRequestClose}
    title="Title position"
    height={height}
  >
    <View style={styles.container}>
      {TITLE_POSITIONS.map(position => (
        <Pressable
          key={position}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            position === value && styles.buttonSelected,
          ]}
          onPress={() => onChange(position)}
        />
      ))}
    </View>
  </BottomSheetModal>
);

export default TitlePositionPicker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignContent: 'space-around',
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: 'rgba(69, 68, 76, 0.2)',
    borderRadius: 10,
    width: '30%',
    height: 37,
  },
  buttonPressed: {
    backgroundColor: 'rgba(69, 68, 76, 0.4)',
  },
  buttonSelected: {
    backgroundColor: '#B4D5FE',
  },
});
