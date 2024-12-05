import * as Sentry from '@sentry/react-native';
import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { graphql, useFragment, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import CardModuleHeader from '#components/cardModules/CardModuleHeader';
import CardModuleTabView, {
  CARD_MODULE_TAB_VIEW_HEIGHT,
} from '#components/cardModules/CardModuleTabView';
import { ScreenModal, preventModalDismiss } from '#components/NativeRouter';
import { TOOLBOX_SECTION_HEIGHT } from '#components/Toolbar/ToolBoxSection';
import { DESKTOP_PREVIEW_WIDTH } from '#components/WebCardPreview';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import { HEADER_HEIGHT } from '#ui/Header';
import SafeAreaView from '#ui/SafeAreaView';
import UploadProgressModal from '#ui/UploadProgressModal';
import type { CardModuleViewMode } from '#components/cardModules/CardModuleTabView';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type {
  ModuleKindAndVariant,
  ModuleKindHasVariants,
  Variant,
} from '#helpers/webcardModuleHelpers';
import type { MediaModuleWebCardEditionScreenQuery } from '#relayArtifacts/MediaModuleWebCardEditionScreenQuery.graphql';
import type { MediaTextLinkModuleWebCardEditionScreenQuery } from '#relayArtifacts/MediaTextLinkModuleWebCardEditionScreenQuery.graphql';
import type { MediaTextModuleWebCardEditionScreenQuery } from '#relayArtifacts/MediaTextModuleWebCardEditionScreenQuery.graphql';
import type {
  withCardModule_webCard$data,
  withCardModule_webCard$key,
} from '#relayArtifacts/withCardModule_webCard.graphql';
import type { SectionsRoute } from '#sectionsRoutes';
import type { CardModuleDimension } from './cardModuleEditorType';
import type { GraphQLTaggedNode } from 'react-relay';

// don't have a better way right now to type this without listing all....
type MediaQueryKey =
  | MediaModuleWebCardEditionScreenQuery
  | MediaTextLinkModuleWebCardEditionScreenQuery
  | MediaTextModuleWebCardEditionScreenQuery;
//INSERT_MODULE

export type CardModuleProps<T extends ModuleKindHasVariants, V> = {
  moduleKey: V | null;
  webCard: withCardModule_webCard$data;
  viewMode: CardModuleViewMode;
  setCanSave: (canSave: boolean) => void;
  dimension: CardModuleDimension;
  variant: Variant<T>;
  setVariant: (variant: Variant<T>) => void;
  scaleFactor: number;
  editableItemIndex: number | null;
  setEditableItemIndex: (index: number | null) => void;
};

export type ModuleWebCardScreenHandle = {
  save: () => void;
};

/**
 * Higher-order component (HOC) that wraps a card module component with additional functionality.
 *
 * This HOC provides the wrapped component with data fetching capabilities using Relay,
 * It will provide a unique fragment for the webCard, a unique header module to handle subscription/free content
 *
 */
const withCardModule = <T extends ModuleKindHasVariants, V>(
  WrappedComponent: React.ForwardRefExoticComponent<
    CardModuleProps<T, V> & React.RefAttributes<ModuleWebCardScreenHandle>
  >,
  {
    query: screenQuery,
    moduleKind,
  }: {
    query: GraphQLTaggedNode;
    moduleKind: T;
  },
) => {
  const HOC: React.FC<RelayScreenProps<SectionsRoute, MediaQueryKey>> = ({
    preloadedQuery,
    route: {
      params: { variant, moduleId },
    },
    ...props
  }) => {
    // #region hook& withCardModule_webCard$key;
    const [canSave, setCanSave] = useState(false);
    const [viewMode, setViewMode] = useState<CardModuleViewMode>('mobile');
    const data = usePreloadedQuery<MediaQueryKey>(screenQuery, preloadedQuery);
    const wrappedComponentRef = useRef<{ save: () => Promise<void> }>(null);
    const styles = useStyleSheet(stylesheet);
    const { width, height } = useWindowDimensions();
    const { bottom, top } = useScreenInsets();

    // #endregion

    //we will need to apply a scale, but unfornutaly, due to some scrollView design we cannot s
    const desktopScaleFactor = width / DESKTOP_PREVIEW_WIDTH;
    const containerDimension: CardModuleDimension = useMemo(() => {
      const containerHeight =
        height -
        TOOLBOX_SECTION_HEIGHT -
        bottom -
        top -
        CARD_MODULE_TAB_VIEW_HEIGHT -
        HEADER_HEIGHT;
      return {
        width: viewMode === 'mobile' ? width : DESKTOP_PREVIEW_WIDTH,
        height:
          viewMode === 'mobile'
            ? containerHeight + 40
            : (DESKTOP_PREVIEW_WIDTH / 0.6) * desktopScaleFactor, //0.6 arbitray value to make landscape design
      };
    }, [bottom, desktopScaleFactor, height, top, viewMode, width]);

    // #region fetching data
    const webCard = useFragment(
      graphql`
        fragment withCardModule_webCard on WebCard {
          id
          cardIsPublished
          coverBackgroundColor
          cardColors {
            primary
            light
            dark
          }
          cardStyle {
            borderColor
            borderRadius
            borderWidth
            buttonColor
            buttonRadius
            fontFamily
            fontSize
            gap
            titleFontFamily
            titleFontSize
          }
          cardModules {
            id
          }
          isPremium
          requiresSubscription
          ...ModuleEditionScreenTitle_webCard
        }
      `,
      data?.profile?.webCard as withCardModule_webCard$key,
    );

    const cardModulesCount = useMemo(
      () => webCard?.cardModules?.length ?? 0,
      [webCard?.cardModules?.length],
    );
    // #endregion

    // #region save data
    const [saving, setSaving] = useState(false);
    const save = useCallback(async () => {
      if (canSave) {
        setSaving(true);
        try {
          if (wrappedComponentRef.current) {
            await wrappedComponentRef.current.save();
          }
        } catch (e) {
          Sentry.captureException(e, {
            extra: {
              component: 'withCardModule',
              action: 'save',
              module: moduleKind,
            },
          });
          setSaving(false);
        } finally {
          setSaving(false);
        }
      }
    }, [canSave]);

    const [selectedVariant, setSelectedVariant] = useState<Variant<T>>(
      variant as Variant<T>,
    );

    const module = moduleId
      ? (data?.profile?.webCard?.cardModules.find(
          module => module?.id === moduleId,
        ) as unknown as V) //some hardCasting but was not able at the time to find a better solution
      : null;

    // #endRegion

    // #region item selection
    const [editableItemIndex, setEditableItemIndex] = useState<number | null>(
      null,
    );
    // #endRegion
    return (
      <SafeAreaView style={styles.container}>
        <CardModuleHeader
          module={
            { moduleKind, variant: selectedVariant } as ModuleKindAndVariant
          }
          canSave={canSave}
          save={save}
          webCardKey={webCard}
          cardModulesCount={cardModulesCount}
        />
        <CardModuleTabView viewMode={viewMode} onChange={setViewMode} />
        <Suspense>
          <View style={styles.container}>
            <WrappedComponent
              {...props}
              moduleKey={module}
              webCard={webCard}
              setCanSave={setCanSave}
              viewMode={viewMode}
              dimension={containerDimension}
              ref={wrappedComponentRef}
              variant={selectedVariant}
              setVariant={setSelectedVariant}
              scaleFactor={viewMode === 'mobile' ? 1 : desktopScaleFactor}
              editableItemIndex={editableItemIndex}
              setEditableItemIndex={setEditableItemIndex}
            />
          </View>
        </Suspense>
        <ScreenModal
          visible={saving}
          onRequestDismiss={preventModalDismiss}
          gestureEnabled={false}
        >
          <UploadProgressModal />
        </ScreenModal>
      </SafeAreaView>
    );
  };
  HOC.displayName = `withCardModule(${getDisplayName(WrappedComponent)})`;

  const HOCScreen = relayScreen(HOC, {
    query: screenQuery,
    getVariables: (_, profileInfos) => {
      return {
        profileId: profileInfos?.profileId ?? '',
      };
    },
  });

  return HOCScreen;
};

const getDisplayName = (WrappedComponent: React.ComponentType<any>) => {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
};

export default withCardModule;

const stylesheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    paddingBottom: 16,
  },
}));
