import { toGlobalId } from 'graphql-relay';
import { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { graphql, useFragment, useRelayEnvironment } from 'react-relay';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import { useRouter } from '#PlatformEnvironment';
import Container from '#ui/Container';
import FadeSwitch from '#ui/FadeSwitch';
import InterestPicker from './InterestPicker';
import ProfileForm from './ProfileForm';
import ProfileKindStep from './ProfileKindStep';
import type { NewProfileRoute } from '#routes';
import type { NewProfileScreen_query$key } from '@azzapp/relay/artifacts/NewProfileScreen_query.graphql';
import type { CreateProfileParams } from '@azzapp/shared/WebAPI';

type NewProfileScreenProps = {
  data: NewProfileScreen_query$key;
  onClose(): void;
  onProfileCreated(tokenResponse: {
    token: string;
    refreshToken: string;
    profileId: string;
    profileData: Omit<CreateProfileParams, 'authMethod'>;
  }): void;
  params: NewProfileRoute['params'];
};

const NewProfileScreen = ({
  data,
  onClose,
  onProfileCreated,
  params,
}: NewProfileScreenProps) => {
  const { profileCategories, interests } = useFragment(
    graphql`
      fragment NewProfileScreen_query on Query {
        profileCategories {
          id
          profileKind
          ...ProfileKindStep_profileCategories
          ...ProfileForm_profileCategory
        }
        interests {
          ...InterestPicker_interests
        }
      }
    `,
    data,
  );

  const [currentPage, setPage] = useState(0);

  const next = useCallback(() => {
    setPage(pa => Math.min(pa + 1, 3));
  }, [setPage]);

  const prev = useCallback(() => {
    setPage(pa => Math.max(0, pa - 1));
  }, [setPage]);

  const environment = useRelayEnvironment();

  const onProfileCreatedInner = (tokenResponse: {
    token: string;
    refreshToken: string;
    profileId: string;
    profileData: Omit<CreateProfileParams, 'authMethod'>;
  }) => {
    const { profileData, profileId } = tokenResponse;
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

    onProfileCreated(tokenResponse);
    next();
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
                onProfileCreated={onProfileCreatedInner}
                onBack={prev}
              />
            </View>
          )}

          {currentPage === 2 && (
            <View key="2" style={styles.page} collapsable={false}>
              <InterestPicker
                interests={interests}
                onClose={onClose}
                profileKind={profileKind!}
              />
            </View>
          )}
        </FadeSwitch>
      </Container>
    </SafeAreaView>
  );
};

export default NewProfileScreen;

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
