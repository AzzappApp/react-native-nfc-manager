import { useState, useCallback, useRef } from 'react';
import { useIntl } from 'react-intl';
import { PixelRatio, View, useWindowDimensions } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { Observable } from 'relay-runtime';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import { NextHeaderButton } from '#components/commonsButtons';
import { useRouter } from '#components/NativeRouter';
import fetchQueryAndRetain from '#helpers/fetchQueryAndRetain';
import { prefetchImage } from '#helpers/mediaHelpers';
import ProfileBoundRelayEnvironmentProvider from '#helpers/ProfileBoundRelayEnvironmentProvider';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Text from '#ui/Text';
import CardEditionStep from './CardEditionStep';
import CoverEditionStep from './CoverEditionStep';
import PagerHeader, { PAGER_HEADER_HEIGHT } from './PagerHeader';
import ProfileForm from './ProfileForm';
import ProfileKindStep from './ProfileKindStep';
import WizzardTransitioner from './WizzardTransitioner';
import type { CardTemplatelistHandle } from '#components/CardTemplateList';
import type { CoverEditorHandle } from '#components/CoverEditor/CoverEditor';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { NewProfileRoute } from '#routes';
import type { ProfileFormHandle } from './ProfileForm';
import type { NewProfileScreenPreloadQuery } from '@azzapp/relay/artifacts/NewProfileScreenPreloadQuery.graphql';
import type { NewProfileScreenQuery } from '@azzapp/relay/artifacts/NewProfileScreenQuery.graphql';
import type { NewProfileScreenWithProfileQuery } from '@azzapp/relay/artifacts/NewProfileScreenWithProfileQuery.graphql';

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

const newProfileScreenQueryWithProfile = graphql`
  query NewProfileScreenWithProfileQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      ... on Profile {
        id
        userName
        profileCategory {
          id
        }
      }
    }
    profileCategories {
      id
      profileKind
      ...ProfileKindStep_profileCategories
      ...ProfileForm_profileCategory
    }
  }
`;

