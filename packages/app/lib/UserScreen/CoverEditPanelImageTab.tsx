import range from 'lodash/range';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamilies, textStyles } from '../../theme';
import { MediaImageRenderer } from '../components/MediaRenderer';
import DashedSlider from '../ui/DashedSlider';
import Icon from '../ui/Icon';
import VideoThumbnail from '../ui/VideoThumbnail';
import type { MediaKind } from '@azzapp/relay/artifacts/CoverEditPanel_cover.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type CoverEditPanelImageTabProps = {
  pictures: ReadonlyArray<
    Readonly<{ uri?: string; source: string; kind: MediaKind }>
  >;
  timer: number;
  imageIndex: number | undefined;
  onSelectPicture: (index: number | undefined) => void;
  onRemovePicture: () => void;
  onUpdatePicture: () => void;
  onUpdatTimer: (timer: number) => void;
  style?: StyleProp<ViewStyle>;
};

const CoverEditPanelImageTab = ({
  pictures,
  imageIndex,
  timer,
  onSelectPicture,
  onRemovePicture,
  onUpdatePicture,
  onUpdatTimer,
  style,
}: CoverEditPanelImageTabProps) => {
  const currentPicture =
    pictures && imageIndex !== undefined ? pictures[imageIndex] : undefined;

  const onPictureSelect = (index: number) => {
    onSelectPicture(index);
  };

  const onSelectTimer = () => {
    onSelectPicture(undefined);
  };

  return (
    <View style={style}>
      <View style={{ flex: 1 }}>
        {imageIndex === undefined ? (
          pictures.length > 1 ? (
            <View style={styles.sliderContainer}>
              <Text
                style={{
                  ...fontFamilies.normal,
                  fontSize: 48,
                  marginBottom: 12,
                  alignSelf: 'center',
                }}
              >
                {' '}
                {timer}’
              </Text>
              <DashedSlider
                value={timer}
                max={30}
                min={1}
                step={0.25}
                onChange={onUpdatTimer}
              />
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )
        ) : (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            {currentPicture ? (
              <>
                <Pressable onPress={onRemovePicture}>
                  <Text style={textStyles.button}>Remove</Text>
                </Pressable>
                <Pressable onPress={onUpdatePicture}>
                  <Text style={textStyles.button}>Update</Text>
                </Pressable>
              </>
            ) : (
              <Text>Add a photo or video to your cover</Text>
            )}
          </View>
        )}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
        }}
      >
        {range(0, 4).map(index => (
          <View
            key={index}
            style={[
              styles.buttonContainer,
              index === imageIndex &&
                !!currentPicture &&
                styles.buttonContainerSelected,
            ]}
          >
            <Pressable
              onPress={() => onPictureSelect(index)}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
            >
              {({ pressed }) =>
                pictures?.[index] ? (
                  pictures[index].kind === 'video' ? (
                    <VideoThumbnail
                      style={[styles.image, pressed && styles.imagePressed]}
                      {...pictures[index]}
                    />
                  ) : (
                    <MediaImageRenderer
                      style={[styles.image, pressed && styles.imagePressed]}
                      {...pictures[index]}
                      width={50}
                      aspectRatio={1}
                    />
                  )
                ) : (
                  <Icon
                    icon="plus"
                    style={[styles.plusIcon, pressed && styles.plusIconPressed]}
                  />
                )
              }
            </Pressable>
          </View>
        ))}
        <View style={styles.buttonContainer}>
          {pictures.length > 1 && (
            <Pressable onPress={onSelectTimer} hitSlop={10}>
              {({ pressed }) => (
                <Icon
                  icon="timer"
                  style={[
                    styles.timerIcon,
                    pressed && styles.timerIconPressed,
                    imageIndex === undefined && styles.timerIconSelected,
                  ]}
                />
              )}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

export default CoverEditPanelImageTab;

const styles = StyleSheet.create({
  sliderContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonContainerSelected: {
    borderColor: colors.dark,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: colors.lightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    backgroundColor: colors.grey,
  },
  plusIcon: {
    width: 14,
    height: 14,
    tintColor: colors.grey,
  },
  plusIconPressed: {
    width: 14,
    height: 14,
    tintColor: colors.dark,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  imagePressed: {
    width: 50,
    height: 50,
    borderRadius: 10,
    opacity: 0.8,
  },
  timerIcon: {
    width: 25,
    tintColor: colors.grey,
  },
  timerIconPressed: {
    opacity: 0.8,
  },
  timerIconSelected: {
    tintColor: colors.dark,
  },
});
