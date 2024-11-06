import { memo, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APPLICATIONS_FONTS } from '@azzapp/shared/fontHelpers';
import Text from '#ui/Text';
import BottomSheetModal from './BottomSheetModal';
import Button from './Button';
import Header from './Header';
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
  height: number;
  visible: boolean;
  onChange: (value: string) => void;
  onRequestClose: () => void;
}) => {
  const renderItem = useCallback(({ item }: FontItemProps) => {
    return <MemoFontItem item={item} />;
  }, []);
  const intl = useIntl();
  const { bottom } = useSafeAreaInsets();

  return (
    <BottomSheetModal
      height={height}
      visible={visible}
      onDismiss={onRequestClose}
      nestedScroll
      enableContentPanningGesture={false}
    >
      {title && (
        <Header
          middleElement={title}
          rightElement={
            <Button
              label={intl.formatMessage({
                defaultMessage: 'Done',
                description: 'FontPicker component Done button label',
              })}
              onPress={onRequestClose}
              variant="primary"
            />
          }
        />
      )}
      <SelectList
        data={APPLICATIONS_FONTS}
        selectedItemKey={value}
        onItemSelected={onChange}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={{ paddingBottom: bottom }}
      />
    </BottomSheetModal>
  );
};

const keyExtractor = (item: string) => item;
const getItemLayout = (_: any, index: number) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});
type FontItemProps = {
  item: string;
};

const ITEM_HEIGHT = 35;

const FontItem = ({ item }: FontItemProps) => {
  const intl = useIntl();

  const [fontName, fontWeight] = item.split('_');

  let label = fontName;
  if (fontWeight && fontWeight !== 'Regular') {
    switch (fontWeight.toLowerCase()) {
      case 'bold':
        label +=
          ' ' +
          intl.formatMessage({
            defaultMessage: 'Bold',
            description: 'FontPicker component Bold label',
          });
        break;
      case 'semibold':
        label +=
          ' ' +
          intl.formatMessage({
            defaultMessage: 'Semi Bold',
            description: 'FontPicker component SemiBold label',
          });
        break;
      case 'medium':
        label +=
          ' ' +
          intl.formatMessage({
            defaultMessage: 'Medium',
            description: 'FontPicker component Medium label',
          });
        break;
      case 'light':
        label +=
          ' ' +
          intl.formatMessage({
            defaultMessage: 'Light',
            description: 'FontPicker component Light label',
          });
        break;
      case 'thin':
        label +=
          ' ' +
          intl.formatMessage({
            defaultMessage: 'Thin',
            description: 'FontPicker component Thin label',
          });
        break;
      case 'ultralight':
        label +=
          ' ' +
          intl.formatMessage({
            defaultMessage: 'Ultra Light',
            description: 'FontPicker component Ultra Light label',
          });

        break;
      default:
        label += ' ' + fontWeight.charAt(0).toUpperCase() + fontWeight.slice(1);
        break;
    }
  }

  return (
    <View style={styles.viewItem}>
      <Text style={[styles.text, { fontFamily: item }]}>{label}</Text>
    </View>
  );
};

const MemoFontItem = memo(FontItem);
export default FontPicker;

const styles = StyleSheet.create({
  text: {
    fontSize: 20,
    textAlign: 'center',
    alignSelf: 'center',
  },
  viewItem: {
    height: ITEM_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
