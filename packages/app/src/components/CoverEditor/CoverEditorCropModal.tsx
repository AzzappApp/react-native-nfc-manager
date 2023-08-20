import { useState } from 'react';
import { useIntl } from 'react-intl';
import { Modal, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RotateButton } from '#components/commonsButtons';
import CoverPreviewRenderer from '#components/CoverPreviewRenderer';
import {
  getNextOrientation,
  type CropData,
  type EditionParameters,
} from '#components/gpu';
import ImageEditionFooter from '#components/ImageEditionFooter';
import ImageEditionParameterControl from '#components/ImageEditionParameterControl';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import type { TimeRange } from '#components/ImagePicker/imagePickerTypes';
import type { ColorPalette, CoverStyleData } from './coverEditorTypes';

type CoverEditorCropModalProps = {
  visible: boolean;
  media: {
    uri: string;
    kind: 'image' | 'video';
    width: number;
    height: number;
  } | null;
  maskMedia: {
    uri: string;
  } | null;
  title: string | null;
  subTitle: string | null;
  timeRange?: TimeRange | null;
  coverStyle: CoverStyleData;
  mediaParameters?: EditionParameters | null;
  colorPalette: ColorPalette | null;
  onClose: () => void;
  onSave: (editionParameters: EditionParameters) => void;
};

const CoverEditorCropModal = ({
  visible,
  media,
  maskMedia,
  title,
  subTitle,
  mediaParameters,
  timeRange,
  coverStyle,
  colorPalette,
  onClose,
  onSave,
}: CoverEditorCropModalProps) => {
  const intl = useIntl();

  const [editionParameters, setEditionParameters] = useState(
    mediaParameters ?? {},
  );
  const onCropDataChange = (cropData: CropData) => {
    setEditionParameters(prev => ({
      ...prev,
      cropData,
    }));
  };

  const onSaveInner = () => {
    onSave(editionParameters);
  };

  const onRollChange = (roll: number) => {
    setEditionParameters(prev => ({
      ...prev,
      roll,
    }));
  };

  const onNextOrientation = () => {
    setEditionParameters(prev => ({
      ...prev,
      orientation: getNextOrientation(prev.orientation),
    }));
  };

  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const top = insets.top;
  const bottom = Math.min(insets.bottom, 15);

  const coverHeight = windowHeight - top - bottom - HEADER_HEIGHT - 180;

  if (!media) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Container style={{ flex: 1, paddingTop: top, paddingBottom: bottom }}>
        <Header
          middleElement={intl.formatMessage({
            defaultMessage: 'Crop your image',
            description: 'Cover editor crop image modal title',
          })}
          rightElement={<RotateButton onPress={onNextOrientation} />}
          style={{ marginBottom: 20 }}
        />
        <CoverPreviewRenderer
          uri={media.uri}
          kind={media.kind}
          startTime={timeRange?.startTime}
          duration={timeRange?.duration}
          backgroundColor={coverStyle?.backgroundColor}
          maskUri={maskMedia?.uri}
          backgroundImageUri={coverStyle?.background?.uri}
          backgroundImageTintColor={coverStyle?.backgroundPatternColor}
          foregroundId={coverStyle?.foreground?.id}
          foregroundImageUri={coverStyle?.foreground?.uri}
          foregroundImageTintColor={coverStyle?.foregroundColor}
          backgroundMultiply={coverStyle?.merged}
          editionParameters={{
            ...coverStyle?.mediaParameters,
            ...editionParameters,
          }}
          filter={coverStyle?.mediaFilter}
          // text props
          title={title}
          titleStyle={coverStyle?.titleStyle}
          subTitle={subTitle}
          subTitleStyle={coverStyle?.subTitleStyle}
          textOrientation={coverStyle?.textOrientation}
          textPosition={coverStyle?.textPosition}
          // other props
          colorPalette={colorPalette!}
          mediaSize={media}
          height={coverHeight}
          onCropDataChange={onCropDataChange}
          cropEditionMode
          style={{ alignSelf: 'center' }}
        />
        <View style={{ flex: 1 }}>
          <ImageEditionParameterControl
            value={editionParameters.roll}
            parameter="roll"
            onChange={onRollChange}
            style={{ flex: 1 }}
          />
          <ImageEditionFooter onSave={onSaveInner} onCancel={onClose} />
        </View>
      </Container>
    </Modal>
  );
};

export default CoverEditorCropModal;