export const NewProfileScreen = ({
  route: { params },
  preloadedQuery,
}: RelayScreenProps<
  NewProfileRoute,
  NewProfileScreenQuery | NewProfileScreenWithProfileQuery
>) => {
  // #region Data
  const data = usePreloadedQuery(
    params?.profileId
      ? newProfileScreenQueryWithProfile
      : newProfileScreenQuery,
    preloadedQuery,
  );
  const { profileCategories } = data;
  const profile = 'profile' in data ? data.profile : null;

  // #endregion

  // #region Profile kind selection
  const [profileCategoryId, setProfileCategoryId] = useState<string | null>(
    profile?.profileCategory?.id ?? profileCategories?.[0]?.id ?? null,
  );
  const profileCategory = profileCategories?.find(
    pc => pc.id === profileCategoryId,
  );
  const profileKind = profileCategory?.profileKind;

  const onProfileCategoryChange = useCallback((profileCategoryId: string) => {
    setProfileCategoryId(profileCategoryId);
  }, []);
  // #endregion

  // #region Profile creation
  const [profileInfo, setProfileInfo] = useState<{
    profileId: string;
    userName: string;
  } | null>(
    profile?.id && profile?.userName
      ? {
          profileId: profile.id,
          userName: profile.userName,
        }
      : null,
  );

  // #region Navigation
  const [currentStepIndex, setCurrentStepIndex] = useState(profileInfo ? 2 : 0);

  const next = useCallback(() => {
    setCurrentStepIndex(page => Math.min(page + 1, 4));
  }, [setCurrentStepIndex]);

  const prev = useCallback(() => {
    setCurrentStepIndex(page => Math.max(0, page - 1));
  }, [setCurrentStepIndex]);

  const router = useRouter();
  const onBack = useCallback(() => {
    if (currentStepIndex === 1) {
      prev();
    } else {
      router.back();
    }
  }, [currentStepIndex, prev, router]);
  // #endregion

  const onProfileCreated = async (profileId: string, userName: string) => {
    setProfileInfo({
      profileId,
      userName,
    });
    next();
  };
  // #endregion

  // #region Card creation
  const onCoverSaved = useCallback(() => {
    router.back();
    next();
  }, [next, router]);

  const onCoverTemplateApplied = useCallback(() => {
    router.replace({
      route: 'PROFILE',
      params: { ...profileInfo!, editing: true },
    });
  }, [profileInfo, router]);
  // #endregion

  // #region Layout
  const insets = useScreenInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const contentHeight = windowHeight - insets.top - PAGER_HEADER_HEIGHT;
  // #endregion

  const [headerHidden, setHeaderHiden] = useState(false);
  const profileFormRef = useRef<ProfileFormHandle>(null);
  const onSubmitProfileForm = () => {
    profileFormRef.current?.onSubmit();
  };
  const [canSave, setCanSave] = useState(false);
  const coverEditionRef = useRef<CoverEditorHandle>(null);
  const onCoverEditionRef = () => {
    coverEditionRef.current?.save();
  };

  const webcardTemplateRef = useRef<CardTemplatelistHandle>(null);
  const onWebcardTemplateRef = () => {
    webcardTemplateRef.current?.onSubmit();
  };

  const intl = useIntl();
  const steps = [
    {
      title: intl.formatMessage(
        {
          defaultMessage: 'Select a WebCard{azzappAp} type',
          description: 'WebCard kind selection screen title',
        },
        {
          azzappAp: <Text variant="azzapp">a</Text>,
        },
      ) as string,
      element: (
        <ProfileKindStep
          profileCategories={profileCategories}
          profileCategoryId={profileCategoryId!}
          onNext={next}
          onProfileCategoryChange={onProfileCategoryChange}
        />
      ),
      backIcon: 'arrow_down' as const,
    },
    {
      title:
        profileKind === 'personal'
          ? intl.formatMessage({
              defaultMessage: 'What’s your name?',
              description: 'Profile creation form title for personal profile',
            })
          : intl.formatMessage({
              defaultMessage: 'Provide more details',
              description: 'Profile creation form title for business profile',
            }),
      element:
        profileCategory && currentStepIndex === 1 ? (
          <ProfileForm
            profileKind={profileKind!}
            profileCategory={profileCategory}
            onProfileCreated={onProfileCreated}
            ref={profileFormRef}
          />
        ) : null,
      backIcon: 'arrow_left' as const,
      rightElement: (
        <NextHeaderButton
          style={{ width: 70, marginRight: 10 }}
          onPress={onSubmitProfileForm}
        />
      ),
      rightElementWidth: 80,
    },
    {
      title: intl.formatMessage({
        defaultMessage: 'Create your cover',
        description: 'Cover creation screen title',
      }),
      element:
        profileInfo != null && currentStepIndex === 2 ? (
          <ProfileBoundRelayEnvironmentProvider
            profileId={profileInfo.profileId}
          >
            <CoverEditionStep
              profileKind={profileKind!}
              height={contentHeight}
              setCanSave={setCanSave}
              onCoverSaved={onCoverSaved}
              ref={coverEditionRef}
            />
          </ProfileBoundRelayEnvironmentProvider>
        ) : null,
      backIcon: 'arrow_down' as const,
      rightElement: (
        <NextHeaderButton
          style={{ width: 70, marginRight: 10 }}
          onPress={onCoverEditionRef}
          disabled={!canSave}
        />
      ),
      rightElementWidth: 80,
    },
    {
      title: intl.formatMessage({
        defaultMessage: 'Select a template',
        description: 'WebCard creation screen title',
      }),
      element:
        profileInfo !== null && currentStepIndex === 3 ? (
          <ProfileBoundRelayEnvironmentProvider
            profileId={profileInfo.profileId}
          >
            <CardEditionStep
              height={contentHeight}
              onSkip={onCoverTemplateApplied}
              onCoverTemplateApplied={onCoverTemplateApplied}
              hideHeader={() => setHeaderHiden(true)}
              showHeader={() => setHeaderHiden(false)}
              ref={webcardTemplateRef}
            />
          </ProfileBoundRelayEnvironmentProvider>
        ) : null,

      backIcon: 'arrow_down' as const,
      rightElement: (
        <NextHeaderButton
          style={{ width: 70, marginRight: 10 }}
          onPress={onWebcardTemplateRef}
        />
      ),
      rightElementWidth: 80,
    },
  ];

  return (
    <WizzardTransitioner
      currentStepIndex={currentStepIndex}
      steps={steps}
      width={windowWidth}
      contentHeight={contentHeight}
      onBack={onBack}
      headerHidden={headerHidden}
      style={{
        flex: 1,
        paddingTop: insets.top,
      }}
    />
  );
};

NewProfileScreen.options = {
  replaceAnimation: 'push',
  stackAnimation: 'slide_from_bottom',
};

/**
 * Fallback screen displayed while the profile categories are loading
 * Displayed in case of slow connection
 */
const NewProfileScreenFallback = () => {
  const router = useRouter();
  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const insets = useScreenInsets();

  return (
    <Container style={{ flex: 1, paddingTop: insets.top }}>
      <PagerHeader
        nbPages={4}
        currentPage={0}
        onBack={onBack}
        title=""
        backIcon="arrow_down"
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    </Container>
  );
};

export default relayScreen(NewProfileScreen, {
  query: params =>
    params?.profileId
      ? newProfileScreenQueryWithProfile
      : newProfileScreenQuery,
  getVariables: params =>
    params?.profileId ? { profileId: params.profileId } : {},
  profileBound: false,

  fallback: NewProfileScreenFallback,

  prefetch: (_, environment) => {
    const pixelRatio = Math.min(2, PixelRatio.get());
    return fetchQueryAndRetain<NewProfileScreenPreloadQuery>(
      environment,
      graphql`
        query NewProfileScreenPreloadQuery($pixelRatio: Float!) {
          profileCategories {
            id
            profileKind
            ...ProfileKindStep_profileCategories
            ...ProfileForm_profileCategory
            medias {
              preloadURI: uri(width: 256, pixelRatio: $pixelRatio)
            }
          }
        }
      `,
      { pixelRatio },
    ).mergeMap(({ profileCategories }) => {
      const observables = convertToNonNullArray(
        profileCategories.flatMap(
          category =>
            category.medias?.map(media => prefetchImage(media.preloadURI)),
        ),
      );
      if (observables.length === 0) {
        return Observable.from(null);
      }
      return combineLatest(observables);
    });
  },
});
