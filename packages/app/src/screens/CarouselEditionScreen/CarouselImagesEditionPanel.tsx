import { Image } from 'expo-image';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  CAROUSEL_MAX_IMAGE_HEIGHT,
  CAROUSEL_MIN_IMAGE_HEIGHT,
} from '@azzapp/shared/cardModuleHelpers';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import PressableNative from '#ui/PressableNative';
import TitleWithLine from '#ui/TitleWithLine';
import type { SharedValue } from 'react-native-reanimated';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type CarouselImagesEditionPanelProps = Omit<ViewProps, 'children'> & {
  /**
   * The images of the carousel.
   */
  images: ReadonlyArray<
    | {
        id: string;
        uri: string;
        aspectRatio: number;
      }
    | {
        local: true;
        uri: string;
        width: number;
        height: number;
      }
  >;
  /**
   * Whether the images should be displayed with a square ratio.
   */
  squareRatio: boolean;
  /**
   * The image height currently set on the module
   */
  imageHeight: SharedValue<number>;
  /**
   * Called when the user wants to add an image.
   */
  onAddImage: () => void;
  /**
   * Called when the user wants to remove an image.
   */
  onRemoveImage: (index: number) => void;
  /**
   * Called when the user wants to change the image ratio.
   */
  onSquareRatioChange: (value: boolean) => void;

  onTouched: () => void;
};

/**
 * A panel to edit the images of the carousel.
 */
const CarouselImagesEditionPanel = ({
  images,
  squareRatio,
  onAddImage,
  onRemoveImage,
  onSquareRatioChange,
  imageHeight,
  onTouched,
  style,
  ...props
}: CarouselImagesEditionPanelProps) => {
  const intl = useIntl();

  return (
    <View style={[styles.root, style]} {...props}>
      <TitleWithLine
        title={intl.formatMessage({
          defaultMessage: 'Images',
          description: 'Title of the images section in carousel edition',
        })}
      />
      <View style={styles.content}>
        <IconButton
          icon={squareRatio ? 'carrousel_square' : 'carrousel_original_ratio'}
          onPress={() => onSquareRatioChange(!squareRatio)}
          style={styles.squareRatioButton}
          accessibilityRole="togglebutton"
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Image ratio',
            description:
              'Accessibility label of the image ratio button in carousel edition',
          })}
          accessibilityState={{ checked: squareRatio }}
          accessibilityValue={{
            text: squareRatio
              ? intl.formatMessage({
                  defaultMessage: 'Square ratio',
                  description:
                    'Accessibility value of the image ratio button in carousel edition',
                })
              : intl.formatMessage({
                  defaultMessage: 'Original ratio',
                  description:
                    'Accessibility value of the image ratio button in carousel edition',
                }),
          }}
        />
        <ScrollView
          horizontal
          style={styles.imageList}
          contentContainerStyle={styles.imageListContainer}
          showsHorizontalScrollIndicator={false}
        >
          {images.map((image, index) => (
            <PressableNative
              key={image.uri}
              onPress={() => onRemoveImage(index)}
              style={styles.imageContainer}
            >
              <Image source={{ uri: image.uri }} style={styles.image} />
              <View style={styles.imageDeleteButton}>
                <Icon icon="close" />
              </View>
            </PressableNative>
          ))}

          <IconButton
            icon="add"
            onPress={onAddImage}
            style={images.length ? { marginLeft: 15 } : undefined}
          />
        </ScrollView>

        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Images height :"
              description="Images height label in carousel edition"
            />
          }
          value={imageHeight}
          min={CAROUSEL_MIN_IMAGE_HEIGHT}
          max={CAROUSEL_MAX_IMAGE_HEIGHT}
          step={5}
          onTouched={onTouched}
          style={styles.slider}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    gap: 15,
  },
  squareRatioButton: {
    alignSelf: 'center',
  },
  imageList: {
    height: 80,
  },
  imageListContainer: {
    gap: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  slider: {
    width: 200,
    alignSelf: 'center',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    height: '100%',
    width: '100%',
    objectFit: 'cover',
  },
  imageDeleteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    position: 'absolute',
    top: 19,
    right: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CarouselImagesEditionPanel;
