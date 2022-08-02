import { Text } from 'react-native';
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
}) => (
  <BottomSheetModal
    visible={visible}
    onRequestClose={onRequestClose}
    title={title}
    height={height}
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

export default FontPicker;

const fonts = [
  'Arial',
  'Verdana',
  'Trebuchet MS',
  'Times New Roman',
  'Georgia',
  'American Typewriter',
  'Courier',
  'Bradley Hand',
];
