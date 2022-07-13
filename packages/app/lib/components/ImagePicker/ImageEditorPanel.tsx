import range from 'lodash/range';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, textStyles } from '../../../theme';
import DashedSlider from '../DashedSlider';
import Icon from '../Icon';
import IconButton from '../IconButton';
import EditableImage from './EditableImage';
import type { Icons } from '../Icon';
import type { ImageEditionParameters } from './EditableImage';
import type { MediaInfo, TimeRange } from './helpers';
import type { ViewProps, ListRenderItemInfo } from 'react-native';

type ParamUpdateHandler = <T extends keyof ImageEditionParameters>(
  parameter: T,
  value: ImageEditionParameters[T],
) => void;

type ImageEditorPanelProps = ViewProps & {
  mediaInfo: MediaInfo;
  timeRange?: TimeRange | null;
  aspectRatio: number;
  parameters: ImageEditionParameters;
  currentFilter: string | null;
  currentEditedParams: keyof ImageEditionParameters | null;
  onTimeRangeChange: (setTimeRange: TimeRange) => void;
  onFilterChange: (filter: string | null) => void;
  onStartEditing: (param: keyof ImageEditionParameters) => void;
  onSave: () => void;
  onCancel: () => void;
  onParamChange: ParamUpdateHandler;
};

