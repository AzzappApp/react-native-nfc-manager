import { Image } from 'expo-image';
import { memo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { FlatList, Pressable, View } from 'react-native';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import { colors, shadow } from '#theme';
import { DoneHeaderButton } from '#components/commonsButtons';
import { useAnimationLabel } from '#components/CoverRenderer/MediaAnimator';
import { useFilterLabels } from '#components/gpu';
import {
  createVariantsStyleSheet,
  useVariantStyleSheet,
} from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import Text from '#ui/Text';
import ToolBoxSection from '#ui/ToolBoxSection';
import { CoverEditorActionType } from '../coverEditorActions';
import {
  useCoverEditorOverlayLayer,
  useCoverEditorContext,
} from '../CoverEditorContext';
import type { ListRenderItemInfo } from 'react-native';

const CoverEditorEffectTool = () => {
  const filters = typedEntries(useFilterLabels());
  const { bottom } = useScreenInsets();
  const [show, toggleBottomSheet] = useToggle(false);
  const layer = useCoverEditorOverlayLayer(); //use directly the layer for now, only one animated
  const { dispatch } = useCoverEditorContext();

  const save = useCallback(
    () => (filter: string) => {
      dispatch({
        type: CoverEditorActionType.UpdateOverlayLayer,
        payload: { filter },
      });
      toggleBottomSheet();
    },
    [dispatch, toggleBottomSheet],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<string>) => {
      return (
        <FilterOverlay
          animation={item}
          uri={layer!.uri}
          filter={layer!.filter}
          size={0} //  animationSharedValue={animationSharedValue}
          selected={layer!.filter === item}
          select={save}
        />
      );
    },
    [layer, save],
  );
  const intl = useIntl();

  return (
    <>
      <ToolBoxSection
        icon="filters"
        label={intl.formatMessage({
          defaultMessage: 'Effects',
          description: 'Cover Edition Overlay Tool Button- Effect',
        })}
        onPress={toggleBottomSheet}
      />
      {layer != null && (
        <BottomSheetModal
          onRequestClose={toggleBottomSheet}
          visible={show}
          height={bottom + 271}
          headerTitle={
            <Text variant="large">
              <FormattedMessage
                defaultMessage="Effects(TODO DEFINE LIST FOR SKIA)"
                description="CoverEditor Effects Tool - Title"
              />
            </Text>
          }
          headerRightButton={<DoneHeaderButton onPress={toggleBottomSheet} />}
        >
          <View style={{ rowGap: 10, overflow: 'visible', marginTop: 25 }}>
            <FlatList
              //@ts-expect-error waiting for filter spec
              data={['none', ...filters]}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              getItemLayout={getItemLayout}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ overflow: 'visible' }}
            />
          </View>
        </BottomSheetModal>
      )}
    </>
  );
};

const ITEM_WIDTH = 80;
const BORDER_SELECTED = 5;

const getItemLayout = (_: any, index: number) => ({
  length: ITEM_WIDTH,
  offset: ITEM_WIDTH * index,
  index,
});

const keyExtractor = (item: string) => item;

export default memo(CoverEditorEffectTool);

type AnimationSampleProps = {
  /**
   * Source Media to Override the Source Media of the template
   */
  uri: string;

  filter: string | null;

  animation: string;
  size: number;
  selected: boolean;
  select: (animation: string) => void;
  // animationSharedValue: SharedValue<number>;
};

const InnerItem = ({
  uri,
  animation,
  selected,
  select,
}: AnimationSampleProps) => {
  //did not want to make inline style with conditional border color - so use variant
  const styles = useVariantStyleSheet(
    styleSheet,
    selected ? 'selected' : 'unselected',
  );
  const label = useAnimationLabel(animation);

  const onPress = useCallback(() => {
    select(animation);
  }, [animation, select]);

  return (
    <Pressable style={styles.itemContainer} onPress={onPress}>
      <View style={styles.itemPreview}>
        <Image
          style={{ width: ITEM_WIDTH, aspectRatio: 1, borderRadius: 7 }}
          source={{ uri }}
        />
      </View>
      <Text
        variant="small"
        numberOfLines={1}
        adjustsFontSizeToFit
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </Pressable>
  );

  // return (
  //   <MediaAnimator
  //     animationSharedValue={animationSharedValue}
  //     animation={animation}
  //     width={height}
  //     height={height}
  //     style={{ height, aspectRatio: 1 }}
  //   >
  //     <GPUImageView
  //       style={[{ height, aspectRatio: 1 }]}
  //       layers={[
  //         {
  //           kind: 'image',
  //           uri,
  //           time,
  //           parameters: editionParameters,
  //           lutFilterUri: getFilterUri(filter),
  //         },
  //       ]}
  //     />
  //   </MediaAnimator>
  // );
};
const FilterOverlay = memo(InnerItem);

const styleSheet = createVariantsStyleSheet(appearance => ({
  default: {
    itemContainer: {
      width: ITEM_WIDTH + 2 * BORDER_SELECTED,
      marginHorizontal: 10 - BORDER_SELECTED,
      height: 105 + 2 * BORDER_SELECTED,
      justifyContent: 'center',
      alignItems: 'center',
      rowGap: 10,
    },
    itemPreview: {
      width: ITEM_WIDTH,
      aspectRatio: 1,
      backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
      borderRadius: 12,
      borderColor: 'transparent',
      borderWidth: 0,
      overflow: 'hidden',
      ...shadow(appearance, 'bottom'),
    },
  },
  selected: {
    itemPreview: {
      borderWidth: BORDER_SELECTED,
      borderColor: appearance === 'light' ? colors.black : colors.white,
    },
  },
  //need a default second step,
  unselected: {},
}));
