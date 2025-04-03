import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ScreenModal } from '#components/NativeRouter';
import ToolBarContainer from '#components/Toolbar/ToolBarTransitioner';
import { TOOLBOX_SECTION_HEIGHT } from '#components/Toolbar/ToolBoxSection';
import {
  areCardModuleColorEqual,
  EMPTY_CARD_MODULE_COLOR,
  getInitialDyptichColor,
} from '#helpers/cardModuleColorsHelpers';
import { getCardModuleMediaKind } from '#helpers/cardModuleHelpers';
import useBoolean from '#hooks/useBoolean';
import CardModuleColorTool from './tool/CardModuleColorTool';
import CardModuleDesignTool from './tool/CardModuleDesignTool';
import CardModuleMediaPicker from './tool/CardModuleMediaPicker';
import CardModuleTitleTextTool from './tool/CardModuleTitleTextTool';
import CardModuleMediaEditToolbox from './toolbox/CardModuleMediaEditToolbox';
import CardModuleMediaPickerToolbox from './toolbox/CardModuleMediaPickerToolbox';
import CardModuleMediasToolbox from './toolbox/CardModuleMediasToolbox';
import type {
  ModuleKindAndVariant,
  Variant,
} from '#helpers/webcardModuleHelpers';
import type { withCardModule_webCard$data } from '#relayArtifacts/withCardModule_webCard.graphql';
import type { CardModuleMedia } from './cardModuleEditorType';
import type { CardModuleColor } from '@azzapp/shared/cardModuleHelpers';
import type { IntlShape } from 'react-intl';

export type CardModuleData = {
  cardModuleMedias?: CardModuleMedia[];
  cardModuleTitleText?: { title: string; text: string };
};
type CardModuleBottomBarProps<T extends ModuleKindAndVariant> = {
  /**
   * The Card Module Medias (can be null for some Module/Variant
   */
  data: {
    cardModuleMedias?: CardModuleMedia[];
    cardModuleTitleText?: { title: string; text: string };
  };
  /**
   * update the card module medias
   *
   */
  setData: (param: CardModuleData) => void;
  /**
   * the moduleColor use by all module
   *
   */
  cardModuleColor: CardModuleColor;
  /**
   *  update the module colors‡
   */
  setModuleColor: React.Dispatch<React.SetStateAction<CardModuleColor>>;
  /**
   * IF we need to display an initial modal content (based on module/variant)
   *
   */
  displayInitialModal: boolean;
  /**
   * The webCard data
   *
   */
  webCard: withCardModule_webCard$data;
  /**
   * The module / variant
   *
   */
  module: T;

  setVariant: (variant: Variant<T['moduleKind']>) => void;
  /**
   * Set the canSave state to enable the save button on top level
   *
   */
  setCanSave: (canSave: boolean) => void;

  editableItemIndex: number | null;
  setEditableItemIndex: (index: number | null) => void;

  defaultSearchValue?: string | null;
};