const ImageEditorPanel = ({
  mediaInfo,
  aspectRatio,
  currentFilter,
  parameters,
  currentEditedParams,
  timeRange,
  onFilterChange,
  onStartEditing,
  onSave,
  onCancel,
  onParamChange,
  onTimeRangeChange,
  style,
  ...props
}: ImageEditorPanelProps) => {
  const [currentTab, setCurrentTab] = useState<'edit' | 'filter'>('filter');

  const selectedParams = editors.find(
    ({ param }) => param === currentEditedParams,
  );

  const currentEditedParamsEditor = editors.find(
    ({ param }) => param === currentEditedParams,
  );

  return (
    <View style={style} {...props}>
      <View style={styles.tabContainer}>
        {currentEditedParams == null ? (
          tabs.map(({ label, tab }) => (
            <Pressable
              key={tab}
              onPress={() => setCurrentTab(tab)}
              style={({ pressed }) => pressed && { opacity: 0.8 }}
            >
              <Text
                style={[
                  textStyles.title,
                  currentTab === tab ? styles.tabSelected : styles.tab,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={textStyles.title}>
            {currentEditedParamsEditor?.label}
          </Text>
        )}
      </View>
      <View style={styles.content}>
        {currentTab === 'filter' && (
          <ScrollView
            horizontal
            contentContainerStyle={styles.filterContainer}
            showsHorizontalScrollIndicator={false}
          >
            {filters.map(({ filter, label }) => (
              <Pressable
                key={filter}
                style={({ pressed }) => [
                  styles.filterButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() =>
                  onFilterChange(currentFilter === filter ? null : filter)
                }
              >
                <View
                  style={[
                    styles.filterImageContainer,
                    currentFilter === filter &&
                      styles.filerImageContainerSelected,
                  ]}
                >
                  <EditableImage
                    source={mediaInfo}
                    editionParameters={parameters}
                    filters={[filter]}
                    style={[
                      styles.filterImage,
                      { aspectRatio },
                      currentFilter === filter && { borderColor: colors.blue },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    textStyles.button,
                    { alignSelf: 'center', marginTop: 10 },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        {currentTab === 'edit' && (
          <>
            {selectedParams == null ? (
              <ScrollView
                horizontal
                contentContainerStyle={styles.parametersList}
              >
                {editors.map(({ param, icon, label }) => (
                  <Pressable
                    key={param}
                    onPress={() => onStartEditing(param)}
                    style={({ pressed }) => [
                      styles.paramsButton,
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <View style={styles.paramIconContainer}>
                      <Icon icon={icon} style={styles.paramIcon} />
                    </View>
                    <Text style={textStyles.button}>{label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : selectedParams.kind === 'slider' ? (
              <DashedSlider
                value={
                  (parameters[selectedParams?.param] ??
                    selectedParams?.defaultValue) as number
                }
                min={selectedParams.min}
                max={selectedParams.max}
                step={selectedParams.step}
                interval={selectedParams.interval}
                onChange={value => onParamChange(selectedParams.param, value)}
              />
            ) : selectedParams.param === 'cropData' ? (
              mediaInfo?.kind === 'picture' ? (
                <PerspectiveEditor
                  parameters={parameters}
                  onParamChange={onParamChange}
                />
              ) : (
                <VideoCutEditor
                  mediaInfo={mediaInfo}
                  timeRange={timeRange}
                  aspectRatio={aspectRatio}
                  parameters={parameters}
                  onChange={onTimeRangeChange}
                />
              )
            ) : null}
          </>
        )}
      </View>
      <View style={styles.footer}>
        {currentEditedParams != null && (
          <>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => pressed && { opacity: 0.8 }}
            >
              <Text style={textStyles.button}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              style={({ pressed }) => pressed && { opacity: 0.8 }}
            >
              <Text style={textStyles.button}>Ok</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
};

export default ImageEditorPanel;

const PerspectiveEditor = ({
  parameters,
  onParamChange,
}: {
  parameters: ImageEditionParameters;
  onParamChange: ParamUpdateHandler;
}) => {
  const [currentParam, setCurrentParam] = useState<'pitch' | 'roll' | 'yaw'>(
    'roll',
  );
  return (
    <>
      <View style={styles.perspectiveEditorTabContainer}>
        <IconButton
          icon="brightness"
          iconSize={20}
          iconStyle={[
            styles.perspectiveIcon,
            currentParam === 'yaw' && styles.perspectiveIconSelected,
          ]}
          onPress={() => setCurrentParam('yaw')}
        />
        <IconButton
          icon="contrast"
          iconSize={20}
          iconStyle={[
            styles.perspectiveIcon,
            currentParam === 'roll' && styles.perspectiveIconSelected,
          ]}
          onPress={() => setCurrentParam('roll')}
        />
        <IconButton
          icon="flip"
          iconSize={20}
          iconStyle={[
            styles.perspectiveIcon,
            currentParam === 'pitch' && styles.perspectiveIconSelected,
          ]}
          onPress={() => setCurrentParam('pitch')}
        />
      </View>
      <DashedSlider
        value={-(parameters[currentParam] ?? 0)}
        min={currentParam === 'roll' ? -20 : -10}
        max={currentParam === 'roll' ? 20 : 10}
        step={2}
        interval={10}
        onChange={value => onParamChange(currentParam, -value)}
      />
    </>
  );
};

const VIDEO_THUMBNAIL_HEIGHT = 100;

const VideoCutEditor = ({
  mediaInfo,
  aspectRatio,
  parameters,
  timeRange,
  onChange,
}: {
  mediaInfo: MediaInfo;
  aspectRatio: number;
  parameters: ImageEditionParameters;
  timeRange?: TimeRange | null;
  onChange: (timeRange: TimeRange) => void;
}) => {
  const data = useMemo(() => {
    return range(0, Math.floor(mediaInfo.playableDuration));
  }, [mediaInfo.playableDuration]);

  const itemWidth = useMemo(
    () => VIDEO_THUMBNAIL_HEIGHT * aspectRatio,
    [aspectRatio],
  );

  const keyExtractor = useCallback((item: number) => `${item}`, []);
  const renderItem = useCallback(
    ({ item: second }: ListRenderItemInfo<number>) => {
      const { startTime, duration } = timeRange ?? {
        startTime: -1,
        duration: 0,
      };
      const isSelected = second >= startTime && second < startTime + duration;
      const isStart = second === startTime;
      const isEnd = second === Math.floor(startTime + duration) - 1;

      const onItemSelect = () => {
        if (isStart) {
          onChange({ startTime: startTime + 1, duration: duration - 1 });
        } else if (isEnd) {
          onChange({ startTime, duration: duration - 1 });
        }
        if (isSelected) {
          if (second - startTime < startTime + duration - second) {
            onChange({
              startTime: second,
              duration: startTime + duration - second,
            });
          } else {
            onChange({
              startTime,
              duration: second - startTime + 1,
            });
          }
        } else if (second < startTime) {
          onChange({
            startTime: second,
            duration: duration + startTime - second,
          });
        } else {
          onChange({
            startTime,
            duration: second - startTime + 1,
          });
        }
      };

      return (
        <Pressable
          style={pressed => [
            { height: VIDEO_THUMBNAIL_HEIGHT, width: itemWidth },
            isSelected && {
              borderColor: colors.blue,
              borderTopWidth: 2,
              borderBottomWidth: 2,
            },
            isStart && { borderLeftWidth: 2 },
            isEnd && { borderRightWidth: 2 },
            pressed && { opacity: 0.8 },
          ]}
          onPress={onItemSelect}
        >
          <EditableImage
            source={{ uri: mediaInfo.uri, kind: 'video', videoTime: second }}
            editionParameters={parameters}
            style={{ flex: 1 }}
          />
        </Pressable>
      );
    },
    [itemWidth, mediaInfo.uri, onChange, parameters, timeRange],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: itemWidth,
      offset: itemWidth * index,
      index,
    }),
    [itemWidth],
  );
  return (
    <View style={styles.videoEditorContainer}>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.videoEditorList}
        contentContainerStyle={styles.videoEditorListContainer}
      />
    </View>
  );
};

const tabs = [
  { label: 'Filters', tab: 'filter' },
  { label: 'Edit', tab: 'edit' },
] as const;

const filters = [
  { filter: 'chrome', label: 'Chrome' },
  { filter: 'fade', label: 'Fade' },
  { filter: 'instant', label: 'Instant' },
  { filter: 'noir', label: 'Noir' },
  { filter: 'process', label: 'Process' },
  { filter: 'tonal', label: 'Tonal' },
  { filter: 'transfer', label: 'Transfer' },
  { filter: 'sepia', label: 'Sepia' },
  { filter: 'thermal', label: 'Thermal' },
  { filter: 'xray', label: 'X-ray' },
];

type ParamEditor = {
  param: keyof ImageEditionParameters;
  icon: Icons;
  label: string;
} & (
  | {
      param: keyof ImageEditionParameters;
      label: string;
      kind: 'slider';
      defaultValue: number;
      min: number;
      max: number;
      step: number;
      interval: number;
    }
  | { kind?: never }
);

const editors: ParamEditor[] = [
  {
    param: 'cropData',
    label: 'Adjust',
    icon: 'contrast',
  },
  {
    param: 'brightness',
    label: 'Brightness',
    icon: 'brightness',
    kind: 'slider',
    defaultValue: 0,
    min: -0.5,
    max: 0.5,
    step: 0.025,
    interval: 10,
  },
  {
    param: 'contrast',
    label: 'Contrast',
    icon: 'contrast',
    kind: 'slider',
    defaultValue: 1,
    min: 0.5,
    max: 1.5,
    step: 0.025,
    interval: 10,
  },
  {
    param: 'highlights',
    label: 'Highlights',
    icon: 'brightness',
    kind: 'slider',
    defaultValue: 1,
    min: 0,
    max: 1,
    step: 0.05,
    interval: 10,
  },
  {
    param: 'saturation',
    label: 'Saturation',
    icon: 'saturation',
    kind: 'slider',
    defaultValue: 1,
    min: 0,
    max: 2,
    step: 0.05,
    interval: 10,
  },
  {
    param: 'shadow',
    label: 'Shadow',
    icon: 'contrast',
    kind: 'slider',
    defaultValue: 0,
    min: 0,
    max: 1,
    step: 0.05,
    interval: 10,
  },
  {
    param: 'sharpness',
    label: 'Contrast',
    icon: 'contrast',
    kind: 'slider',
    defaultValue: 0,
    min: -2,
    max: 2,
    step: 0.05,
    interval: 10,
  },
  {
    param: 'structure',
    label: 'Structure',
    icon: 'contrast',
    kind: 'slider',
    defaultValue: 0,
    min: -2,
    max: 2,
    step: 0.05,
    interval: 10,
  },
  {
    param: 'temperature',
    label: 'Temperature',
    icon: 'temperature',
    kind: 'slider',
    defaultValue: 6500,
    min: 3500,
    max: 12500,
    step: 50,
    interval: 10,
  },
  {
    param: 'tint',
    label: 'Tint',
    icon: 'brightness',
    kind: 'slider',
    defaultValue: 0,
    min: -150,
    max: 150,
    step: 5,
    interval: 10,
  },
  {
    param: 'vibrance',
    label: 'Vibrance',
    icon: 'vigneting',
    kind: 'slider',
    defaultValue: 0,
    min: -1,
    max: 1,
    step: 0.05,
    interval: 10,
  },
  {
    param: 'vigneting',
    label: 'Vigneting',
    icon: 'vigneting',
    kind: 'slider',
    defaultValue: 0,
    min: -2,
    max: 2,
    step: 0.05,
    interval: 10,
  },
];

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: '10%',
  },
  tab: {
    color: colors.grey,
  },
  tabSelected: {
    color: colors.dark,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  filterContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  filterButton: {
    marginHorizontal: 5,
    maxHeight: 150,
  },
  filterImageContainer: {
    flex: 1,
    borderColor: 'transparent',
    borderWidth: 2,
  },
  filerImageContainerSelected: {
    borderColor: colors.blue,
  },
  filterImage: {
    width: '100%',
    height: '100%',
    marginBottom: 10,
  },
  parametersList: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  paramsButton: {
    width: 100,
    alignItems: 'center',
  },
  paramIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.darkGrey,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paramIcon: {
    width: 20,
    height: 20,
    tintColor: colors.darkGrey,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: '10%',
    marginBottom: 20,
  },
  perspectiveEditorTabContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: '10%',
  },
  perspectiveIcon: {
    tintColor: colors.grey,
  },
  perspectiveIconSelected: {
    tintColor: colors.darkGrey,
  },
  videoEditorContainer: {
    flex: 1,
  },
  videoEditorList: {
    position: 'absolute',
    top: 0,
    right: 20,
    left: 20,
    height: '100%',
  },
  videoEditorListContainer: {
    alignItems: 'center',
  },
});
