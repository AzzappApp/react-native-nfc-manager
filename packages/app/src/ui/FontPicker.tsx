import { memo, useCallback } from 'react';
import { Text, View, StyleSheet } from 'react-native';
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

  const renderItem = useCallback(({ item }: FontItemProps) => {
    return <MemoFontItem item={item} />;
  }, []);

  return (
    <BottomSheetModal
      visible={visible}
      onRequestClose={onRequestClose}
      height={height}
      headerTitle={title}
    >
      <SelectList
        data={fonts}
        selectedItemKey={value}
        onItemSelected={onChange}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
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
  return (
    <View style={styles.viewItem}>
      <Text style={[styles.text, { fontFamily: item }]}>{item}</Text>
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
    backgroundColor: 'red',
  },
});
