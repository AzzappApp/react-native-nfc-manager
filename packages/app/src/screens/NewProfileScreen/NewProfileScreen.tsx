import { useState, useCallback, useRef, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { PixelRatio, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, ScreenContainer } from 'react-native-screens';
import { graphql, usePreloadedQuery } from 'react-relay';
import { Observable } from 'relay-runtime';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import { prefetchImage } from '#components/medias';
import { useRouter } from '#components/NativeRouter';
import fetchQueryAndRetain from '#helpers/fetchQueryAndRetain';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import relayScreen from '#helpers/relayScreen';
import Container from '#ui/Container';
import CardEditionStep from './CardEditionStep';
import CoverEditionStep from './CoverEditionStep';
import { TRANSITION_DURATION } from './newProfileScreenHelpers';
import PagerHeader, { PAGER_HEADER_HEIGHT } from './PagerHeader';
import ProfileForm from './ProfileForm';
import ProfileKindStep from './ProfileKindStep';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { NewProfileRoute } from '#routes';
import type { NewProfileScreenPreloadQuery } from '@azzapp/relay/artifacts/NewProfileScreenPreloadQuery.graphql';
import type { NewProfileScreenQuery } from '@azzapp/relay/artifacts/NewProfileScreenQuery.graphql';
import type { ReactNode } from 'react';

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

const STEPS = ['PROFIKE_KIND', 'PROFILE_FORM', 'COVER', 'CARD'] as const;

type Step = (typeof STEPS)[number];

export const NewProfileScreen = ({
  preloadedQuery,
}: RelayScreenProps<NewProfileRoute, NewProfileScreenQuery>) => {
  // #region Data
  const { profileCategories } = usePreloadedQuery(
    newProfileScreenQuery,
    preloadedQuery,
  );
  // #endregion

  // #region Navigation
  const [currentPage, setPage] = useState(0);
  const currentStep = STEPS[currentPage];

  const previousPage = useRef(currentPage);
  const transitionProgress = useSharedValue(0);
  const [transitionInformation, setTransitionInformation] = useState<{
    transitionKind: 'back' | 'forward';
    transitioningPage: number;
    disappearingPage: number;
  } | null>(null);

  const onTransitionEnd = useCallback(() => {
    setTransitionInformation(null);
    setTimeout(() => {
      transitionProgress.value = 0;
    }, 0);
  }, [transitionProgress]);

  useEffect(() => {
    if (previousPage.current === currentPage) {
      return;
    }
    const transitionKind =
      currentPage > previousPage.current ? 'forward' : 'back';
    setTransitionInformation({
      transitionKind,
      transitioningPage:
        transitionKind === 'forward' ? currentPage : previousPage.current,
      disappearingPage: previousPage.current,
    });
    previousPage.current = currentPage;
    transitionProgress.value = withTiming(
      1,
      {
        duration: TRANSITION_DURATION,
        easing: Easing.inOut(Easing.ease),
      },
      () => {
        runOnJS(onTransitionEnd)();
      },
    );
  }, [currentPage, onTransitionEnd, transitionProgress]);

  const next = useCallback(() => {
    setPage(page => Math.min(page + 1, STEPS.length - 1));
  }, [setPage]);

  const prev = useCallback(() => {
    setPage(page => Math.max(0, page - 1));
  }, [setPage]);

  const router = useRouter();
  const onBack = useCallback(() => {
    router.back();
  }, [router]);
  // #endregion

  // #region Profile kind selection
  const [profileCategoryId, setProfileCategoryId] = useState<string | null>(
    profileCategories?.[0]?.id ?? null,
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
  } | null>(null);

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
    next();
  }, [next]);

  const onCoverTemplateApplied = useCallback(() => {
    router.replace({
      route: 'PROFILE',
      params: { ...profileInfo!, editing: true },
    });
  }, [profileInfo, router]);
  // #endregion

  // #region Layout
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const contentHeight =
    windowHeight - insets.top - insets.bottom - PAGER_HEADER_HEIGHT;
  // #endregion

  const intl = useIntl();
  const pages: Record<Step, { title: string; element: ReactNode }> = {
    PROFIKE_KIND: {
      title: intl.formatMessage({
        defaultMessage: 'What WebCard™\nwould you like to create?',
        description: 'WebCard kind selection screen title',
      }),
      element: (
        <ProfileKindStep
          profileCategories={profileCategories}
          profileCategoryId={profileCategoryId!}
          onNext={next}
          onProfileCategoryChange={onProfileCategoryChange}
        />
      ),
    },
    PROFILE_FORM: {
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
      element: profileCategory ? (
        <ProfileForm
          profileKind={profileKind!}
          profileCategory={profileCategory}
          onProfileCreated={onProfileCreated}
        />
      ) : null,
    },
    COVER: {
      title: intl.formatMessage({
        defaultMessage: 'Create your cover',
        description: 'Cover creation screen title',
      }),
      element:
        profileInfo != null ? (
          <CoverEditionStep
            profileKind={profileKind!}
            height={contentHeight}
            onCoverSaved={onCoverSaved}
          />
        ) : null,
    },
    CARD: {
      title: intl.formatMessage({
        defaultMessage: 'Select a WebCard template',
        description: 'WebCard creation screen title',
      }),
      element:
        profileInfo !== null ? (
          <CardEditionStep
            height={contentHeight}
            onCoverTemplateApplied={onCoverTemplateApplied}
          />
        ) : null,
    },
  };

  return (
    <Container
      style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <PagerHeader
        nbPages={4}
        currentPage={currentPage}
        onBack={currentPage > 0 ? prev : onBack}
        title={pages[currentStep].title}
      />

      <ScreenContainer style={{ height: contentHeight }}>
        {STEPS.map((step, index) => {
          const { element } = pages[step];
          return (
            <TransitionScreen
              key={`NewProfileScreen-${step}`}
              activityState={
                index === currentPage
                  ? 2
                  : transitionInformation?.disappearingPage === index
                  ? 1
                  : 0
              }
              transitionProgress={
                transitionInformation?.transitioningPage === index
                  ? transitionProgress
                  : null
              }
              transitionKind={
                transitionInformation?.transitionKind ?? 'forward'
              }
              width={windowWidth}
              height={contentHeight}
            >
              {element}
            </TransitionScreen>
          );
        })}
      </ScreenContainer>
    </Container>
  );
};

