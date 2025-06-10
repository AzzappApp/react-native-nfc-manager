import * as Sentry from '@sentry/react-native';
import isEqual from 'lodash/isEqual';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { DEFAULT_COLOR_PALETTE, swapColor } from '@azzapp/shared/cardHelpers';
import { type CardModuleColor } from '@azzapp/shared/cardModuleHelpers';
import CardModuleBottomBar from '#components/cardModules/CardModuleBottomBar';
import { type CardModuleMedia } from '#components/cardModules/cardModuleEditorType';
import CardModulePreviewContainer from '#components/cardModules/tool/CardModulePreviewContainer';
import { useRouter } from '#components/NativeRouter';
import { getInitialDyptichColor } from '#helpers/cardModuleColorsHelpers';
import {
  convertModuleMediaRelay,
  handleOnCompletedModuleSave,
  handleUploadCardModuleMedia,
} from '#helpers/cardModuleHelpers';
import MediaModuleRenderer from '../../components/cardModules/CardModuleMedia/MediaModuleRenderer';
import withWebCardSection from '../../components/cardModules/withCardModule';
import type { CardModuleData } from '#components/cardModules/CardModuleBottomBar';

import type { MediaModuleWebCardEditionScreen_module$key } from '#relayArtifacts/MediaModuleWebCardEditionScreen_module.graphql';
import type { MediaModuleWebCardEditionScreenMutation } from '#relayArtifacts/MediaModuleWebCardEditionScreenMutation.graphql';
import type {
  CardModuleProps,
  ModuleWebCardScreenHandle,
} from '../../components/cardModules/withCardModule';
import type { ForwardedRef } from 'react';

const mediaModuleWebCardEditionScreenQuery = graphql`
  query MediaModuleWebCardEditionScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        webCard {
          companyActivityLabel
          id
          ...withCardModule_webCard
          cardModules {
            # { fetching directly the cardModule is less efficient , all modules are already in cache
            # and relay is not able to find it properly
            # module: cardModule(moduleId: $moduleId) {
            id
            ...MediaModuleWebCardEditionScreen_module @alias(as: "innerModule")
          }
        }
      }
    }
  }
`;

type MediaModuleWebCardScreenProps = CardModuleProps<
  'media',
  MediaModuleWebCardEditionScreen_module$key
