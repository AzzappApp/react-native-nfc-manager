import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Dimensions, StatusBar, View, useColorScheme } from 'react-native';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { shadow } from '#theme';
import { RotateButton } from '#components/commonsButtons';
import CoverPreviewRenderer from '#components/CoverPreviewRenderer';
import Cropper from '#components/Cropper';
import {
  getNextOrientation,
  type CropData,
  type EditionParameters,
} from '#components/gpu';
import ImageEditionFooter from '#components/ImageEditionFooter';
import ImageEditionParameterControl from '#components/ImageEditionParameterControl';
import ScreenModal from '#components/ScreenModal';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import type { TimeRange } from '#components/ImagePicker/imagePickerTypes';
import type { CoverStyleData } from './coverEditorTypes';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';

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

const { height: windowHeight } = Dimensions.get('screen');

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

  const [editionParameters, setEditionParameters] = useState(mediaParameters);

  useEffect(() => {
    if (!visible && !isEqual(mediaParameters, editionParameters)) {
      setEditionParameters(mediaParameters);
    }
  }, [editionParameters, mediaParameters, visible]);

  const onCropDataChange = (cropData: CropData) => {
    setEditionParameters(prev => ({
      ...prev,
      cropData,
    }));
  };

  const onSaveInner = () => {
    onSave(editionParameters ?? {});
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
      orientation: getNextOrientation(prev?.orientation),
    }));
  };

  const insets = useScreenInsets();

  const coverHeight =
    windowHeight -
    insets.top -
    insets.bottom -
    HEADER_HEIGHT -
    180 -
    (StatusBar.currentHeight ?? 0);

  const appearance = useColorScheme();

  if (!media) {
    return null;
  }

  return (
    <ScreenModal visible={visible} animationType="slide">
      <Container
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <Header
          middleElement={intl.formatMessage({
            defaultMessage: 'Crop your image',
            description: 'Cover editor crop image modal title',
          })}
          rightElement={<RotateButton onPress={onNextOrientation} />}
          style={{ marginBottom: 20 }}
        />
        <Cropper
          mediaSize={media}
          aspectRatio={COVER_RATIO}
          cropData={editionParameters?.cropData}
          orientation={editionParameters?.orientation}
          pitch={editionParameters?.pitch}
          yaw={editionParameters?.yaw}
          roll={editionParameters?.roll}
          cropEditionMode
          onCropDataChange={onCropDataChange}
          displayOuterLines={false}
          style={[
            {
              height: coverHeight,
              alignSelf: 'center',
              aspectRatio: COVER_RATIO,
              borderRadius: COVER_CARD_RADIUS * COVER_RATIO * coverHeight,
            },
            shadow(appearance ?? 'light'),
          ]}
        >
          {cropData => (
            <CoverPreviewRenderer
              uri={media.uri}
              kind={media.kind}
              startTime={timeRange?.startTime}
              duration={timeRange?.duration}
              backgroundColor={coverStyle?.backgroundColor}
              maskUri={maskMedia?.uri}
              backgroundId={coverStyle?.background?.id}
              backgroundImageUri={coverStyle?.background?.uri}
              backgroundImageTintColor={coverStyle?.backgroundPatternColor}
              foregroundId={coverStyle?.foreground?.id}
              foregroundImageUri={coverStyle?.foreground?.uri}
              foregroundImageTintColor={coverStyle?.foregroundColor}
              editionParameters={{
                ...coverStyle?.mediaParameters,
                ...editionParameters,
                cropData,
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
              width={coverHeight * COVER_RATIO}
              style={{ flex: 1, shadowOpacity: 0 }}
            />
          )}
        </Cropper>
        <View style={{ flex: 1 }}>
          <ImageEditionParameterControl
            label={intl.formatMessage({
              defaultMessage: 'rotate:',
              description: 'Cover editor roll parameter label',
            })}
            labelSuffix="°"
            value={editionParameters?.roll ?? 0}
            parameter="roll"
            onChange={onRollChange}
            style={{ flex: 1 }}
          />
          <ImageEditionFooter onSave={onSaveInner} onCancel={onClose} />
        </View>
      </Container>
    </ScreenModal>
  );
};

export default CoverEditorCropModal;