const CardModuleBottomBar = <T extends ModuleKindAndVariant>({
  data,
  setData,
  cardModuleColor,
  setModuleColor,
  displayInitialModal,
  webCard,
  module,
  setVariant,
  setCanSave,
  editableItemIndex,
  setEditableItemIndex,
  defaultSearchValue,
}: CardModuleBottomBarProps<T>) => {
  // #region CardModuleMediaManagement
  const intl = useIntl();
  const [showImagePicker, , closeImagePicker] = useBoolean(displayInitialModal); //this can be decided based on ModuleKind/Variant
  const [showMediaToolbox, openMediaToolbox, closeMediaToolbox] =
    useBoolean(false);

  const onUpdateMedia = useCallback(
    (cardModuleMedia: CardModuleMedia) => {
      if (data.cardModuleMedias && setData) {
        const updateCardMedias = [...data.cardModuleMedias];
        updateCardMedias[editableItemIndex!] = {
          ...data.cardModuleMedias[editableItemIndex!],
          ...cardModuleMedia,
          needDbUpdate: true,
        };
        setData({ cardModuleMedias: updateCardMedias });
        if (updateCardMedias.length === 0) {
          setCanSave(false);
        }
      }
    },
    [data.cardModuleMedias, editableItemIndex, setCanSave, setData],
  );

  const onFinishImagePicker = useCallback(
    (results: CardModuleMedia[]) => {
      if (data.cardModuleMedias && setData) {
        const { cardModuleMedias } = data;
        const mediaInfos: CardModuleMedia[] = [];

        results.forEach(mediaMod => {
          const mediaInfo = cardModuleMedias.find(
            info => info.media.uri === mediaMod.media.uri,
          );
          if (mediaInfo) {
            mediaInfos.push(mediaInfo);
            return;
          } else {
            setCanSave(true);
            if (mediaMod.media.kind === 'video') {
              mediaInfos.push({
                media: {
                  ...mediaMod.media,
                  filter: null,
                  editionParameters: null,
                  timeRange: {
                    duration: Math.min(mediaMod.media.duration, 15),
                    startTime: 0,
                  },
                },
                ...getDefaultModuleMediaContent(module, intl),
                needDbUpdate: true,
              });
            } else {
              mediaInfos.push({
                media: {
                  ...mediaMod.media,
                  filter: null,
                  editionParameters: null,
                },
                ...getDefaultModuleMediaContent(module, intl),
                needDbUpdate: true,
              });
            }
          }
        });

        setData({ cardModuleMedias: mediaInfos });
        closeImagePicker();
      }
    },
    [data, setData, closeImagePicker, setCanSave, module, intl],
  );
  // removing media can be handle here, common to all module
  const handleRemoveMedia = (index: number) => {
    if (setData)
      setData({
        cardModuleMedias: data.cardModuleMedias?.filter((_, i) => i !== index),
      });
    setCanSave(true);
    // workaround for this issue: software-mansion/react-native-gesture-handler#3282
    // both click on cross and image are received
    // here we force closing the selected item (which will be deleted in parallel)
    setEditableItemIndex(null);
  };

  const videoSlotAvailable = useMemo(() => {
    // reduce the cardModuleMedias to count the number of video
    if (data.cardModuleMedias == null) {
      return 0;
    }
    const { maxVideo } = getMaxMedia(module);
    return (
      maxVideo -
      data.cardModuleMedias.reduce((count, { media }) => {
        if (getCardModuleMediaKind(media) === 'video') {
          return count + 1;
        }
        return count;
      }, 0)
    );
  }, [data.cardModuleMedias, module]);

  const deselectMedia = useCallback(() => {
    setEditableItemIndex(null);
  }, [setEditableItemIndex]);
  // #endregion

  //region Module color
  const updateModuleColor = useCallback(
    (moduleColor: CardModuleColor) => {
      setModuleColor(moduleColor);
      if (moduleColor) setCanSave(true);
    },
    [setCanSave, setModuleColor],
  );
  //#endregion

  const updateVariant = useCallback(
    (variant: Variant<T['moduleKind']>) => {
      if (variant !== module.variant) {
        //reset the default couleur when changing variant
        const initialColor = getInitialDyptichColor(
          { ...module, variant } as ModuleKindAndVariant,
          webCard.coverBackgroundColor ?? 'light',
        );
        if (
          shouldUpdateCardModuleColors(module) &&
          !areCardModuleColorEqual(initialColor, EMPTY_CARD_MODULE_COLOR)
        ) {
          updateModuleColor(initialColor);
        }
        setVariant(variant);
      }
    },
    [module, setVariant, updateModuleColor, webCard.coverBackgroundColor],
  );

  const onUpdateTitleText = useCallback(
    (param: CardModuleData) => {
      setData(param);
      setEditableItemIndex(null);
    },
    [setData, setEditableItemIndex],
  );

  return (
    <>
      <View style={styles.bottomBarContainer}>
        <ScrollView
          horizontal
          contentContainerStyle={styles.scrollContentContainer}
          showsHorizontalScrollIndicator={false}
        >
          {hasCardModuleMedia(module, data.cardModuleMedias) && (
            <CardModuleMediaPickerToolbox
              cardModuleMedias={data.cardModuleMedias}
              open={openMediaToolbox}
              module={module}
            />
          )}
          {module.moduleKind === 'titleText' && (
            // kind of duplicate of the CardModuleMediaTextTool but the text is not defined by media
            // this will add complexity on CardModuleMediaTextTool and potential bug
            // don't want to complicate this part and will be use for futur feature like button
            <CardModuleTitleTextTool
              module={module}
              {...data}
              onUpdate={onUpdateTitleText}
              openTextEdition={editableItemIndex != null}
            />
          )}
          <CardModuleColorTool
            cardColors={webCard.cardColors!}
            cardModuleColor={cardModuleColor}
            onModuleColorChange={updateModuleColor}
            module={module}
          />
          <CardModuleDesignTool module={module} setVariant={updateVariant} />
        </ScrollView>
        {hasCardModuleMedia(module, data.cardModuleMedias) && (
          <>
            <ToolBarContainer visible={showMediaToolbox}>
              {/* responsible for displaying the list of media */}
              <CardModuleMediasToolbox
                module={module}
                cardModuleMedias={data.cardModuleMedias}
                close={closeMediaToolbox}
                handleRemoveMedia={handleRemoveMedia}
                onSelectMedia={setEditableItemIndex}
                {...getMaxMedia(module)}
                onUpdateMedias={onFinishImagePicker}
              />
            </ToolBarContainer>

            <ToolBarContainer destroyOnHide visible={editableItemIndex != null}>
              {/* responsible for displaying the option for a selected media*/}
              {editableItemIndex !== null &&
              data.cardModuleMedias[editableItemIndex] ? (
                <CardModuleMediaEditToolbox
                  module={module}
                  cardModuleMedia={data.cardModuleMedias[editableItemIndex]}
                  onUpdateMedia={onUpdateMedia}
                  availableVideoSlot={videoSlotAvailable}
                  close={deselectMedia}
                  defaultSearchValue={defaultSearchValue}
                  index={editableItemIndex}
                />
              ) : undefined}
            </ToolBarContainer>
          </>
        )}
      </View>
      {hasCardModuleMedia(module, data.cardModuleMedias) && (
        <ScreenModal
          visible={showImagePicker}
          animationType="slide"
          onRequestDismiss={closeImagePicker}
        >
          <CardModuleMediaPicker
            allowVideo
            initialMedias={data.cardModuleMedias}
            {...getMaxMedia(module)}
            onFinished={onFinishImagePicker}
            onClose={closeImagePicker}
            defaultSearchValue={defaultSearchValue}
          />
        </ScreenModal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  bottomBarContainer: {
    height: TOOLBOX_SECTION_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center', // Center items horizontally
  },
  scrollContentContainer: {
    flex: 1,
    gap: 10,
    height: TOOLBOX_SECTION_HEIGHT,
    justifyContent: 'center',
  },
});

function hasCardModuleMedia<T>(_module: ModuleKindAndVariant, value: T) {
  return value != null;
}

const getMaxMedia = (_module: ModuleKindAndVariant) => {
  return { maxMedia: 10, maxVideo: 3 };
};

export default CardModuleBottomBar;

//provide the default value for text, link etc to allow to save with default text
//Lorem Ipsum on purpose, not have to save it
const getDefaultModuleMediaContent = (
  module: ModuleKindAndVariant,
  intl: IntlShape,
) => {
  const { moduleKind } = module;
  switch (moduleKind) {
    case 'mediaText': {
      return {
        title: DEFAULT_CARD_MODULE_TITLE,
        text: DEFAULT_CARD_MODULE_TEXT,
      };
    }
    case 'mediaTextLink':
      return {
        title: DEFAULT_CARD_MODULE_TITLE,
        text: DEFAULT_CARD_MODULE_TEXT,
        link: {
          url: '',
          label: intl.formatMessage({
            defaultMessage: 'Open',
            description:
              'CardModuleTextLink - default message for button action',
          }),
        },
      };
  }
  return '';
};

// this method help to determine if the CardModuleColor should be udpate when variant is changed.
// most of the time, each variant has default tryptich and color
const shouldUpdateCardModuleColors = (module: ModuleKindAndVariant) => {
  if (module.moduleKind === 'titleText') {
    return false;
  }
  return true;
};

export const DEFAULT_CARD_MODULE_TITLE = 'Lorem ipsum dolor';
export const DEFAULT_CARD_MODULE_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
