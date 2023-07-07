import { toGlobalId } from 'graphql-relay';
import { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, PixelRatio } from 'react-native';
import {
  fetchQuery,
  graphql,
  usePreloadedQuery,
  useRelayEnvironment,
} from 'react-relay';
import { Observable } from 'relay-runtime';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import { mainRoutes } from '#mobileRoutes';
import { prefetchImage } from '#components/medias';
import { useRouter } from '#components/NativeRouter';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import relayScreen from '#helpers/relayScreen';
import Container from '#ui/Container';
import FadeSwitch from '#ui/FadeSwitch';
import ProfileForm from './ProfileForm';
import ProfileKindStep from './ProfileKindStep';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { NewProfileRoute } from '#routes';
import type { NewProfileScreenPreloadQuery } from '@azzapp/relay/artifacts/NewProfileScreenPreloadQuery.graphql';
import type { NewProfileScreenQuery } from '@azzapp/relay/artifacts/NewProfileScreenQuery.graphql';
import type { CreateProfileParams } from '@azzapp/shared/WebAPI';

const newProfileScreenQuery = graphql`
  query NewProfileScreenQuery {
    profileCategories {
      id
      profileKind
      ...ProfileKindStep_profileCategories
      ...ProfileForm_profileCategory
    }
  }
`;

export const NewProfileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<NewProfileRoute, NewProfileScreenQuery>) => {
  const { profileCategories } = usePreloadedQuery(
    newProfileScreenQuery,
    preloadedQuery,
  );
  const [currentPage, setPage] = useState(0);

  const next = useCallback(() => {
    setPage(pa => Math.min(pa + 1, 3));
  }, [setPage]);

  const prev = useCallback(() => {
    setPage(pa => Math.max(0, pa - 1));
  }, [setPage]);

  const environment = useRelayEnvironment();

  const onProfileCreated = (response: {
    token: string;
    refreshToken: string;
    profileId: string;
    profileData: Omit<CreateProfileParams, 'authMethod'>;
  }) => {
    const { profileData, profileId, token, refreshToken } = response;
    environment.commitUpdate(updater => {
      const root = updater.getRoot();
      const user = root.getLinkedRecord('currentUser');
      const profiles = user?.getLinkedRecords('profiles');
      if (!profiles) {
        return;
      }

      const newProfile = updater.create(
        toGlobalId('Profile', profileId),
        'Profile',
      );

      typedEntries(profileData).forEach(([key, value]) => {
        newProfile.setValue(value, key);
      });

      user?.setLinkedRecords(
        profiles
          ?.concat(newProfile)
          .sort((a, b) =>
            ((a.getValue('userName') as string) ?? '').localeCompare(
              (b.getValue('userName') as string) ?? '',
            ),
          ),
        'profiles',
      );

      root.setLinkedRecord(user, 'currentUser');
    });

    void dispatchGlobalEvent({
      type: 'PROFILE_CHANGE',
      payload: {
        authTokens: {
          token,
          refreshToken,
        },
        profileId,
      },
    });
    if (params?.goBack) {
      router.back();
    } else {
      router.replaceAll(mainRoutes);
    }
  };

  const [profileCategoryId, setProfileCategoryId] = useState<string | null>(
    profileCategories?.[0]?.id ?? null,
  );

  const onProfileCategoryChange = useCallback((profileCategoryId: string) => {
    setProfileCategoryId(profileCategoryId);
  }, []);

  const profileCategory = profileCategories?.find(
    pc => pc.id === profileCategoryId,
  );
  const profileKind = profileCategory?.profileKind;

  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Container style={styles.container}>
        <FadeSwitch transitionDuration={170} currentKey={`${currentPage}`}>
          {currentPage === 0 && (
            <View key="0" style={styles.page} collapsable={false}>
              <ProfileKindStep
                onBack={params?.goBack ? router.back : null}
                profileCategories={profileCategories}
                profileCategoryId={profileCategoryId!}
                onNext={next}
                onProfileCategoryChange={onProfileCategoryChange}
              />
            </View>
          )}

          {currentPage === 1 && (
            <View key="1" style={styles.page} collapsable={false}>
              <ProfileForm
                profileKind={profileKind!}
                profileCategory={profileCategory!}
                onProfileCreated={onProfileCreated}
                onBack={prev}
              />
            </View>
          )}
        </FadeSwitch>
      </Container>
    </SafeAreaView>
  );
};

NewProfileScreen.prefetch = () => {
  const pixelRatio = Math.min(2, PixelRatio.get());
  const environment = getRelayEnvironment();
  return fetchQuery<NewProfileScreenPreloadQuery>(
    environment,
    graphql`
      query NewProfileScreenPreloadQuery($pixelRatio: Float!) {
        profileCategories {
          id
          profileKind
          ...ProfileKindStep_profileCategories
          ...ProfileForm_profileCategory
          medias {
            preloadURI: uri(width: 300, pixelRatio: $pixelRatio)
          }
        }
      }
    `,
    { pixelRatio },
  ).mergeMap(({ profileCategories }) => {
    const observables = convertToNonNullArray(
      profileCategories.flatMap(category =>
        category.medias?.map(media => prefetchImage(media.preloadURI)),
      ),
    );
    if (observables.length === 0) {
      return Observable.from(null);
    }
    return combineLatest(observables);
  });
};

NewProfileScreen.options = {
  replaceAnimation: 'push',
};

export default relayScreen(NewProfileScreen, {
  query: newProfileScreenQuery,
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderPage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
  },
});
