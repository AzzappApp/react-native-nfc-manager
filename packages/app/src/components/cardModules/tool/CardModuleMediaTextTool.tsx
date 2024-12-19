import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { DoneHeaderButton } from '#components/commonsButtons';
import { MediaImageRenderer } from '#components/medias';
import ToolBoxSection from '#components/Toolbar/ToolBoxSection';
import useBoolean from '#hooks/useBoolean';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import BottomSheetTextInput from '#ui/BottomSheetTextInput';
import Header from '#ui/Header';
import Text from '#ui/Text';
import {
  DEFAULT_CARD_MODULE_TEXT,
  DEFAULT_CARD_MODULE_TITLE,
} from '../CardModuleBottomBar';
import type { ModuleKindAndVariant } from '#helpers/webcardModuleHelpers';
import type { CardModuleMedia } from '../cardModuleEditorType';

type CardModuleMediaTextToolProps<T extends ModuleKindAndVariant> = {
  module: T;
  cardModuleMedia: CardModuleMedia;
  onUpdateMedia: (cmm: CardModuleMedia) => void;
};

const CardModuleMediaTextTool = <T extends ModuleKindAndVariant>({
  module,
  cardModuleMedia,
  onUpdateMedia,
}: CardModuleMediaTextToolProps<T>) => {
  const intl = useIntl();
  const [show, open, close] = useBoolean(false);

  //keep a local ref value, don't commit to the data until the user press done(avoid rerender/blink/side effect)
  //this is far more better that using the value props in textInput, juste use defaultValue for initial setrting
  // in this case just save on close, text is hidden by the modal
  const [text, setText] = useState(cardModuleMedia.text);
  const [title, setTitle] = useState(cardModuleMedia.title);
  const [linkUrl, setLinkUrl] = useState(cardModuleMedia.link?.url);
  const [linkAction, setLinkAction] = useState(cardModuleMedia.link?.label);

  const actionLabel = intl.formatMessage({
    defaultMessage: 'Open',
    description: 'Link action placeholder in design module text tool',
  });

  const onDismiss = () => {
    onUpdateMedia({
      ...cardModuleMedia,
      text,
      title,
      link: {
        url: linkUrl ?? '',
        label: linkAction ?? actionLabel,
      },
    });
    close();
  };

  const { bottom: bottomInset } = useScreenInsets();

  if (!isVisible(module)) {
    return null;
  }

  return (
    <>
      <ToolBoxSection
        label={intl.formatMessage({
          defaultMessage: 'Text',
          description: 'Card Module Design Tool - Toolbox design',
        })}
        icon="bloc_text"
        onPress={open}
      />
      <BottomSheetModal
        visible={show}
        onDismiss={onDismiss}
        nestedScroll
        bottomInset={bottomInset}
      >
        <BottomSheetScrollView style={styles.container}>
          <Header
            middleElement={intl.formatMessage({
              defaultMessage: 'Design',
              description: 'CardModuleDesignTool - Bottom Sheet header',
            })}
            style={styles.header}
            rightElement={<DoneHeaderButton onPress={onDismiss} />}
          />
          {module.moduleKind === 'mediaTextLink' && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MediaImageRenderer
                source={{
                  uri:
                    cardModuleMedia.media.galleryUri ??
                    cardModuleMedia.media.smallThumbnail ??
                    cardModuleMedia.media.thumbnail ??
                    cardModuleMedia.media.uri,
                  requestedSize: 66,
                  mediaId: cardModuleMedia.media.id,
                }}
                fit="cover"
                style={styles.previewContent}
              />
              <BottomSheetTextInput
                placeholder={intl.formatMessage({
                  defaultMessage: 'Enter your url',
                  description: 'Url placeholder in design module text tool',
                })}
                defaultValue={linkUrl}
                onChangeText={setLinkUrl}
                style={{ flex: 1 }}
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
          )}
          <Text variant="button" style={{ paddingTop: 10, paddingBottom: 5 }}>
            <FormattedMessage
              defaultMessage="Title & description"
              description="CardModuleMediaTextTool - Title and description"
            />
          </Text>
          <BottomSheetTextInput
            multiline
            placeholder={intl.formatMessage({
              defaultMessage: 'Enter your title',
              description: 'Title placeholder in design module text tool',
            })}
            defaultValue={title}
            onChangeText={setTitle}
            style={styles.titleStyle}
            clearTextOnFocus={title === DEFAULT_CARD_MODULE_TITLE}
          />
          <BottomSheetTextInput
            multiline
            placeholder={intl.formatMessage({
              defaultMessage: 'Enter your description',
              description:
                'Text description placeholder in design module text tool',
            })}
            defaultValue={text}
            onChangeText={setText}
            style={styles.textStyle}
            clearTextOnFocus={text === DEFAULT_CARD_MODULE_TEXT}
          />
          {module.moduleKind === 'mediaTextLink' && (
            <>
              <Text variant="button" style={styles.textAction}>
                <FormattedMessage
                  defaultMessage="Action name (if button displayed)"
                  description="CardModuleMediaTextTool - link action"
                />
              </Text>
              <BottomSheetTextInput
                placeholder={actionLabel}
                defaultValue={linkAction}
                onChangeText={setLinkAction}
                style={styles.titleStyle}
                autoCorrect={false}
              />
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
};

const isVisible = (module: ModuleKindAndVariant) => {
  switch (module.moduleKind) {
    case 'mediaText':
      return true;
    case 'mediaTextLink':
      return true;
  }
  return false;
};

export default CardModuleMediaTextTool;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  header: { marginBottom: 15 },
  textAction: { paddingTop: 10, paddingBottom: 5 },
  titleStyle: { borderWidth: 0, height: 50 },
  textStyle: { borderWidth: 0, height: 200, marginTop: 10 },
  previewContent: {
    height: 47,
    width: 47,
    borderRadius: 8,
  },
});
