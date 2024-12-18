import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import CoverRenderer from '#components/CoverRenderer';
import { keyExtractor } from '#helpers/idHelpers';
import { useProfileInfos } from '#hooks/authStateHooks';
import CarouselSelectList from '#ui/CarouselSelectList';
import type {
  AddContactModalProfiles_user$data,
  AddContactModalProfiles_user$key,
} from '#relayArtifacts/AddContactModalProfiles_user.graphql';
import type { CarouselSelectListHandle } from '#ui/CarouselSelectList';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo } from 'react-native';

type Props = {
  user: AddContactModalProfiles_user$key;
  onSelectProfile: (profileId: string) => void;
};

const COVER_HEIGHT = 192;
const COVER_WIDTH = COVER_HEIGHT * COVER_RATIO;

const AddContactModalProfiles = ({ user: userKey, onSelectProfile }: Props) => {
  const profileInfos = useProfileInfos();

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

  useEffect(() => {
    onSelectedIndexChange(initialProfileIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CarouselSelectList<(typeof data)[number]>
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

type ProfileType = ArrayItemType<AddContactModalProfiles_user$data['profiles']>;

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
});

export default AddContactModalProfiles;
