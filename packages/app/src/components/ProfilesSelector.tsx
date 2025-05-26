import { useCallback, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import CoverRenderer from '#components/CoverRenderer';
import Skeleton from '#components/Skeleton';
import { keyExtractor } from '#helpers/idHelpers';
import { useProfileInfos } from '#hooks/authStateHooks';
import useEffectOnce from '#hooks/useEffectOnce';
import CarouselSelectList from '#ui/CarouselSelectList';
import type {
  ProfilesSelector_profiles$data,
  ProfilesSelector_profiles$key,
} from '#relayArtifacts/ProfilesSelector_profiles.graphql';
import type { CarouselSelectListHandle } from '#ui/CarouselSelectList';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo } from 'react-native';

type Props = {
  onSelectProfile: (profileId: string) => void;
  profiles: ProfilesSelector_profiles$key | null;
};

const COVER_HEIGHT = 192;
const COVER_WIDTH = COVER_HEIGHT * COVER_RATIO;

const ProfilesSelector = ({
  onSelectProfile,
  profiles: profilesKey,
}: Props) => {
  const profileInfos = useProfileInfos();

  const profiles = useFragment(
    graphql`
      fragment ProfilesSelector_profiles on Profile @relay(plural: true) {
        id
        invited
        webCard {
          id
          ...CoverRenderer_webCard
        }
      }
    `,
    profilesKey,
  );

  const data = useMemo(
    () => (profiles ? profiles.filter(profile => !profile.invited) : []),
    [profiles],
  );

  const initialProfileIndex = useMemo(() => {
    return Math.max(
      data.findIndex(profile => profile.id === profileInfos?.profileId),
      0,
    );
  }, [profileInfos?.profileId, data]);

  const currentIndexSharedValue = useSharedValue(initialProfileIndex);

  const carouselRef = useRef<CarouselSelectListHandle | null>(null);

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

  useEffectOnce(() => {
    onSelectedIndexChange(initialProfileIndex);
  });

  return (
    <CarouselSelectList
      ref={carouselRef}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      itemRatio={COVER_WIDTH / COVER_HEIGHT}
      scaleRatio={SCALE_RATIO}
      style={styles.carousel}
      itemContainerStyle={styles.carouselContentContainer}
      onSelectedIndexChange={onSelectedIndexChange}
      currentProfileIndexSharedValue={currentIndexSharedValue}
      initialScrollIndex={initialProfileIndex}
    />
  );
};
export default ProfilesSelector;

export const ProfilesSelectorFallback = () => {
  const renderItem = () => {
    return <Skeleton style={styles.coverSkeleton} />;
  };

  return (
    <CarouselSelectList
      data={['loading', 'loading', 'loading']}
      keyExtractor={(item, index) => index.toString()}
      renderItem={renderItem}
      itemRatio={COVER_RATIO}
      scaleRatio={SCALE_RATIO}
      style={styles.carousel}
      itemContainerStyle={styles.carouselContentContainer}
      initialScrollIndex={1}
    />
  );
};

type ProfileType = ArrayItemType<NonNullable<ProfilesSelector_profiles$data>>;

const SCALE_RATIO = 108 / 291;

const styles = StyleSheet.create({
  carousel: {
    alignSelf: 'center',
    width: '100%',
    height: COVER_HEIGHT,
    marginVertical: 15,
    maxWidth: COVER_WIDTH * 2.25,
    overflow: 'visible',
  },
  carouselContentContainer: {
    flexGrow: 0,
    overflow: 'visible',
  },
  coverSkeleton: {
    width: 120,
    height: 120 / COVER_RATIO,
    borderRadius: COVER_CARD_RADIUS * 120,
  },
});