>;
const MediaModuleWebCardScreen = (
  {
    webCard,
    setCanSave,
    displayMode,
    dimension,
    moduleKey,
    variant,
    setVariant,
    scaleFactor,
    editableItemIndex,
    setEditableItemIndex,
    defaultSearchValue,
  }: MediaModuleWebCardScreenProps,
  ref: ForwardedRef<ModuleWebCardScreenHandle>,
) => {
  // #region hook
  const intl = useIntl();
  // #endregion

  /** @type {*} */
  const data = useFragment(
    graphql`
      fragment MediaModuleWebCardEditionScreen_module on CardModuleMedia
      @argumentDefinitions(
        screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
        pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
        cappedPixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
      ) {
        id
        cardModuleColor {
          background
          content
          graphic
          text
          title
        }
        variant
        cardModuleMedias {
          media {
            id
            width
            height
            ... on MediaImage {
              uri(width: $screenWidth, pixelRatio: $pixelRatio)
              smallThumbnail: uri(width: 125, pixelRatio: $cappedPixelRatio)
            }
            ... on MediaVideo {
              #will be use when we are gonna stop playing a video. still TODO
              uri(width: $screenWidth, pixelRatio: $pixelRatio)
              thumbnail(width: $screenWidth, pixelRatio: $pixelRatio)
              smallThumbnail: thumbnail(
                width: 125 #use for the small preview in toolbox
                pixelRatio: $cappedPixelRatio
              )
            }
          }
        }
      }
    `,
    moduleKey ?? null,
  );

  //we don't need a complexe data structure and hook on this, just a simple array of media and a color
  const [cardModuleMedias, setCardModuleMedias] = useState<CardModuleMedia[]>(
    convertModuleMediaRelay(data?.cardModuleMedias),
  );

  //don't swap color here, we need to kepp data like light/dark
  const [selectedCardModuleColor, setModuleColor] = useState<CardModuleColor>(
    data?.cardModuleColor ??
      getInitialDyptichColor(
        { moduleKind: MODULE_KIND, variant },
        webCard.coverBackgroundColor ?? 'light',
      ),
  );

  // #endRegion

  // #region Mutations and saving logic
  const [commit] = useMutation<MediaModuleWebCardEditionScreenMutation>(graphql`
    mutation MediaModuleWebCardEditionScreenMutation(
      $webCardId: ID!
      $input: SaveMediaModuleInput!
    ) {
      saveMediaModule(webCardId: $webCardId, input: $input) {
        webCard {
          id
          requiresSubscription
          cardModulesCount
          cardModules {
            id
            kind
            visible
            variant
            ...MediaModuleWebCardEditionScreen_module @alias(as: "mediaModule")
          }
        }
      }
    }
  `);

  const router = useRouter();

  const save: ModuleWebCardScreenHandle['save'] = useCallback(
    async (updateProcessedMedia, updateUploadIndicator) => {
      try {
        const moduleMedias = await handleUploadCardModuleMedia(
          cardModuleMedias,
          updateProcessedMedia,
          updateUploadIndicator,
        );
        await new Promise((resolve, reject) => {
          commit({
            variables: {
              webCardId: webCard.id,
              input: {
                moduleId: data?.id,
                cardModuleColor: selectedCardModuleColor,
                cardModuleMedias: moduleMedias.map(moduleMedias => ({
                  media: {
                    id: moduleMedias.media.id,
                  },
                })),
                variant,
              },
            },
            onCompleted(_, error) {
              handleOnCompletedModuleSave(
                !data?.id,
                moduleMedias,
                router,
                error,
              );
              if (error) {
                reject(error);
                return;
              }
              resolve(null);
            },
            onError(error) {
              Sentry.captureException(error);
              Toast.show({
                type: 'error',
                text1: intl.formatMessage({
                  defaultMessage: 'Error while saving your new module.',
                  description:
                    'Error toast message when saving a new module failed.',
                }),
              });
              reject(error);
            },
          });
        });
      } catch (e) {
        console.error(e);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'Could not save your Media module, medias upload failed',
            description:
              'Error toast message when saving a carousel module failed because medias upload failed.',
          }),
        });
        return;
      }
    },
    [
      cardModuleMedias,
      commit,
      webCard.id,
      data?.id,
      selectedCardModuleColor,
      variant,
      router,
      intl,
    ],
  );
  useImperativeHandle(ref, () => ({ save }), [save]);
  // #endRegion
  useEffect(() => {
    if (
      (data?.cardModuleColor?.background !==
        selectedCardModuleColor?.background ||
        data?.variant !== variant ||
        !isEqual(data.cardModuleMedias, cardModuleMedias)) &&
      cardModuleMedias.length > 0
    ) {
      setCanSave(true);
    } else {
      setCanSave(false);
    }
  }, [
    cardModuleMedias,
    data?.cardModuleColor?.background,
    data?.cardModuleMedias,
    data?.variant,
    selectedCardModuleColor?.background,
    setCanSave,
    variant,
  ]);

  const setData = useCallback((param: CardModuleData) => {
    if (param.cardModuleMedias) setCardModuleMedias(param.cardModuleMedias);
  }, []);

  return (
    <>
      <CardModulePreviewContainer
        displayMode={displayMode}
        dimension={dimension}
        backgroundColor={swapColor(
          selectedCardModuleColor?.background,
          webCard.cardColors,
        )}
        scaleFactor={scaleFactor}
      >
        <MediaModuleRenderer
          data={{
            cardModuleColor: selectedCardModuleColor,
            cardModuleMedias,
          }}
          cardStyle={webCard.cardStyle}
          colorPalette={webCard.cardColors ?? DEFAULT_COLOR_PALETTE}
          displayMode={displayMode}
          variant={variant}
          dimension={dimension}
          setEditableItemIndex={setEditableItemIndex}
          canPlay
        />
      </CardModulePreviewContainer>
      <CardModuleBottomBar
        cardModuleColor={selectedCardModuleColor}
        setModuleColor={setModuleColor}
        data={{ cardModuleMedias }}
        setData={setData}
        displayInitialModal={moduleKey === null}
        webCard={webCard}
        module={{ moduleKind: MODULE_KIND, variant }}
        setVariant={setVariant}
        setCanSave={setCanSave}
        editableItemIndex={editableItemIndex}
        setEditableItemIndex={setEditableItemIndex} //because useImperativeHandle is bad design and use in last resort
        defaultSearchValue={defaultSearchValue}
      />
    </>
  );
};

const MODULE_KIND = 'media';

export default withWebCardSection(forwardRef(MediaModuleWebCardScreen), {
  query: mediaModuleWebCardEditionScreenQuery,
  moduleKind: MODULE_KIND,
});
