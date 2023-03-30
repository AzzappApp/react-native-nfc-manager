import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import FadeSwitch from '#ui/FadeSwitch';
import InterestPicker from './InterestPicker';
import ProfileForm from './ProfileForm';
import ProfileKindStep from './ProfileKindStep';
import type { NewProfileScreen_viewer$key } from '@azzapp/relay/artifacts/NewProfileScreen_viewer.graphql';

type NewProfileScreenProps = {
  viewer: NewProfileScreen_viewer$key;
  onClose(): void;
  onProfileCreated(tokenResponse: {
    token: string;
    refreshToken: string;
    profileId: string;
  }): void;
};

const NewProfileScreen = ({
  viewer,
  onClose,
  onProfileCreated,
}: NewProfileScreenProps) => {
  const { profileCategories, interests } = useFragment(
    graphql`
      fragment NewProfileScreen_viewer on Viewer {
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
    viewer,
  );

  const [currentPage, setPage] = useState(0);

  const next = useCallback(() => {
    setPage(pa => Math.min(pa + 1, 3));
  }, [setPage]);

  const prev = useCallback(() => {
    setPage(pa => Math.max(0, pa - 1));
  }, [setPage]);

  const onProfileCreatedInner = (tokenResponse: {
    token: string;
    refreshToken: string;
    profileId: string;
  }) => {
    onProfileCreated(tokenResponse);
    next();
  };

  const [profileCategoryId, setProfileCategoryId] = useState<string | null>(
    profileCategories[0]?.id ?? null,
  );

  const onProfileCategoryChange = useCallback((profileCategoryId: string) => {
    setProfileCategoryId(profileCategoryId);
  }, []);

  const profileCategory = profileCategories.find(
    pc => pc.id === profileCategoryId,
  );
  const profileKind = profileCategory?.profileKind;

  return (
    <View style={styles.container}>
      <FadeSwitch transitionDuration={170} currentKey={`${currentPage}`}>
        {currentPage === 0 && (
          <View key="0" style={styles.page} collapsable={false}>
            <ProfileKindStep
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
            <InterestPicker interests={interests} onClose={onClose} />
          </View>
        )}
      </FadeSwitch>
    </View>
  );
};

export default NewProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderPage: {
    backgroundColor: 'white',
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
