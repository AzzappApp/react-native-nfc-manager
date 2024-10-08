import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PixelRatio,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { type GestureType } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import CoverRenderer from '#components/CoverRenderer';
import { keyExtractor } from '#helpers/idHelpers';
import useAuthState from '#hooks/useAuthState';
import CarouselSelectList from '#ui/CarouselSelectList';
import type {
  AddContactModalProfiles_user$data,
  AddContactModalProfiles_user$key,
} from '#relayArtifacts/AddContactModalProfiles_user.graphql';
import type { CarouselSelectListHandle } from '#ui/CarouselSelectList';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { LayoutChangeEvent, ListRenderItemInfo } from 'react-native';

type Props = {
  user: AddContactModalProfiles_user$key;
  onSelectProfile: (profileId: string) => void;
  nativeGesture?: GestureType;
};

const AddContactModalProfiles = ({
  user: userKey,
  onSelectProfile,
  nativeGesture,
}: Props) => {
  const { profileInfos } = useAuthState();

  const { profiles } = useFragment(
    graphql`
      fragment AddContactModalProfiles_user on User {
        profiles {
          invited
          id
          webCard {
            id
            ...CoverRenderer_webCard
          }
        }
      }
    `,
    userKey,
  );

  const data = useMemo(
    () => (profiles ? [...profiles].filter(profile => !profile.invited) : []),
    [profiles],
  );

  const initialProfileIndex = useMemo(() => {
    return Math.max(
      data.findIndex(profile => profile.id === profileInfos?.profileId),
      0,
    );
  }, [profileInfos?.profileId, data]);

  const currentIndexSharedValue = useSharedValue(initialProfileIndex);

  const [coverWidth, setCoverWidth] = useState(0);
  const carouselRef = useRef<CarouselSelectListHandle | null>(null);

  const { width } = useWindowDimensions();

  const onLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      setCoverWidth(
        Math.min(
          width / 2,
          Math.trunc(
            PixelRatio.roundToNearestPixel(layout.height * COVER_RATIO),
          ),
        ),
      );
    },
    [width],
  );

  const coverHeight = useMemo(() => coverWidth / COVER_RATIO, [coverWidth]);

  const onSelectedIndexChange = useCallback(
    (index: number) => {
      if (data[index]) {
        onSelectProfile(data[index].id);
      }
    },
    [data, onSelectProfile],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ProfileType | null>) => {
      if (!item?.webCard) return null;

      return (
        <CoverRenderer webCard={item.webCard} width={120} canPlay={false} />
      );
    },
    [],
  );

  useEffect(() => {
    onSelectedIndexChange(initialProfileIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container} onLayout={onLayout}>
      {coverWidth > 0 && (
        <CarouselSelectList
          ref={carouselRef}
          nativeGesture={nativeGesture}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          width={width}
          height={coverHeight}
          itemWidth={coverWidth}
          scaleRatio={SCALE_RATIO}
          style={styles.carousel}
          itemContainerStyle={styles.carouselContentContainer}
          onSelectedIndexChange={onSelectedIndexChange}
          currentProfileIndexSharedValue={currentIndexSharedValue}
          initialScrollIndex={initialProfileIndex}
        />
      )}
    </View>
  );
};

type ProfileType = ArrayItemType<AddContactModalProfiles_user$data['profiles']>;

const SCALE_RATIO = 108 / 291;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carousel: {
    flexGrow: 0,
    overflow: 'visible',
    alignSelf: 'center',
  },
  carouselContentContainer: {
    flexGrow: 0,
    overflow: 'visible',
  },
});

export default AddContactModalProfiles;
