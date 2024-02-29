import { useState, useCallback, useRef } from 'react';
import { useIntl } from 'react-intl';
import {
  Dimensions,
  PixelRatio,
  Platform,
  StatusBar,
  View,
  useWindowDimensions,
} from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { Observable } from 'relay-runtime';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { combineLatest } from '@azzapp/shared/observableHelpers';
import { NextHeaderButton } from '#components/commonsButtons';
import { useRouter } from '#components/NativeRouter';
import fetchQueryAndRetain from '#helpers/fetchQueryAndRetain';
import { prefetchImage } from '#helpers/mediaHelpers';
import relayScreen from '#helpers/relayScreen';
import useAuthState from '#hooks/useAuthState';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Text from '#ui/Text';
import CardEditionStep from './CardEditionStep';
import CoverEditionStep from './CoverEditionStep';
import PagerHeader, { PAGER_HEADER_HEIGHT } from './PagerHeader';
import WebCardForm from './WebCardForm';
import WebCardKinStep from './WebCardKindStep';
import WizardTransitioner from './WizardTransitioner';
import type { CardTemplateListHandle } from '#components/CardTemplateList';
import type { CoverEditorHandle } from '#components/CoverEditor/CoverEditor';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { NewWebCardScreenPreloadQuery } from '#relayArtifacts/NewWebCardScreenPreloadQuery.graphql';
import type { NewWebCardScreenQuery } from '#relayArtifacts/NewWebCardScreenQuery.graphql';
import type { NewWebCardScreenWithWebCardQuery } from '#relayArtifacts/NewWebCardScreenWithWebCardQuery.graphql';
import type { NewWebCardRoute } from '#routes';
import type { ProfileFormHandle } from './WebCardForm';

const newWebCardScreenQuery = graphql`
  query NewWebCardScreenQuery {
    webCardCategories {
      id
      webCardKind
      ...WebCardKindStep_webCardCategories
      ...WebCardForm_webCardCategory
    }
  }
`;

const newProfileScreenQueryWithProfile = graphql`
  query NewWebCardScreenWithWebCardQuery($webCardId: ID!) {
    node(id: $webCardId) {
      # aliasing avoir nullable field on fragment spread
      ... on WebCard @alias(as: "webCard") {
        id
        userName
        webCardCategory {
          id
        }
      }
    }
    webCardCategories {
      id
      webCardKind
      ...WebCardKindStep_webCardCategories
      ...WebCardForm_webCardCategory
    }
  }
`;

const { height: windowHeight } = Dimensions.get('screen');

