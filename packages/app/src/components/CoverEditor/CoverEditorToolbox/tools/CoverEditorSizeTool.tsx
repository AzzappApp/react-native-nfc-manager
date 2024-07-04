import { useCallback, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import LabeledWheelSelector from '#ui/LabeledWheelSelector';
import Text from '#ui/Text';
import {
  useCoverEditorContext,
  useCoverEditorLinksLayer,
  useCoverEditorTextLayer,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';

type Props = {
  title: string;
};

const CoverEditorSizeTool = ({ title }: Props) => {
  const intl = useIntl();
  const textLayer = useCoverEditorTextLayer();
  const linksLayer = useCoverEditorLinksLayer();
  const { dispatch } = useCoverEditorContext();

  const [show, toggleBottomSheet] = useToggle(false);

  const size = textLayer?.fontSize ?? linksLayer?.size ?? 12;
  const onSizeChange = useCallback(
    (size: number) => {
      dispatch({
        type: 'UPDATE_CURRENT_LAYER_SIZE',
        payload: { size },
      });
    },
    [dispatch],
  );

  const currentFontSize = useSharedValue(size);

  useEffect(() => {
    currentFontSize.value = size;
  }, [currentFontSize, size]);

  return (
    <>
      <ToolBoxSection
        label={intl.formatMessage({
          defaultMessage: 'Size',
          description: 'Cover Edition - Toolbox sub-menu text - Size',
        })}
        icon={
          <View style={{ flexDirection: 'row' }}>
            <Text variant="button" style={styles.size}>
              {size}
            </Text>
            <Text variant="small">pt</Text>
          </View>
        }
        onPress={() => toggleBottomSheet()}
      />

      <BottomSheetModal
        lazy
        visible={show}
        onRequestClose={toggleBottomSheet}
        height={165}
      >
        <Container>
          <Header
            middleElement={<Text variant="large">{title}</Text>}
            rightElement={
              <View style={styles.done}>
                <Button label="Done" onPress={toggleBottomSheet} />
              </View>
            }
          />
          <LabeledWheelSelector
            min={COVER_MIN_FONT_SIZE}
            max={COVER_MAX_FONT_SIZE}
            step={1}
            interval={10}
            onChange={onSizeChange}
            value={size}
            label={intl.formatMessage({
              defaultMessage: 'Font size: ',
              description: 'Label of the font size slider in cover edition',
            })}
            style={styles.slider}
          />
        </Container>
      </BottomSheetModal>
    </>
  );
};

const styles = StyleSheet.create({
  done: {
    position: 'relative',
    left: 30,
  },
  slider: {
    marginTop: 15,
  },
  size: {
    fontSize: 18,
    lineHeight: 18,
  },
});

const COVER_MIN_FONT_SIZE = 6;
const COVER_MAX_FONT_SIZE = 128;

export default CoverEditorSizeTool;
