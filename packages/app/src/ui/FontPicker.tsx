import { Text } from 'react-native';
import { useAvailableFonts } from '#helpers/mediaHelpers';
import BottomSheetModal from './BottomSheetModal';
import SelectList from './SelectList';

const FontPicker = ({
  title,
  value,
  onChange,
  visible,
  height,
  onRequestClose,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  height: number;
  onRequestClose: () => void;
}) => {
  const fonts = useAvailableFonts();
  return (
    <BottomSheetModal
      visible={visible}
      onRequestClose={onRequestClose}
      height={height}
      headerTitle={title}
    >
      <SelectList
        selectedItem={value}
        onChange={onChange}
        items={fonts}
        renderItem={item => (
          <Text
            style={{
              fontSize: 18,
              fontFamily: item,
              textAlign: 'center',
              alignSelf: 'center',
            }}
          >
            {item}
          </Text>
        )}
        keyExtractor={item => item}
      />
    </BottomSheetModal>
  );
};

export default FontPicker;
