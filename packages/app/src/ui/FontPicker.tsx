import { useIntl } from 'react-intl';
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
  const intl = useIntl();
  return (
    <BottomSheetModal
      visible={visible}
      onValidate={onRequestClose}
      title={title}
      height={height}
      validationButtonLabel={intl.formatMessage({
        defaultMessage: 'Add',
        description: 'FontPicker - BottomSheetModal - Validation button label',
      })}
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
