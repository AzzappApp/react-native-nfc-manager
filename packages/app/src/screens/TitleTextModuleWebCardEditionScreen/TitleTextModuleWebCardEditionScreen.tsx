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
import CardModuleBottomBar, {
  DEFAULT_CARD_MODULE_TEXT,
  DEFAULT_CARD_MODULE_TITLE,
} from '#components/cardModules/CardModuleBottomBar';
import TitleTextModuleRenderer from '#components/cardModules/CardModuleTitleText/TitleTextModuleRenderer';
import CardModulePreviewContainer from '#components/cardModules/tool/CardModulePreviewContainer';
import { useRouter } from '#components/NativeRouter';
import { getInitialDyptichColor } from '#helpers/cardModuleColorsHelpers';
import { handleOnCompletedModuleSave } from '#helpers/cardModuleHelpers';
import withWebCardSection from '../../components/cardModules/withCardModule';
import type { CardModuleData } from '#components/cardModules/CardModuleBottomBar';
import type { TitleTextModuleWebCardEditionScreen_module$key } from '#relayArtifacts/TitleTextModuleWebCardEditionScreen_module.graphql';
import type { TitleTextModuleWebCardEditionScreenMutation } from '#relayArtifacts/TitleTextModuleWebCardEditionScreenMutation.graphql';
import type {
  CardModuleProps,
  ModuleWebCardScreenHandle,
} from '../../components/cardModules/withCardModule';
import type { ForwardedRef } from 'react';

const TitleTextModuleWebCardEditionScreenQuery = graphql`
  query TitleTextModuleWebCardEditionScreenQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      ... on Profile {
        webCard {
          ...withCardModule_webCard
          cardModules {
            # { fetching directly the cardModule is less efficient , all modules are already in cache
            # and relay is not able to find it properly
            # module: cardModule(moduleId: $moduleId) {
            id
            ...TitleTextModuleWebCardEditionScreen_module
          }
        }
      }
    }
  }
`;

type TitleTextModuleWebCardEditionScreenProps = CardModuleProps<
  'titleText',
  TitleTextModuleWebCardEditionScreen_module$key
>;
const TitleTextModuleWebCardEditionScreen = (
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
  }: TitleTextModuleWebCardEditionScreenProps,
  ref: ForwardedRef<ModuleWebCardScreenHandle>,
) => {
  // #region hook
  const intl = useIntl();
  // #endregion

  /** @type {*} */
  const data = useFragment(
    graphql`
      fragment TitleTextModuleWebCardEditionScreen_module on CardModuleTitleText {
        id
        cardModuleColor {
          background
          content
          graphic
          text
          title
        }
        variant
        title
        text
      }
    `,
    moduleKey ?? null,
  );
  const [cardModuleTitleText, setCardModuleTitleText] = useState({
    text: data?.text ?? DEFAULT_CARD_MODULE_TEXT,
    title: data?.title ?? DEFAULT_CARD_MODULE_TITLE,
  });

  const [selectedCardModuleColor, setModuleColor] = useState<CardModuleColor>(
    data?.cardModuleColor ??
      getInitialDyptichColor(
        { moduleKind: MODULE_KIND, variant },
        webCard.coverBackgroundColor,
      ),
  );

  // #region Mutations and saving logic
  const [commit] = useMutation<TitleTextModuleWebCardEditionScreenMutation>(
    graphql`
      mutation TitleTextModuleWebCardEditionScreenMutation(
        $webCardId: ID!
        $input: SaveTitleTextModuleInput!
      ) {
        saveTitleTextModule(webCardId: $webCardId, input: $input) {
          webCard {
            id
            requiresSubscription
            cardModules {
              id
              kind
              visible
              variant
              ...TitleTextModuleWebCardEditionScreen_module
            }
          }
        }
      }
    `,
  );
  const router = useRouter();
  //the type of save was force to have uplaod data which break the initial definition of the function
  const save: ModuleWebCardScreenHandle['save'] = useCallback(async () => {
    try {
      await new Promise((resolve, reject) => {
        commit({
          variables: {
            webCardId: webCard.id,
            input: {
              cardModuleColor: selectedCardModuleColor,
              moduleId: data?.id,
              ...cardModuleTitleText,
              variant,
            },
          },
          onCompleted(_, error) {
            handleOnCompletedModuleSave(
              !data?.id,
              null,
              router,
              error,
              intl.formatMessage({
                defaultMessage: 'Error while creating module title text',
                description:
                  'Toast Error message while creating module title text',
              }),
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
          defaultMessage: 'Could not save your Title Text module',
          description:
            'Error toast message when saving a carousel module failed because medias upload failed.',
        }),
      });
      return;
    }
  }, [
    commit,
    webCard.id,
    selectedCardModuleColor,
    data?.id,
    cardModuleTitleText,
    variant,
    router,
    intl,
  ]);

  useImperativeHandle(ref, () => ({
    save, //WHY DID THIS TYPE CHANGED WITHOUT THINKING ABOUT THE CONSEQUENCES
  }));

  // #endRegion
  useEffect(() => {
    //remove id from comparison

    if (
      !isEqual(data, {
        id: data?.id,
        cardModuleColor: selectedCardModuleColor,
        title: cardModuleTitleText.title,
        text: cardModuleTitleText.text,
        variant,
      })
    ) {
      //from Nico, we allow to save even if the user has not define text/title per media
      setCanSave(true);
    } else {
      setCanSave(false);
    }
  }, [
    cardModuleTitleText.text,
    cardModuleTitleText.title,
    data,
    selectedCardModuleColor,
    selectedCardModuleColor.background,
    setCanSave,
    variant,
  ]);

  const setData = useCallback((param: CardModuleData) => {
    if (param.cardModuleTitleText)
      setCardModuleTitleText(param.cardModuleTitleText);
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
        <TitleTextModuleRenderer
          data={{
            cardModuleColor: selectedCardModuleColor,
            ...cardModuleTitleText,
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
        data={{ cardModuleTitleText }}
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

const MODULE_KIND = 'titleText';

export default withWebCardSection(
  forwardRef(TitleTextModuleWebCardEditionScreen),
  {
    query: TitleTextModuleWebCardEditionScreenQuery,
    moduleKind: MODULE_KIND,
  },
);
