import * as Sentry from '@sentry/react-native';
import { isEqual } from 'lodash';
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
import ERRORS from '@azzapp/shared/errors';
import CardModuleBottomBar from '#components/cardModules/CardModuleBottomBar';
import MediaTextModuleRenderer from '#components/cardModules/CardModuleMediaText/MediaTextModuleRenderer';
import CardModulePreviewContainer from '#components/cardModules/tool/CardModulePreviewContainer';
import { useRouter } from '#components/NativeRouter';
import { getInitalDyptichColor } from '#helpers/cardModuleColorsHelpers';
import {
  convertModuleMediaRelay,
  handleOnCompletedModuleSave,
  handleUploadCardModuleMedia,
} from '#helpers/cardModuleHelpers';
import withWebCardSection from '../../components/cardModules/withCardModule';
import type { CardModuleData } from '#components/cardModules/CardModuleBottomBar';
import type { CardModuleMedia } from '#components/cardModules/cardModuleEditorType';
import type { MediaTextModuleWebCardEditionScreen_module$key } from '#relayArtifacts/MediaTextModuleWebCardEditionScreen_module.graphql';
import type { MediaTextModuleWebCardEditionScreenMutation } from '#relayArtifacts/MediaTextModuleWebCardEditionScreenMutation.graphql';
import type {
  CardModuleProps,
  ModuleWebCardScreenHandle,
} from '../../components/cardModules/withCardModule';
import type { ForwardedRef } from 'react';

const mediaTextModuleWebCardEditionScreenQuery = graphql`
  query MediaTextModuleWebCardEditionScreenQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      ... on Profile {
        webCard {
          ...withCardModule_webCard
          cardModules {
            # { fetching directly the cardModule is less efficient , all modules are already in cache
            # and relay is not able to find it properly
            # module: cardModule(moduleId: $moduleId) {
            id
            ...MediaTextModuleWebCardEditionScreen_module
          }
        }
      }
    }
  }
`;

type MediaTextModuleWebCardEditionScreenProps = CardModuleProps<
  'mediaText',
  MediaTextModuleWebCardEditionScreen_module$key
>;
const MediaTextModuleWebCardEditionScreen = (
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
  }: MediaTextModuleWebCardEditionScreenProps,
  ref: ForwardedRef<ModuleWebCardScreenHandle>,
) => {
  // #region hook
  const intl = useIntl();
  // #endregion

  /** @type {*} */
  const data = useFragment(
    graphql`
      fragment MediaTextModuleWebCardEditionScreen_module on CardModuleMediaText
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
          text
          title
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

  const [selectedCardModuleColor, setModuleColor] = useState<CardModuleColor>(
    data?.cardModuleColor ??
      getInitalDyptichColor(
        { moduleKind: MODULE_KIND, variant },
        webCard.coverBackgroundColor,
      ),
  );

  // #region Mutations and saving logic
  const [commit] = useMutation<MediaTextModuleWebCardEditionScreenMutation>(
    graphql`
      mutation MediaTextModuleWebCardEditionScreenMutation(
        $webCardId: ID!
        $input: SaveMediaTextModuleInput!
      ) {
        saveMediaTextModule(webCardId: $webCardId, input: $input) {
          webCard {
            id
            requiresSubscription
            cardModules {
              id
              kind
              visible
              variant
              ...MediaTextModuleWebCardEditionScreen_module
            }
          }
        }
      }
    `,
  );
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
                cardModuleMedias: moduleMedias.map(mediaMod => ({
                  text: mediaMod.text,
                  title: mediaMod.title,
                  media: {
                    id: mediaMod.media.id,
                  },
                })),
                variant,
              },
            },
            onCompleted(_, error) {
              handleOnCompletedModuleSave(
                moduleMedias,
                router,
                error,
                intl.formatMessage({
                  defaultMessage: 'Error while creating module',
                  description: 'Toast Error message while creating module',
                }),
              );
              if (error) {
                reject(error);
                return;
              }
              resolve(null);
            },
            onError(error) {
              if (error.message === ERRORS.SUBSCRIPTION_REQUIRED) {
                Toast.show({
                  type: 'error',
                  text1: intl.formatMessage({
                    defaultMessage:
                      'You need a subscription to add this module.',
                    description:
                      'Error toast message when trying to add a module without a subscription.',
                  }),
                });
                return;
              } else {
                Sentry.captureException(error);
                Toast.show({
                  type: 'error',
                  text1: intl.formatMessage({
                    defaultMessage: 'Error while saving your new module.',
                    description:
                      'Error toast message when saving a new module failed.',
                  }),
                });
              }
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
              'Could not save your Media Text module, medias upload failed',
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

  useImperativeHandle(ref, () => ({
    save,
  }));

  // #endRegion
  useEffect(() => {
    if (
      cardModuleMedias.length > 0 &&
      !isEqual(data, {
        id: data?.id,
        selectedCardModuleColor,
        cardModuleMedias,
        variant,
      })
    ) {
      //from Nico, we allow to save even if the user has not define text/title per media
      setCanSave(true);
    } else {
      setCanSave(false);
    }
  }, [
    cardModuleMedias,
    data,
    data?.cardModuleColor,
    selectedCardModuleColor,
    selectedCardModuleColor.background,
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
          selectedCardModuleColor.background,
          webCard.cardColors,
        )}
        scaleFactor={scaleFactor}
      >
        <MediaTextModuleRenderer
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
        setEditableItemIndex={setEditableItemIndex}
        defaultSearchValue={defaultSearchValue}
      />
    </>
  );
};

const MODULE_KIND = 'mediaText';

export default withWebCardSection(
  forwardRef(MediaTextModuleWebCardEditionScreen),
  {
    query: mediaTextModuleWebCardEditionScreenQuery,
    moduleKind: MODULE_KIND,
  },
);
