import { identity } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import {
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  COVER_ANIMATION_DURATION,
  COVER_CARD_RADIUS,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import BoxSelectionList from '#components/BoxSelectionList';
import MediaAnimator, {
  MEDIA_ANIMATIONS,
} from '#components/CoverRenderer/MediaAnimator';
import FilterSelectionList from '#components/FilterSelectionList';
import {
  GPUImageView,
  type EditionParameters,
  getFilterUri,
} from '#components/gpu';
import ImageEditionParametersList from '#components/ImageEditionParametersList';
import TabsBar from '#ui/TabsBar';
import TabView from '#ui/TabView';
import type { BoxButtonItemInfo } from '#components/BoxSelectionList';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type CECImageEditionPanelProps = {
  /**
   * Source Media to Override the Source Media of the template
   */
  uri?: string | null;
  /**
   * The source media type
   */
  kind?: 'image' | 'video' | 'videoFrame';
  /**
   * if the source media is a videoFrame, the time of the frame to display
   */
  time?: number | null;
  filter: string | null;
  editionParameters: EditionParameters;
  mediaAnimation: string | null;
  onFilterChange(filter: string): void;
  onStartParameterEdition(parameter: string): void;
  onMediaAnimationChange(animation: string | null): void;
  style?: StyleProp<ViewStyle>;
};

const CECImageEditionPanel = ({
  uri,
  kind,
  time,
  filter,
  editionParameters,
  mediaAnimation,
  onFilterChange,
  onStartParameterEdition,
  onMediaAnimationChange,
  style,
}: CECImageEditionPanelProps) => {
  const [currentTab, setCurrentTab] = useState<'edit' | 'filter'>('filter');

  const onTabPress = (tab: string) => {
    setCurrentTab(tab as 'edit' | 'filter');
  };

  const intl = useIntl();

  const animationSharedValue = useSharedValue(0);
  useEffect(() => {
    animationSharedValue.value = withRepeat(
      withTiming(1, {
        duration: COVER_ANIMATION_DURATION,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [animationSharedValue]);

  const renderAnimationSample = useCallback(
    ({ item, height }: BoxButtonItemInfo<string>) => {
      return (
        <AnimationSample
          animation={item}
          uri={uri}
          kind={kind}
          time={time}
          filter={filter}
          editionParameters={editionParameters}
          height={height}
          animationSharedValue={animationSharedValue}
        />
      );
    },
    [uri, kind, time, filter, editionParameters, animationSharedValue],
  );

  if (!uri) {
    return null;
  }

  return (
    <View style={style}>
      <TabsBar
        currentTab={currentTab}
        onTabPress={onTabPress}
        decoration="underline"
        tabs={[
          {
            tabKey: 'filter',
            label: intl.formatMessage({
              defaultMessage: 'Effect',
              description: 'Label of the effect tab in cover edition',
            }),
          },
          {
            tabKey: 'edit',
            label: intl.formatMessage({
              defaultMessage: 'Adjust',
              description: 'Label of the adjust tab in cover edition',
            }),
          },
          {
            tabKey: 'animation',
            label: intl.formatMessage({
              defaultMessage: 'Animation',
              description: 'Label of the animation tab in cover edition',
            }),
          },
        ]}
      />
      <TabView
        style={{ flex: 1 }}
        currentTab={currentTab}
        tabs={[
          {
            id: 'filter',
            element: (
              <FilterSelectionList
                layer={{
                  kind: kind === 'video' ? 'videoFrame' : 'image',
                  uri,
                  time,
                  parameters: editionParameters,
                }}
                aspectRatio={COVER_RATIO}
                selectedFilter={filter}
                onChange={onFilterChange}
                style={styles.filterSelectionList}
                cardRadius={COVER_CARD_RADIUS}
              />
            ),
          },
          {
            id: 'edit',
            element: (
              <View style={styles.imageEditionParametersListContainer}>
                <ImageEditionParametersList
                  style={{ flexGrow: 0 }}
                  onSelectParam={onStartParameterEdition}
                  excludedParams={['cropData']}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            ),
          },
          {
            id: 'animation',
            element: (
              <BoxSelectionList
                data={MEDIA_ANIMATIONS}
                renderItem={renderAnimationSample}
                keyExtractor={identity}
                accessibilityRole="list"
                onSelect={onMediaAnimationChange}
                selectedItem={mediaAnimation ?? null}
                style={styles.animationList}
              />
            ),
          },
        ]}
      />
    </View>
  );
};

export default CECImageEditionPanel;

type AnimationSampleProps = {
  /**
   * Source Media to Override the Source Media of the template
   */
  uri?: string | null;
  /**
   * The source media type
   */
  kind?: 'image' | 'video' | 'videoFrame';
  /**
   * if the source media is a videoFrame, the time of the frame to display
   */
  time?: number | null;
  filter: string | null;
  editionParameters: EditionParameters;
  animation: string | null;
  height: number;
  animationSharedValue: SharedValue<number>;
};

const AnimationSample = ({
  uri,
  kind,
  time,
  filter,
  editionParameters,
  animation,
  height,
  animationSharedValue,
}: AnimationSampleProps) => {
  if (!uri || !kind) {
    return null;
  }

  return (
    <MediaAnimator
      animationSharedValue={animationSharedValue}
      animation={animation}
      width={height * COVER_RATIO}
      height={height}
      style={{ height, aspectRatio: COVER_RATIO }}
    >
      <GPUImageView
        style={[{ height, aspectRatio: COVER_RATIO }]}
        layers={[
          {
            kind,
            uri,
            time,
            parameters: editionParameters,
            lutFilterUri: getFilterUri(filter),
          },
        ]}
      />
    </MediaAnimator>
  );
};

const styles = StyleSheet.create({
  filterSelectionList: {
    flex: 1,
    maxHeight: 300,
    marginTop: 20,
  },
  filterSelectionListContentContainer: {
    paddingHorizontal: 20,
  },
  imageEditionParametersListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  animationList: {
    marginVertical: 15,
  },
});