NewProfileScreen.options = {
  replaceAnimation: 'push',
  stackAnimation: 'slide_from_bottom',
};

export default relayScreen(NewProfileScreen, {
  query: newProfileScreenQuery,
  prefetchProfileIndependent: true,
  prefetch: () => {
    const pixelRatio = Math.min(2, PixelRatio.get());
    const environment = getRelayEnvironment();
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
              preloadURI: uri(width: 300, pixelRatio: $pixelRatio)
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

type TransitionScreenProps = {
  activityState: 0 | 1 | 2;
  transitionProgress: Animated.SharedValue<number> | null;
  transitionKind: 'back' | 'forward';
  children: React.ReactNode;
  width: number;
  height: number;
};

const TransitionScreen = ({
  activityState,
  transitionProgress,
  transitionKind,
  children,
  width,
  height,
}: TransitionScreenProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    if (transitionProgress == null) {
      return {};
    }
    return {
      transform: [
        {
          translateX:
            transitionKind === 'forward'
              ? (1 - transitionProgress.value) * width
              : transitionProgress.value * width,
        },
      ],
    };
  }, [transitionProgress, transitionKind]);

  const layoutStyle = { width, height };

  return (
    <Screen activityState={activityState} style={layoutStyle}>
      <Animated.View style={[layoutStyle, animatedStyle]}>
        <Container style={{ flex: 1 }}>{children}</Container>
      </Animated.View>
    </Screen>
  );
};