export const NewWebCardScreen = ({
  route: { params },
  preloadedQuery,
}: RelayScreenProps<
  NewWebCardRoute,
  NewWebCardScreenQuery | NewWebCardScreenWithWebCardQuery
>) => {
  // #region Data
  const data = usePreloadedQuery(
    params?.webCardId
      ? newProfileScreenQueryWithProfile
      : newWebCardScreenQuery,
    preloadedQuery,
  );
  const { webCardCategories } = data;
  const webCard = 'node' in data ? data.node?.webCard : null;

  // #endregion

  // #region Profile kind selection
  const [webCardCategoryId, setWebCardCategoryId] = useState<string | null>(
    webCard?.webCardCategory?.id ?? webCardCategories?.[0]?.id ?? null,
  );
  const webCardCategory = webCardCategories?.find(
    pc => pc.id === webCardCategoryId,
  );
  const webCardKind = webCardCategory?.webCardKind;

  const onWebCardCategoryChange = useCallback((webCardCategoryId: string) => {
    setWebCardCategoryId(webCardCategoryId);
  }, []);
  // #endregion

  // #region Profile creation
  const { profileInfos } = useAuthState();
  const [webCardInfo, setWebCardInfo] = useState<{
    profileId: string;
    webCardId: string;
    userName: string;
  } | null>(
    webCard && profileInfos
      ? {
          profileId: profileInfos?.profileId,
          webCardId: webCard.id,
          userName: webCard.userName,
        }
      : null,
  );

  // #region Navigation
  const [currentStepIndex, setCurrentStepIndex] = useState(webCardInfo ? 2 : 0);

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

  const onWebCardCreated = async (
    profileId: string,
    webCardId: string,
    userName: string,
  ) => {
    setWebCardInfo({
      profileId,
      webCardId,
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
      route: 'WEBCARD',
      params: { ...webCardInfo!, editing: true },
    });
  }, [webCardInfo, router]);
  // #endregion

  // #region Layout
  const insets = useScreenInsets();
  const { width: windowWidth } = useWindowDimensions();
  const contentHeight =
    windowHeight -
    insets.top -
    (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0) -
    PAGER_HEADER_HEIGHT;
  // #endregion

  const [headerHidden, setHeaderHidden] = useState(false);
  const webCardFormRef = useRef<ProfileFormHandle>(null);
  const onSubmitProfileForm = () => {
    webCardFormRef.current?.onSubmit();
  };
  const [canSave, setCanSave] = useState(false);
  const coverEditionRef = useRef<CoverEditorHandle>(null);
  const onCoverEditionRef = () => {
    coverEditionRef.current?.save();
  };

  const webCardTemplateRef = useRef<CardTemplateListHandle>(null);
  const onNext = () => {
    webCardTemplateRef.current?.onSubmit();
  };

  const intl = useIntl();
  const steps = [
    {
      title: intl.formatMessage(
        {
          defaultMessage: 'Select a WebCard{azzappA} type',
          description: 'WebCard kind selection screen title',
        },
        {
          azzappA: <Text variant="azzapp">a</Text>,
        },
      ) as string,
      element: (
        <WebCardKinStep
          webCardCategories={webCardCategories}
          webCardCategoryId={webCardCategoryId!}
          onNext={next}
          onWebCardCategoryChange={onWebCardCategoryChange}
        />
      ),
      backIcon: 'arrow_down' as const,
    },
    {
      title:
        webCardKind === 'personal'
          ? intl.formatMessage({
              defaultMessage: 'What’s your name?',
              description: 'Profile creation form title for personal webCard',
            })
          : intl.formatMessage({
              defaultMessage: 'Provide more details',
              description: 'Profile creation form title for business webCard',
            }),
      element:
        webCardCategory && currentStepIndex === 1 ? (
          <WebCardForm
            webCardKind={webCardKind!}
            webCardCategory={webCardCategory}
            onWebCardCreated={onWebCardCreated}
            ref={webCardFormRef}
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
        webCardInfo != null && currentStepIndex === 2 ? (
          <CoverEditionStep
            profileId={webCardInfo.profileId}
            height={contentHeight}
            setCanSave={setCanSave}
            onCoverSaved={onCoverSaved}
            ref={coverEditionRef}
          />
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
        webCardInfo !== null && currentStepIndex === 3 ? (
          <CardEditionStep
            profileId={webCardInfo.profileId}
            webCardId={webCardInfo.webCardId}
            height={contentHeight}
            onSkip={onCoverTemplateApplied}
            onCoverTemplateApplied={onCoverTemplateApplied}
            hideHeader={() => setHeaderHidden(true)}
            showHeader={() => setHeaderHidden(false)}
            ref={webCardTemplateRef}
          />
        ) : null,

      backIcon: 'arrow_down' as const,
      rightElement: (
        <NextHeaderButton
          style={{ width: 70, marginRight: 10 }}
          onPress={onNext}
        />
      ),
      rightElementWidth: 80,
    },
  ];

  return (
    <WizardTransitioner
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

NewWebCardScreen.options = {
  replaceAnimation: 'push',
  stackAnimation: 'slide_from_bottom',
};

/**
 * Fallback screen displayed while the webCard categories are loading
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

export default relayScreen(NewWebCardScreen, {
  query: params =>
    params?.webCardId
      ? newProfileScreenQueryWithProfile
      : newWebCardScreenQuery,
  getVariables: params =>
    params?.webCardId ? { webCardId: params.webCardId } : {},
  profileBound: false,

  fallback: NewProfileScreenFallback,

  prefetch: (_, environment) => {
    const pixelRatio = Math.min(2, PixelRatio.get());
    return fetchQueryAndRetain<NewWebCardScreenPreloadQuery>(
      environment,
      graphql`
        query NewWebCardScreenPreloadQuery($pixelRatio: Float!) {
          webCardCategories {
            id
            webCardKind
            ...WebCardKindStep_webCardCategories
            ...WebCardForm_webCardCategory
            medias {
              preloadURI: uri(width: 256, pixelRatio: $pixelRatio)
            }
          }
        }
      `,
      { pixelRatio },
    ).mergeMap(({ webCardCategories }) => {
      const observables = convertToNonNullArray(
        webCardCategories.flatMap(category =>
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
