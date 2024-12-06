import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ScreenModal } from '#components/NativeRouter';
import ToolBarContainer from '#components/Toolbar/ToolBarTransitioner';
import { TOOLBOX_SECTION_HEIGHT } from '#components/Toolbar/ToolBoxSection';
import {
  areCardModuleColorEqual,
  EMPTY_CARD_MODULE_COLOR,
  getInitalDyptichColor,
} from '#helpers/cardModuleColorsHelpers';
import { getCardModuleMediaKind } from '#helpers/cardModuleHelpers';
import useBoolean from '#hooks/useBoolean';
import CardModuleColorTool from './tool/CardModuleColorTool';
import CardModuleDesignTool from './tool/CardModuleDesignTool';
import CardModuleMediaPicker from './tool/CardModuleMediaPicker';
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

type CardModuleBottomBarProps<T extends ModuleKindAndVariant> = {
  /**
   * The Card Module Medias (can be null for some Module/Variant
   */
  cardModuleMedias?: CardModuleMedia[];
  /**
   * update the card module medias
   *
   */
  setCardModuleMedias?: React.Dispatch<React.SetStateAction<CardModuleMedia[]>>;
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
};

const CardModuleBottomBar = <T extends ModuleKindAndVariant>({
  cardModuleMedias,
  setCardModuleMedias,
  cardModuleColor,
  setModuleColor,
  displayInitialModal,
  webCard,
  module,
  setVariant,
  setCanSave,
  editableItemIndex,
  setEditableItemIndex,
}: CardModuleBottomBarProps<T>) => {
  // #region CardModuleMediaManagement
  const intl = useIntl();
  const [showImagePicker, , closeImagePicker] = useBoolean(displayInitialModal); //this can be decided based on ModuleKind/Variant
  const [showMediaToolbox, openMediaToolbox, closeMediaToolbox] =
    useBoolean(false);

  const onUpdateMedia = useCallback(
    (cardModuleMedia: CardModuleMedia) => {
      if (cardModuleMedias && setCardModuleMedias) {
        const updateCardMedias = [...cardModuleMedias];
        updateCardMedias[editableItemIndex!] = {
          ...cardModuleMedias[editableItemIndex!],
          ...cardModuleMedia,
          needDbUpdate: true,
        };
        setCardModuleMedias(updateCardMedias);
        setEditableItemIndex(null);
        if (updateCardMedias.length === 0) {
          setCanSave(false);
        }
      }
    },
    [
      cardModuleMedias,
      editableItemIndex,
      setCanSave,
      setCardModuleMedias,
      setEditableItemIndex,
    ],
  );

  const onFinishImagePicker = useCallback(
    (results: CardModuleMedia[]) => {
      if (cardModuleMedias && setCardModuleMedias) {
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

        setCardModuleMedias(mediaInfos);
        closeImagePicker();
      }
    },
    [
      cardModuleMedias,
      setCardModuleMedias,
      closeImagePicker,
      setCanSave,
      module,
      intl,
    ],
  );
  // removing media can be handle here, common to all module
  const handleRemoveMedia = (index: number) => {
    if (setCardModuleMedias)
      setCardModuleMedias(mediasPicked =>
        mediasPicked.filter((_, i) => i !== index),
      );
    setCanSave(true);
  };

  const videoSlotAvailable = useMemo(() => {
    // reduce the cardModuleMedias to count the number of video
    if (cardModuleMedias == null) {
      return 0;
    }
    const { maxVideo } = getMaxMedia(module);
    return (
      maxVideo -
      cardModuleMedias.reduce((count, { media }) => {
        if (getCardModuleMediaKind(media) === 'video') {
          return count + 1;
        }
        return count;
      }, 0)
    );
  }, [cardModuleMedias, module]);

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
        const initialColor = getInitalDyptichColor(
          { ...module, variant } as ModuleKindAndVariant,
          webCard.coverBackgroundColor ?? 'light',
        );
        if (!areCardModuleColorEqual(initialColor, EMPTY_CARD_MODULE_COLOR)) {
          updateModuleColor(initialColor);
        }
        setVariant(variant);
      }
    },
    [module, setVariant, updateModuleColor, webCard.coverBackgroundColor],
  );

  return (
    <>
      <View style={styles.bottomBarContainer}>
        <ScrollView
          horizontal
          contentContainerStyle={styles.scrollContentContainer}
          showsHorizontalScrollIndicator={false}
        >
          {hasCardModuleMedia(module, cardModuleMedias) && (
            <CardModuleMediaPickerToolbox
              mediaCount={cardModuleMedias.length}
              open={openMediaToolbox}
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
        {hasCardModuleMedia(module, cardModuleMedias) && (
          <>
            <ToolBarContainer visible={showMediaToolbox}>
              {/* responsible for displaying the list of media */}
              <CardModuleMediasToolbox
                cardModuleMedias={cardModuleMedias}
                close={closeMediaToolbox}
                handleRemoveMedia={handleRemoveMedia}
                onSelectMedia={setEditableItemIndex}
                {...getMaxMedia(module)}
                onUpdateMedias={onFinishImagePicker}
              />
            </ToolBarContainer>

            <ToolBarContainer destroyOnHide visible={editableItemIndex != null}>
              {/* responsible for displaying the option for a selected media*/}
              <CardModuleMediaEditToolbox
                module={module}
                cardModuleMedia={cardModuleMedias[editableItemIndex!]}
                onUpdateMedia={onUpdateMedia}
                availableVideoSlot={videoSlotAvailable}
                close={deselectMedia}
              />
            </ToolBarContainer>
          </>
        )}
      </View>
      {hasCardModuleMedia(module, cardModuleMedias) && (
        <ScreenModal
          visible={showImagePicker}
          animationType="slide"
          onRequestDismiss={closeImagePicker}
        >
          <CardModuleMediaPicker
            allowVideo
            initialMedias={cardModuleMedias}
            {...getMaxMedia(module)}
            onFinished={onFinishImagePicker}
            onClose={closeImagePicker}
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

export const DEFAULT_CARD_MODULE_TITLE = 'Lorem Ipsum';
export const DEFAULT_CARD_MODULE_TEXT = 'Lorem Ipsum';
